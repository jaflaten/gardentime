import { useRef, type PointerEvent } from "react";
import { getPlantName, usePlantLookup } from "../lib/plants";
import { useUiStore } from "../store/useUiStore";
import type { Box, Planting } from "../types";

interface BoxTileProps {
  box: Box;
  activePlantings: Planting[];
  editMode: boolean;
  onClick: () => void;
  onLongPress?: () => void;
}

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

export function BoxTile({ box, activePlantings, editMode, onClick, onLongPress }: BoxTileProps) {
  const plantLanguage = useUiStore((state) => state.plantLanguage);
  const findPlant = usePlantLookup();
  const hasActive = activePlantings.length > 0;
  const visiblePlants = activePlantings.slice(0, 3).map((planting) => {
    const plant = findPlant(planting.plantKey);
    return {
      emoji: plant?.emoji ?? "🌱",
      name: planting.customName ?? (plant ? getPlantName(plant, plantLanguage) : planting.plantKey),
      variety: planting.variety,
    };
  });
  const extraCount = activePlantings.length - visiblePlants.length;

  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const longPressActive = !editMode && Boolean(onLongPress);

  const cancelLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!longPressActive) {
      return;
    }
    pointerStart.current = { x: event.clientX, y: event.clientY };
    longPressFired.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      longPressTimer.current = null;
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(20);
      }
      onLongPress?.();
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (longPressTimer.current === null) {
      return;
    }
    const start = pointerStart.current;
    if (!start) {
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_TOLERANCE_PX) {
      cancelLongPress();
    }
  };

  const onClickWrapped = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onClick();
  };

  return (
    <div
      onClick={onClickWrapped}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
      role={editMode ? undefined : "button"}
      tabIndex={editMode ? undefined : 0}
      onKeyDown={(event) => {
        if (!editMode && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
      className={`tile h-full w-full p-2 text-left ${hasActive ? "tile-active" : "tile-empty"} ${editMode ? "cursor-grab" : "cursor-pointer"}`}
      style={{ backgroundColor: hasActive ? "var(--green-light)" : "var(--surface)" }}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <p className="text-xs font-semibold leading-tight sm:text-sm">{box.name}</p>
        {editMode ? (
          <span className="text-lg leading-none" style={{ color: "var(--text-muted)" }}>
            ⠿
          </span>
        ) : onLongPress ? (
          <button
            type="button"
            aria-label={`Hurtig-legg til i ${box.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onLongPress();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.stopPropagation();
              }
            }}
            className="flex h-6 w-6 items-center justify-center rounded-full border text-sm font-semibold leading-none"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--green)", color: "var(--green)" }}
          >
            +
          </button>
        ) : null}
      </div>

      {hasActive ? (
        <div className="space-y-1">
          {visiblePlants.map((plant) => (
            <p
              key={`${box.id}-${plant.name}`}
              className="truncate text-xs sm:text-sm"
              title={plant.variety ? `${plant.name} (${plant.variety})` : undefined}
            >
              {plant.emoji} {plant.name}
              {plant.variety && (
                <span style={{ color: "var(--text-muted)" }}> · {plant.variety}</span>
              )}
            </p>
          ))}
          {extraCount > 0 && <p className="text-xs font-medium">+{extraCount} til</p>}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Tom
        </p>
      )}
    </div>
  );
}
