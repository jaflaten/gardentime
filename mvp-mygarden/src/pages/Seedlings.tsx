import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PlantPicker } from "../components/PlantPicker";
import { SowBoxPicker } from "../components/SowBoxPicker";
import { getPlantName, useMergedPlantList, usePlantLookup } from "../lib/plants";
import { isIndoorSeedling, parseQuantity, plantedAgeLabel } from "../lib/planting";
import { todayDoy, transplantReadiness, weeksFromLastFrost, withinIndoorWindow } from "../lib/sowWindow";
import { doyToDate } from "../lib/seasonTimeline";
import type { ResolvedLocation } from "../lib/location";
import { useResolvedLocation } from "../lib/useResolvedLocation";
import { useGardenStore } from "../store/useGardenStore";
import { useUiStore, type PlantLanguage } from "../store/useUiStore";
import type { PlantInfo, Planting } from "../types";

const TODAY = () => new Date().toISOString().split("T")[0];

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("nb-NO", { day: "numeric", month: "long" });
}

/**
 * Forkultivering (Increment K) — the indoor seedling tray. A separate surface from the garden grid
 * because a windowsill batch has no spatial home. Seedlings are plantings with no `boxId`; "Plant ut"
 * assigns one via the ranked SowBoxPicker, at which point the row becomes an ordinary box planting.
 */
export function Seedlings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const plantings = useGardenStore((state) => state.plantings);
  const language = useUiStore((state) => state.plantLanguage);
  const findPlant = usePlantLookup();
  const location = useResolvedLocation();

  // Start-form state. `startPlantKey` non-null means the form is open (possibly pre-filled).
  const startParam = searchParams.get("start");
  const [formOpen, setFormOpen] = useState(() => startParam !== null);
  const [startKey, setStartKey] = useState(() => startParam ?? "");

  const seedlings = useMemo(
    () =>
      plantings
        .filter((p) => p.status === "active" && isIndoorSeedling(p))
        .sort((a, b) => a.plantedDate.localeCompare(b.plantedDate)),
    [plantings],
  );

  const openForm = (plantKey = "") => {
    setStartKey(plantKey);
    setFormOpen(true);
    if (searchParams.has("start")) {
      searchParams.delete("start");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const lastFrostLabel = location
    ? formatDate(doyToDate(location.lastFrostDoy, new Date().getFullYear()).toISOString().split("T")[0])
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-3 p-3 sm:gap-4 sm:p-4">
      <header
        className="flex flex-col gap-2 rounded-xl border p-3 sm:p-4"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold sm:text-2xl">🌱 Forkultivering</h1>
          <Link
            to="/"
            className="tap-target rounded-lg border px-3 py-2 text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            ← Hagen
          </Link>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Frø du har startet inne, før de plantes ut.
          {lastFrostLabel && ` Siste vårfrost ~${lastFrostLabel}.`}
        </p>
      </header>

      {formOpen ? (
        <SeedlingForm key={startKey} initialPlantKey={startKey} onClose={() => setFormOpen(false)} />
      ) : (
        <button
          type="button"
          onClick={() => openForm()}
          className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--green)", color: "white" }}
        >
          + Start frø inne
        </button>
      )}

      {seedlings.length === 0 ? (
        <EmptyState location={location} onStart={openForm} formOpen={formOpen} />
      ) : (
        <ul className="space-y-2">
          {seedlings.map((seedling) => (
            <SeedlingRow key={seedling.id} seedling={seedling} plant={findPlant(seedling.plantKey)} language={language} location={location} />
          ))}
        </ul>
      )}
    </main>
  );
}

interface SeedlingRowProps {
  seedling: Planting;
  plant: PlantInfo | undefined;
  language: PlantLanguage;
  location: ResolvedLocation | null;
}

