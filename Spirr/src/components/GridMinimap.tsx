import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// Overview minimap pinned to the top-right of the grid viewport (Increment 2 of the grid-UX work).
// Draws every box scaled down, plus a frame rectangle for the currently-visible region that tracks
// panning live. Click or drag the minimap to jump/pan the viewport. Hides itself when the whole
// garden already fits (no scroll overflow → nothing to navigate).

interface MinimapBox {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ViewportMetrics {
  scrollLeft: number;
  scrollTop: number;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
}

interface GridMinimapProps {
  /** The scroll viewport whose position the frame mirrors and that clicks/drags pan. */
  viewportRef: RefObject<HTMLDivElement | null>;
  /** Box layout items in grid units (same offset coords as the rendered layout, sans spacer). */
  layout: readonly MinimapBox[];
  /** Box ids that currently hold an active planting — tinted green. */
  activeBoxIds: Set<string>;
  /** Live cell pixel size, so box positions match the real content extent across zoom. */
  colWidth: number;
  rowHeight: number;
  margin: number;
  /** Current zoom — content size changes with it, so re-read metrics promptly when it does. */
  zoom: number;
}

// Max minimap footprint; the actual box is fit to the grid's aspect ratio within these bounds.
const MAX_W = 180;
const MAX_H = 120;

export function GridMinimap({ viewportRef, layout, activeBoxIds, colWidth, rowHeight, margin, zoom }: GridMinimapProps) {
  const [metrics, setMetrics] = useState<ViewportMetrics | null>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const readMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    setMetrics({
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      clientWidth: viewport.clientWidth,
      clientHeight: viewport.clientHeight,
      scrollWidth: viewport.scrollWidth,
      scrollHeight: viewport.scrollHeight,
    });
  }, [viewportRef]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    const onScroll = () => {
      if (rafRef.current != null) {
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        readMetrics();
      });
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    // ResizeObserver catches viewport resize (window/height) and content resize (zoom).
    const observer = new ResizeObserver(() => readMetrics());
    observer.observe(viewport);
    const content = viewport.firstElementChild;
    if (content) {
      observer.observe(content);
    }
    readMetrics();
    return () => {
      viewport.removeEventListener("scroll", onScroll);
      observer.disconnect();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [viewportRef, readMetrics]);

  // ResizeObserver also fires on zoom, but re-read immediately so the frame doesn't lag a frame.
  useEffect(() => {
    readMetrics();
  }, [zoom, readMetrics]);

  if (!metrics) {
    return null;
  }
  const overflowing =
    metrics.scrollWidth > metrics.clientWidth + 1 || metrics.scrollHeight > metrics.clientHeight + 1;
  if (!overflowing) {
    return null;
  }

  const aspect = metrics.scrollWidth / metrics.scrollHeight;
  let mw = MAX_W;
  let mh = mw / aspect;
  if (mh > MAX_H) {
    mh = MAX_H;
    mw = mh * aspect;
  }

  const cellStride = colWidth + margin;
  const rowStride = rowHeight + margin;
  const scaleX = mw / metrics.scrollWidth;
  const scaleY = mh / metrics.scrollHeight;

  const panTo = (clientX: number, clientY: number) => {
    const el = minimapRef.current;
    const viewport = viewportRef.current;
    if (!el || !viewport) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const fracX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const fracY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    viewport.scrollTo({
      left: fracX * viewport.scrollWidth - viewport.clientWidth / 2,
      top: fracY * viewport.scrollHeight - viewport.clientHeight / 2,
    });
  };

  return (
    <div
      ref={minimapRef}
      className="absolute right-2 top-2 z-10 cursor-pointer rounded-md border shadow-sm"
      style={{
        width: mw,
        height: mh,
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        opacity: 0.92,
        touchAction: "none",
      }}
      onPointerDown={(event) => {
        event.preventDefault();
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        panTo(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (draggingRef.current) {
          panTo(event.clientX, event.clientY);
        }
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
      aria-label="Minikart – klikk eller dra for å navigere i hagen"
    >
      {layout.map((box) => (
        <div
          key={box.i}
          className="absolute"
          style={{
            left: box.x * cellStride * scaleX,
            top: box.y * rowStride * scaleY,
            width: Math.max(1, box.w * cellStride * scaleX),
            height: Math.max(1, box.h * rowStride * scaleY),
            backgroundColor: activeBoxIds.has(box.i) ? "var(--green)" : "var(--gray-light)",
            border: activeBoxIds.has(box.i) ? "none" : "1px solid var(--border)",
            borderRadius: 1,
          }}
        />
      ))}
      <div
        className="absolute"
        style={{
          left: (metrics.scrollLeft / metrics.scrollWidth) * mw,
          top: (metrics.scrollTop / metrics.scrollHeight) * mh,
          width: (metrics.clientWidth / metrics.scrollWidth) * mw,
          height: (metrics.clientHeight / metrics.scrollHeight) * mh,
          border: "1.5px solid var(--green)",
          backgroundColor: "rgba(61, 107, 79, 0.12)",
          borderRadius: 2,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
