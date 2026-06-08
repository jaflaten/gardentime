import type { Box, Planting } from "../types";
import { findPlant, getPlantName } from "../lib/plants";
import { useUiStore } from "../store/useUiStore";

interface BoxTileProps {
  box: Box;
  activePlantings: Planting[];
  editMode: boolean;
  onClick: () => void;
}

export function BoxTile({ box, activePlantings, editMode, onClick }: BoxTileProps) {
  const plantLanguage = useUiStore((state) => state.plantLanguage);
  const hasActive = activePlantings.length > 0;
  const visiblePlants = activePlantings.slice(0, 3).map((planting) => {
    const plant = findPlant(planting.plantKey);
    return {
      emoji: plant?.emoji ?? "🌱",
      name: planting.customName ?? (plant ? getPlantName(plant, plantLanguage) : planting.plantKey),
    };
  });
  const extraCount = activePlantings.length - visiblePlants.length;

  return (
    <div
      onClick={onClick}
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
        {editMode && (
          <span className="text-lg leading-none" style={{ color: "var(--text-muted)" }}>
            ⠿
          </span>
        )}
      </div>

      {hasActive ? (
        <div className="space-y-1">
          {visiblePlants.map((plant) => (
            <p key={`${box.id}-${plant.name}`} className="truncate text-xs sm:text-sm">
              {plant.emoji} {plant.name}
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
