import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import ReactGridLayout, { getCompactor, type Layout, type LayoutItem, useContainerWidth } from "react-grid-layout";
import { useNavigate } from "react-router-dom";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore } from "../store/useUiStore";
import type { Box } from "../types";
import { BoxTile } from "./BoxTile";
import { GridMinimap } from "./GridMinimap";

export const EXTRA_LEFT_COLS = 4;

// Rows of empty "scratch space" reserved above the topmost box so boxes can be dragged upward into
// negative-y territory. Adaptive: just enough to clear the highest box (most-negative y) plus one
// buffer row, so the grid hugs the content instead of leaving a fixed gap. Returns 1 when every box
// sits at y >= 0. Grows automatically when a box is dragged higher (its y goes more negative).
// Replaces the old fixed `EXTRA_TOP_ROWS = 14`.
export function topRowPadding(boxes: Box[]): number {
  const minY = boxes.reduce((min, box) => Math.min(min, box.layout.y), 0);
  return Math.max(0, -minY) + 1;
}
export const MAP_BASE_COL_WIDTH = 48;
// Base pixels per grid row. Tuned so a 2-row-tall box (the smallest common box) still has
// room for its name plus two plant rows without the text spilling past the border.
export const MAP_BASE_ROW_HEIGHT = 40;
// Base gap (px at zoom 1) between grid cells; scaled by zoom alongside col/row size.
export const MAP_BASE_MARGIN = 8;
// Smallest box a user can resize to — below this the name/plant text can't render legibly.
export const MIN_BOX_UNITS = 2;
export const MIN_MAP_ZOOM = 0.2;
export const MAX_MAP_ZOOM = 1.2;
const BOTTOM_SPACER_KEY = "__bottom_spacer__";

// Remember the grid viewport scroll across SPA route changes (e.g. opening a box and pressing
// "Tilbake") so returning to the map keeps the same box under the cursor instead of snapping to
// the origin. Module-level (not a ref) so it survives the unmount/remount of a route change, but
// resets on a full page reload — matching the intent that only in-session back-nav is anchored.
let savedViewportScroll: { left: number; top: number } | null = null;

interface GardenGridProps {
  editMode: boolean;
  zoom: number;
  /** Called with the next zoom value from a cursor-anchored wheel/pinch zoom (Ctrl/⌘ + wheel). */
  onZoomChange?: (next: number) => void;
  /** Increment to fit the whole grid into the viewport (both axes) — "Tilpass". */
  fitNonce?: number;
  onLongPressBox?: (boxId: string) => void;
}

/** Focal point captured at the start of a cursor-anchored zoom, applied after the re-layout. */
interface ZoomFocal {
  ratioX: number;
  ratioY: number;
  pointerX: number;
  pointerY: number;
}

