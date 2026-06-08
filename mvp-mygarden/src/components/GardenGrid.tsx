import ReactGridLayout, { getCompactor, type Layout, type LayoutItem, useContainerWidth } from "react-grid-layout";
import { useNavigate } from "react-router-dom";
import { LEGACY_GRID_COLS } from "../lib/importLegacy";
import { useGardenStore } from "../store/useGardenStore";
import { BoxTile } from "./BoxTile";

const EXTRA_LEFT_COLS = 4;
const EXTRA_RIGHT_COLS = 8;
const EXTRA_TOP_ROWS = 14;
const EXTRA_BOTTOM_ROWS = 12;
export const GRID_TOTAL_COLS = LEGACY_GRID_COLS + EXTRA_LEFT_COLS + EXTRA_RIGHT_COLS;
export const MAP_BASE_COL_WIDTH = 44;
export const MIN_MAP_ZOOM = 0.2;
export const MAX_MAP_ZOOM = 1.2;
const BOTTOM_SPACER_KEY = "__bottom_spacer__";

interface GardenGridProps {
  editMode: boolean;
  zoom: number;
}

export function GardenGrid({ editMode, zoom }: GardenGridProps) {
  const { boxes, plantings, saveGridLayout } = useGardenStore();
  const navigate = useNavigate();
  const { width, containerRef, mounted } = useContainerWidth();
  const debugGrid = new URLSearchParams(window.location.search).has("debugGrid");
  const colWidth = Math.max(8, Math.round(MAP_BASE_COL_WIDTH * zoom));
  const rowHeight = Math.max(6, Math.round(32 * zoom));
  const margin = Math.max(1, Math.round(8 * zoom));
  const gridWidth = GRID_TOTAL_COLS * colWidth;
  const layout: Layout = boxes.map((box) => ({
    i: box.id,
    x: box.layout.x + EXTRA_LEFT_COLS,
    y: Math.max(-EXTRA_TOP_ROWS, box.layout.y) + EXTRA_TOP_ROWS,
    w: box.layout.w,
    h: box.layout.h,
  }));
  const maxBottomY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  const layoutWithSpacer: Layout = [
    ...layout,
    {
      i: BOTTOM_SPACER_KEY,
      x: GRID_TOTAL_COLS - 1,
      y: maxBottomY,
      w: 1,
      h: EXTRA_BOTTOM_ROWS,
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
          y: Math.max(-EXTRA_TOP_ROWS, item.y - EXTRA_TOP_ROWS),
          w: item.w,
          h: item.h,
        })),
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div ref={containerRef} style={{ width: `${gridWidth}px` }}>
        {mounted && (
          <ReactGridLayout
            key={editMode ? "edit-mode-grid" : "view-mode-grid"}
            className="layout"
            width={Math.max(width, gridWidth)}
            layout={layoutWithSpacer}
            gridConfig={{ cols: GRID_TOTAL_COLS, rowHeight, margin: [margin, margin] }}
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
                        navigate(`/box/${box.id}`);
                      }
                    }}
                  />
                </div>
              );
            })}
            <div key={BOTTOM_SPACER_KEY} className="pointer-events-none opacity-0" />
          </ReactGridLayout>
        )}
      </div>
    </div>
  );
}