function SeedlingRow({ seedling, plant, language, location }: SeedlingRowProps) {
  const boxes = useGardenStore((state) => state.boxes);
  const plantings = useGardenStore((state) => state.plantings);
  const updatePlanting = useGardenStore((state) => state.updatePlanting);
  const deletePlanting = useGardenStore((state) => state.deletePlanting);
  const findPlant = usePlantLookup();
  const [planningOut, setPlanningOut] = useState(false);

  const name = seedling.customName ?? (plant ? getPlantName(plant, language) : seedling.plantKey || "Ukjent plante");
  const age = plantedAgeLabel(seedling.plantedDate);
  const readiness = plant && location ? transplantReadiness(plant, location.lastFrostDoy) : null;

  const readinessText =
    readiness == null
      ? null
      : readiness.status === "ready"
        ? { label: "Klar til utplanting nå", color: "var(--green)" }
        : readiness.status === "soon"
          ? { label: `Plant ut om ~${readiness.weeks} ${readiness.weeks === 1 ? "uke" : "uker"}`, color: "var(--text-muted)" }
          : { label: "Bør plantes ut snart", color: "var(--amber)" };

  const plantOut = (boxId: string) => {
    updatePlanting(seedling.id, { boxId, transplantedDate: TODAY() });
    setPlanningOut(false);
  };

  return (
    <li className="rounded-lg border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {plant?.emoji ?? "🌱"} {name}
            {seedling.variety && <span style={{ color: "var(--text-muted)" }}> · {seedling.variety}</span>}
            {seedling.quantity != null && <span style={{ color: "var(--text-muted)" }}> · {seedling.quantity} stk</span>}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Sådd inne {formatDate(seedling.plantedDate)}
            {age && ` · ${age}`}
          </p>
          {readinessText && (
            <p className="text-xs font-medium" style={{ color: readinessText.color }}>
              {readinessText.label}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setPlanningOut(true)}
            className="tap-target rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: "var(--green)", color: "white" }}
          >
            Plant ut
          </button>
          <button
            type="button"
            onClick={() => deletePlanting(seedling.id)}
            aria-label="Slett frøplante"
            className="tap-target rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            Slett
          </button>
        </div>
      </div>

      {planningOut && (
        <SowBoxPicker
          boxes={boxes}
          plant={plant}
          plantings={plantings}
          findPlant={findPlant}
          verb="plante ut"
          onCancel={() => setPlanningOut(false)}
          onPick={plantOut}
        />
      )}
    </li>
  );
}

interface SeedlingFormProps {
  initialPlantKey: string;
  onClose: () => void;
}

function SeedlingForm({ initialPlantKey, onClose }: SeedlingFormProps) {
  const addPlanting = useGardenStore((state) => state.addPlanting);
  const [plantKey, setPlantKey] = useState(initialPlantKey);
  const [customName, setCustomName] = useState("");
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [sownDate, setSownDate] = useState(() => TODAY());
  const [showError, setShowError] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plantKey && !customName.trim()) {
      setShowError(true);
      return;
    }
    // No boxId — that's what makes it an indoor seedling. plantedDate is the indoor sow date.
    addPlanting({
      plantKey,
      customName: customName.trim() || undefined,
      variety: variety.trim() || undefined,
      quantity: parseQuantity(quantity),
      plantedDate: sownDate,
      status: "active",
    });
    onClose();
  };

  return (
    <form
      className="space-y-3 rounded-xl border p-3 sm:p-4"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      onSubmit={onSubmit}
    >
      <h2 className="text-base font-semibold">Start frø inne</h2>
      <PlantPicker
        plantKey={plantKey}
        customName={customName}
        onPlantKeyChange={(key) => {
          setPlantKey(key);
          setShowError(false);
        }}
        onCustomNameChange={(nm) => {
          setCustomName(nm);
          if (nm.trim()) setShowError(false);
        }}
      />
      {showError && (
        <p className="text-sm" style={{ color: "var(--red)" }}>
          Velg en plante eller skriv et eget plantenavn først.
        </p>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium">Sort (valgfritt)</label>
        <input
          type="text"
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
          placeholder="f.eks. Sungold"
          className="input-touch w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Antall (valgfritt)</label>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="f.eks. 6"
          className="input-touch w-full rounded-lg border px-3 py-2 sm:max-w-[10rem]"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Sådd inne (dato)</label>
        <input
          type="date"
          value={sownDate}
          onChange={(e) => setSownDate(e.target.value)}
          className="input-touch w-full rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--green)", color: "white" }}
        >
          Lagre
        </button>
        <button
          type="button"
          onClick={onClose}
          className="tap-target rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--gray-light)", color: "var(--text)" }}
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}

interface EmptyStateProps {
  location: ResolvedLocation | null;
  onStart: (plantKey: string) => void;
  formOpen: boolean;
}

/** Empty tray: explain forkultivering, and suggest plants whose indoor-sow window is open now. */
function EmptyState({ location, onStart, formOpen }: EmptyStateProps) {
  const plants = useMergedPlantList();
  const language = useUiStore((state) => state.plantLanguage);

  const suggestions = useMemo(() => {
    if (!location) return [];
    const wks = weeksFromLastFrost(todayDoy(), location.lastFrostDoy);
    return plants.filter((plant) =>
      plant.sowRules?.some((rule) => rule.type === "indoor" && withinIndoorWindow(rule, wks)),
    );
  }, [plants, location]);

  if (formOpen) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Varmekjære planter som tomat, paprika og agurk forkultiveres inne noen uker før siste vårfrost,
        og plantes ut når det er trygt. Start et frø her, så minner appen deg på når det er klart til utplanting.
      </p>
      {!location && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Legg inn postnummer i innstillinger for å se hva som passer å så inne nå.
        </p>
      )}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Passer å så inne nå
          </h2>
          <ul className="space-y-1.5">
            {suggestions.map((plant) => (
              <li
                key={plant.key}
                className="flex items-center justify-between gap-2 rounded-lg border p-2"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
              >
                <span className="truncate text-sm font-medium">
                  {plant.emoji} {getPlantName(plant, language)}
                </span>
                <button
                  type="button"
                  onClick={() => onStart(plant.key)}
                  className="rounded-lg border px-2 py-1 text-xs font-medium"
                  style={{ borderColor: "var(--green)", color: "var(--green)", backgroundColor: "var(--surface)" }}
                >
                  + Start inne
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