export function GardenGrid({ editMode, zoom, onZoomChange, fitNonce, onLongPressBox }: GardenGridProps) {
  const { boxes, plantings, saveGridLayout } = useGardenStore();
  const topPad = topRowPadding(boxes);
  const gridSize = useUiStore((state) => state.gridSize);
  const navigate = useNavigate();
  const { width, containerRef, mounted } = useContainerWidth();
  const debugGrid = new URLSearchParams(window.location.search).has("debugGrid");
  const colWidth = Math.max(8, Math.round(MAP_BASE_COL_WIDTH * zoom));
  const rowHeight = Math.max(6, Math.round(MAP_BASE_ROW_HEIGHT * zoom));
  const margin = Math.max(1, Math.round(MAP_BASE_MARGIN * zoom));
  const gridWidth = gridSize.cols * colWidth;
  const gridHeightPx = gridSize.rows * (rowHeight + margin);

  // Cursor-anchored zoom. The grid re-lays-out by scaling cell size (not a CSS transform), so to keep
  // the point under the cursor stationary we capture its position as a fraction of the scroll extent
  // before zooming, then restore scrollLeft/scrollTop against the new extent after the re-render.
  const viewportRef = useRef<HTMLDivElement>(null);
  const pendingFocal = useRef<ZoomFocal | null>(null);
  const zoomRef = useRef(zoom);
  const onZoomChangeRef = useRef(onZoomChange);
  const gridSizeRef = useRef(gridSize);
  // Keep the latest zoom + callback + grid size reachable from listeners/effects without re-binding.
  useEffect(() => {
    zoomRef.current = zoom;
    onZoomChangeRef.current = onZoomChange;
    gridSizeRef.current = gridSize;
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const handleWheel = (event: WheelEvent) => {
      // Mac trackpad pinch fires wheel + ctrlKey; ⌘ covers explicit zoom intent. Plain wheel scrolls.
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      const onZoom = onZoomChangeRef.current;
      if (!onZoom) {
        return;
      }
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
      const next = Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, Number((zoomRef.current * factor).toFixed(2))));
      if (next === zoomRef.current) {
        return;
      }
      const rect = viewport.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      pendingFocal.current = {
        ratioX: viewport.scrollWidth > 0 ? (viewport.scrollLeft + pointerX) / viewport.scrollWidth : 0,
        ratioY: viewport.scrollHeight > 0 ? (viewport.scrollTop + pointerY) / viewport.scrollHeight : 0,
        pointerX,
        pointerY,
      };
      onZoom(next);
    };
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const focal = pendingFocal.current;
    if (!viewport || !focal) {
      return;
    }
    pendingFocal.current = null;
    viewport.scrollLeft = focal.ratioX * viewport.scrollWidth - focal.pointerX;
    viewport.scrollTop = focal.ratioY * viewport.scrollHeight - focal.pointerY;
  }, [zoom]);

  // Keep the remembered scroll position current as the user pans the grid.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const handleScroll = () => {
      savedViewportScroll = { left: viewport.scrollLeft, top: viewport.scrollTop };
    };
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore that position once, after the grid has measured on (re)mount — so returning from a box
  // lands on the same view rather than the origin. Runs before paint to avoid a visible jump.
  const didRestoreScroll = useRef(false);
  useLayoutEffect(() => {
    if (!mounted || didRestoreScroll.current) {
      return;
    }
    didRestoreScroll.current = true;
    const viewport = viewportRef.current;
    if (viewport && savedViewportScroll) {
      viewport.scrollLeft = savedViewportScroll.left;
      viewport.scrollTop = savedViewportScroll.top;
    }
  }, [mounted]);

  // "Tilpass" — fit all columns into the viewport width (vertical scrolls), framed from the origin.
  // Margin-aware so the columns don't spill past the edge; uses the real viewport, not the window.
  useEffect(() => {
    if (!fitNonce) {
      return;
    }
    const viewport = viewportRef.current;
    const onZoom = onZoomChangeRef.current;
    if (!viewport || !onZoom) {
      return;
    }
    const { cols } = gridSizeRef.current;
    const fitWidth = viewport.clientWidth / (cols * (MAP_BASE_COL_WIDTH + MAP_BASE_MARGIN));
    const next = Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, Number(fitWidth.toFixed(2))));
    // Reuse the focal mechanism to snap the view back to the origin after the re-layout.
    pendingFocal.current = { ratioX: 0, ratioY: 0, pointerX: 0, pointerY: 0 };
    onZoom(next);
  }, [fitNonce]);
  const layout: Layout = boxes.map((box) => ({
    i: box.id,
    x: box.layout.x + EXTRA_LEFT_COLS,
    y: Math.max(-topPad, box.layout.y) + topPad,
    w: box.layout.w,
    h: box.layout.h,
    minW: MIN_BOX_UNITS,
    minH: MIN_BOX_UNITS,
  }));
  const activeBoxIds = useMemo(
    () =>
      new Set(
        plantings.flatMap((planting) => (planting.status === "active" && planting.boxId ? [planting.boxId] : [])),
      ),
    [plantings],
  );
  const maxBottomY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  const spacerY = Math.max(maxBottomY, gridSize.rows - 1);
  const layoutWithSpacer: Layout = [
    ...layout,
    {
      i: BOTTOM_SPACER_KEY,
      x: gridSize.cols - 1,
      y: spacerY,
      w: 1,
      h: 1,
      static: true,
    },
  ];

  const persistLayout = (newLayout: Layout) => {
    if (!editMode) {
      return;
    }
    saveGridLayout(
      newLayout
        .filter((item) => item.i !== BOTTOM_SPACER_KEY)
        .map((item: LayoutItem) => ({
          i: item.i,
          x: item.x - EXTRA_LEFT_COLS,
          y: Math.max(-topPad, item.y - topPad),
          w: item.w,
          h: item.h,
        })),
    );
  };

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        className="w-full overflow-auto overscroll-contain pb-2"
        style={{ height: `min(70vh, ${gridHeightPx + 16}px)` }}
      >
        <div ref={containerRef} style={{ width: `${gridWidth}px` }}>
        {mounted && (
          <ReactGridLayout
            key={`${editMode ? "edit" : "view"}-${gridSize.cols}x${gridSize.rows}`}
            className="layout"
            width={Math.max(width, gridWidth)}
            layout={layoutWithSpacer}
            gridConfig={{ cols: gridSize.cols, rowHeight, margin: [margin, margin] }}
            dragConfig={{ enabled: editMode }}
            resizeConfig={{ enabled: editMode, handles: ["se"] }}
            compactor={getCompactor(null, false, true)}
            onDragStart={() => {
              if (debugGrid) {
                console.info("[GardenGrid] drag start");
              }
            }}
            onDragStop={(newLayout) => {
              persistLayout(newLayout);
              if (debugGrid) {
                console.info("[GardenGrid] drag stop");
              }
            }}
            onResizeStart={() => {
              if (debugGrid) {
                console.info("[GardenGrid] resize start");
              }
            }}
            onResizeStop={(newLayout) => {
              persistLayout(newLayout);
              if (debugGrid) {
                console.info("[GardenGrid] resize stop");
              }
            }}
          >
            {boxes.map((box) => {
              const activePlantings = plantings.filter((planting) => planting.boxId === box.id && planting.status === "active");
              return (
                <div key={box.id}>
                  <BoxTile
                    box={box}
                    activePlantings={activePlantings}
                    editMode={editMode}
                    onClick={() => {
                      if (!editMode) {
                        navigate({ pathname: `/box/${box.id}`, search: window.location.search });
                      }
                    }}
                    onLongPress={onLongPressBox ? () => onLongPressBox(box.id) : undefined}
                  />
                </div>
              );
            })}
            <div key={BOTTOM_SPACER_KEY} className="pointer-events-none opacity-0" />
          </ReactGridLayout>
        )}
        </div>
      </div>
      <GridMinimap
        viewportRef={viewportRef}
        layout={layout}
        activeBoxIds={activeBoxIds}
        colWidth={colWidth}
        rowHeight={rowHeight}
        margin={margin}
        zoom={zoom}
      />
    </div>
  );
}
