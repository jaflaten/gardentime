# GardenTime MVP — Implementation Plan for Copilot

## Context

The existing repo (`jaflaten/gardentime`) has a Spring Boot backend, Next.js frontend, PostgreSQL, Docker, and a `plant-data-aggregator`. **That code is left untouched** — the MVP lives in a new folder alongside it.

**Parked (not deleted):**
- Spring Boot backend / Kotlin / Gradle
- PostgreSQL + Docker setup
- Next.js SSR client (`client-next/`)
- Playwright test suite
- plant-data-aggregator microservice
- Canvas garden designer (Steps 64–69)

**What the MVP solves:** "What's growing in each box right now, and what was there before?" — with a visual layout that mirrors the real garden so you can identify boxes by sight.

---

## New folder in the repo

```
gardentime/                  ← existing repo root (untouched)
├── src/                     ← existing Spring Boot source
├── client-next/             ← existing Next.js app
├── plant-data-aggregator/   ← existing Python service
│
└── mvp/                     ← NEW: everything below lives here
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── package.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── data/
        │   └── plants.json          ← static plant reference DB
        ├── types/
        │   └── index.ts
        ├── store/
        │   └── useGardenStore.ts    ← Zustand (localStorage-backed)
        ├── pages/
        │   ├── GardenMap.tsx        ← MAIN VIEW: visual garden layout
        │   ├── BoxDetail.tsx        ← one box: current plants + history
        │   └── Settings.tsx         ← manage boxes, export/import
        ├── components/
        │   ├── GardenGrid.tsx       ← react-grid-layout wrapper
        │   ├── BoxTile.tsx          ← tile rendered inside the grid
        │   ├── PlantingRow.tsx      ← one row in history list
        │   ├── PlantPicker.tsx      ← searchable plant selector
        │   └── StatusBadge.tsx      ← active/harvested/removed pill
        └── lib/
            ├── storage.ts           ← localStorage helpers
            └── importLegacy.ts      ← one-time DinoGarden JSON converter
```

---

## Data Model (everything in localStorage)

```
PLANT_DB     — static JSON bundled at build time (read-only reference)
boxes[]      — the planter boxes, each with a grid layout position
plantings[]  — every planting event (the log)
```

### `Box`
```ts
export interface Box {
  id: string;
  name: string;
  description?: string;
  createdAt: string;        // ISO date string
  zoneType?: "BOX" | "BUCKET" | string; // preserved from DinoGarden export
  // react-grid-layout position & size — set once when box is created, drag to adjust
  layout: {
    x: number;              // column index (0-based)
    y: number;              // row index (0-based)
    w: number;              // width in grid columns (default 2)
    h: number;              // height in grid rows (default 2)
  };
}
```

### `Planting`
```ts
export interface Planting {
  id: string;
  boxId: string;
  plantKey: string;         // references plants.json key, e.g. "tomat_cherry"
  customName?: string;      // free-text override for unlisted plants
  plantedDate: string;      // ISO date string
  harvestDate?: string;     // ISO date — undefined means still active
  notes?: string;
  status: "active" | "harvested" | "removed" | "failed";
  year: number;             // derived from plantedDate at write time
}
```

### `PlantInfo` (static JSON, read-only)
```ts
export interface PlantInfo {
  key: string;
  name_no: string;          // Norwegian name shown in UI
  name_en: string;
  emoji: string;            // 🍅 🥕 🌿 — used in tiles for visual scanning
  category: "vegetable" | "herb" | "fruit" | "flower";
}
```

---

## Implementation Steps

### Step 0 — Bootstrap inside `/mvp`

```bash
# from repo root
mkdir mvp && cd mvp
npm create vite@latest . -- --template react-ts
npm install zustand react-router-dom nanoid react-grid-layout
npm install -D tailwindcss postcss autoprefixer @types/react-grid-layout
npx tailwindcss init -p
```

**Important:** set `cols={39}` on `<GridLayout>` (or `<ResponsiveGridLayout>`) to match the 39-column grid the legacy importer produces. Export this constant from `importLegacy.ts` as `LEGACY_GRID_COLS = 39` and import it in `GardenGrid.tsx`.

`tailwind.config.js`:
```js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

`src/index.css` — add at top:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* also import react-grid-layout styles */
@import "react-grid-layout/css/styles.css";
@import "react-resizable/css/styles.css";
```

Google Fonts in `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
```

---

### Step 1 — Plant reference data (`src/data/plants.json`)

Seed from the existing `AI_DOCS/placeholder-plant-data.sql` in the repo. Minimum viable set:

```json
[
  { "key": "tomat_cherry",  "name_no": "Cherrytomater",  "name_en": "Cherry tomato",   "emoji": "🍅", "category": "vegetable" },
  { "key": "tomat_stor",    "name_no": "Stortomat",      "name_en": "Beefsteak tomato", "emoji": "🍅", "category": "vegetable" },
  { "key": "gulrot",        "name_no": "Gulrot",         "name_en": "Carrot",           "emoji": "🥕", "category": "vegetable" },
  { "key": "salat",         "name_no": "Salat",          "name_en": "Lettuce",          "emoji": "🥬", "category": "vegetable" },
  { "key": "basilikum",     "name_no": "Basilikum",      "name_en": "Basil",            "emoji": "🌿", "category": "herb"      },
  { "key": "agurk",         "name_no": "Agurk",          "name_en": "Cucumber",         "emoji": "🥒", "category": "vegetable" },
  { "key": "jordbær",       "name_no": "Jordbær",        "name_en": "Strawberry",       "emoji": "🍓", "category": "fruit"     },
  { "key": "paprika",       "name_no": "Paprika",        "name_en": "Bell pepper",      "emoji": "🫑", "category": "vegetable" },
  { "key": "persille",      "name_no": "Persille",       "name_en": "Parsley",          "emoji": "🌱", "category": "herb"      },
  { "key": "gresskar",      "name_no": "Gresskar",       "name_en": "Pumpkin",          "emoji": "🎃", "category": "vegetable" },
  { "key": "erter",         "name_no": "Erter",          "name_en": "Peas",             "emoji": "🫛", "category": "vegetable" },
  { "key": "bønner",        "name_no": "Bønner",         "name_en": "Beans",            "emoji": "🫘", "category": "vegetable" },
  { "key": "spinat",        "name_no": "Spinat",         "name_en": "Spinach",          "emoji": "🍃", "category": "vegetable" },
  { "key": "timian",        "name_no": "Timian",         "name_en": "Thyme",            "emoji": "🌿", "category": "herb"      },
  { "key": "rosmarin",      "name_no": "Rosmarin",       "name_en": "Rosemary",         "emoji": "🌿", "category": "herb"      },
  { "key": "gressløk",      "name_no": "Gressløk",       "name_en": "Chives",           "emoji": "🌱", "category": "herb"      },
  { "key": "squash",        "name_no": "Squash",         "name_en": "Zucchini",         "emoji": "🥒", "category": "vegetable" },
  { "key": "mais",          "name_no": "Mais",           "name_en": "Corn",             "emoji": "🌽", "category": "vegetable" },
  { "key": "purre",         "name_no": "Purre",          "name_en": "Leek",             "emoji": "🌱", "category": "vegetable" },
  { "key": "løk",           "name_no": "Løk",            "name_en": "Onion",            "emoji": "🧅", "category": "vegetable" }
]
```

---

### Step 2 — Types (`src/types/index.ts`)

Copy the three interfaces from the Data Model section above verbatim.

---

### Step 3 — Storage helpers (`src/lib/storage.ts`)

```ts
import { Box, Planting } from "../types";

const BOXES_KEY     = "gt_boxes";
const PLANTINGS_KEY = "gt_plantings";

export const loadBoxes     = (): Box[]      => JSON.parse(localStorage.getItem(BOXES_KEY)     ?? "[]");
export const saveBoxes     = (v: Box[])     => localStorage.setItem(BOXES_KEY,     JSON.stringify(v));
export const loadPlantings = (): Planting[] => JSON.parse(localStorage.getItem(PLANTINGS_KEY) ?? "[]");
export const savePlantings = (v: Planting[]) => localStorage.setItem(PLANTINGS_KEY, JSON.stringify(v));
```

---

### Step 4 — Zustand store (`src/store/useGardenStore.ts`)

```ts
import { create } from "zustand";
import { nanoid } from "nanoid";
import { Box, Planting } from "../types";
import { loadBoxes, saveBoxes, loadPlantings, savePlantings } from "../lib/storage";

interface GardenStore {
  boxes: Box[];
  plantings: Planting[];

  // Boxes
  addBox: (name: string, description?: string) => void;
  updateBox: (id: string, patch: Partial<Box>) => void;
  updateBoxLayout: (id: string, layout: Box["layout"]) => void;
  deleteBox: (id: string) => void;

  // Plantings
  addPlanting: (p: Omit<Planting, "id" | "year">) => void;
  updatePlanting: (id: string, patch: Partial<Planting>) => void;
  deletePlanting: (id: string) => void;
  markHarvested: (id: string, date?: string) => void;
}

export const useGardenStore = create<GardenStore>((set, get) => ({
  boxes:     loadBoxes(),
  plantings: loadPlantings(),

  addBox: (name, description) => {
    // Default position: append at end of first row, size 2×2
    const existing = get().boxes.length;
    const box: Box = {
      id: nanoid(),
      name,
      description,
      createdAt: new Date().toISOString(),
      layout: { x: (existing * 2) % 12, y: Infinity, w: 2, h: 2 },
      // y: Infinity tells react-grid-layout to place it at the bottom automatically
    };
    const boxes = [...get().boxes, box];
    saveBoxes(boxes);
    set({ boxes });
  },

  updateBox: (id, patch) => {
    const boxes = get().boxes.map(b => b.id === id ? { ...b, ...patch } : b);
    saveBoxes(boxes);
    set({ boxes });
  },

  updateBoxLayout: (id, layout) => {
    const boxes = get().boxes.map(b => b.id === id ? { ...b, layout } : b);
    saveBoxes(boxes);
    set({ boxes });
  },

  deleteBox: (id) => {
    const boxes = get().boxes.filter(b => b.id !== id);
    saveBoxes(boxes);
    set({ boxes });
  },

  addPlanting: (p) => {
    const planting: Planting = { ...p, id: nanoid(), year: new Date(p.plantedDate).getFullYear() };
    const plantings = [...get().plantings, planting];
    savePlantings(plantings);
    set({ plantings });
  },

  updatePlanting: (id, patch) => {
    const plantings = get().plantings.map(p => p.id === id ? { ...p, ...patch } : p);
    savePlantings(plantings);
    set({ plantings });
  },

  deletePlanting: (id) => {
    const plantings = get().plantings.filter(p => p.id !== id);
    savePlantings(plantings);
    set({ plantings });
  },

  markHarvested: (id, date) => {
    const today = date ?? new Date().toISOString().split("T")[0];
    const plantings = get().plantings.map(p =>
      p.id === id ? { ...p, status: "harvested" as const, harvestDate: today } : p
    );
    savePlantings(plantings);
    set({ plantings });
  },
}));
```

---

### Step 5 — Components

#### `StatusBadge.tsx`
Small pill. Map status → label + Tailwind color class:
- `active`    → green bg  · "Aktiv"
- `harvested` → amber bg  · "Høstet"
- `removed`   → gray bg   · "Fjernet"
- `failed`    → red bg    · "Mislyktes"

#### `PlantPicker.tsx`
Searchable input over `plants.json`. Show `{emoji} {name_no}` per option.
Allow free-text entry that sets `customName` instead of `plantKey`.

```tsx
// Core filter logic:
const filtered = plants.filter(p =>
  p.name_no.toLowerCase().includes(query.toLowerCase()) ||
  p.name_en.toLowerCase().includes(query.toLowerCase())
);
```

#### `PlantingRow.tsx`
One row: `{emoji} {displayName}` · `Plantet: {date}` · `<StatusBadge>` · [Høst] [Slett]

Where `displayName = planting.customName ?? plants.find(p => p.key === planting.plantKey)?.name_no ?? planting.plantKey`

#### `BoxTile.tsx`
The tile rendered inside the grid for each box. Shows:
- Box name (bold)
- Active plant emojis as a wrapping row: `🍅 🥕 🌿`
- Active plant count if > 4 plants: `🍅 🥕 🌿 +3`
- Subtle green tint if has active plants, gray/neutral if empty
- Clicking anywhere navigates to `/box/:id`
- In edit mode: shows a drag handle (⠿) and resize handle (react-grid-layout provides resize natively)

```tsx
// Props:
interface BoxTileProps {
  box: Box;
  activePlantings: Planting[];
  editMode: boolean;
  onClick: () => void;
}
```

#### `GardenGrid.tsx`
Wrapper around `react-grid-layout`. This is the visual garden map.

```tsx
import GridLayout, { Layout } from "react-grid-layout";
import { useGardenStore } from "../store/useGardenStore";
import { BoxTile } from "./BoxTile";
import { useNavigate } from "react-router-dom";

interface Props {
  editMode: boolean;
}

export function GardenGrid({ editMode }: Props) {
  const { boxes, plantings, updateBoxLayout } = useGardenStore();
  const navigate = useNavigate();

  // Build react-grid-layout Layout[] from boxes
  const layout: Layout[] = boxes.map(b => ({
    i: b.id,
    x: b.layout.x,
    y: b.layout.y,
    w: b.layout.w,
    h: b.layout.h,
    // Lock dragging/resizing when not in edit mode
    static: !editMode,
  }));

  const handleLayoutChange = (newLayout: Layout[]) => {
    if (!editMode) return;
    newLayout.forEach(item => {
      updateBoxLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
    });
  };

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={80}         // each grid row = 80px; a 2h box = 160px tall
      width={containerWidth} // use a ResizeObserver or fixed width; see note below
      onLayoutChange={handleLayoutChange}
      isDraggable={editMode}
      isResizable={editMode}
      compactType={null}     // null = free placement, no auto-compaction
      preventCollision={true}
      margin={[12, 12]}
    >
      {boxes.map(box => {
        const active = plantings.filter(p => p.boxId === box.id && p.status === "active");
        return (
          <div key={box.id}>
            <BoxTile
              box={box}
              activePlantings={active}
              editMode={editMode}
              onClick={() => !editMode && navigate(`/box/${box.id}`)}
            />
          </div>
        );
      })}
    </GridLayout>
  );
}
```

**Note on `containerWidth`:** Use a `ref` + `ResizeObserver` on the parent div, or use the `WidthProvider` HOC that react-grid-layout exports:
```tsx
import GridLayout, { WidthProvider } from "react-grid-layout";
const ResponsiveGridLayout = WidthProvider(GridLayout);
// Then use <ResponsiveGridLayout ...> instead — it auto-measures its container width.
```

---

### Step 6 — Pages

#### `GardenMap.tsx` (route: `/` — main home view)

```
┌─────────────────────────────────────┐
│ 🌱 Hagen vår              [Rediger] │  ← header
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐  ┌──────────────────┐ │
│  │ Kasse A  │  │   Stor bedd      │ │
│  │ 🍅 🥕    │  │ 🥬 🌿 🍓 🥒     │ │
│  └──────────┘  └──────────────────┘ │
│  ┌──────────┐  ┌──────────┐        │
│  │ Kasse B  │  │ Pottekr. │        │
│  │ (tom)    │  │ 🌿       │        │
│  └──────────┘  └──────────┘        │
│                                     │
│              [+ Ny kasse]           │
└─────────────────────────────────────┘
```

State: `editMode` boolean toggled by [Rediger]/[Ferdig] button.

- In **view mode**: tiles are static, clicking a tile navigates to BoxDetail.
- In **edit mode**: tiles become draggable and resizable. A [+ Ny kasse] button appears (or always visible). Show a subtle grid background pattern to indicate edit state.

When [+ Ny kasse] is clicked: show a small inline form (name + optional description) → calls `addBox()` → new tile appears at bottom of grid.

#### `BoxDetail.tsx` (route: `/box/:id`)

```
← Tilbake         Kasse A
─────────────────────────────────
NÅ
  🍅 Cherrytomater  Plantet 12. mai  [Aktiv]  [Høst] [×]
  🥕 Gulrot         Plantet 3. mai   [Aktiv]  [Høst] [×]

  [+ Legg til plante]

─────────────────────────────────
HISTORIKK

  2024
    🥬 Salat       plantet apr → høstet juni
    🌿 Basilikum   plantet mai → fjernet sept

  2023
    🍅 Tomat       plantet mai → høstet sept
```

The "+ Legg til plante" button opens an inline form below active plantings:
- `PlantPicker` for plant selection
- `<input type="date">` defaulting to today
- Optional `<textarea>` for notes
- [Lagre] / [Avbryt]

#### `Settings.tsx` (route: `/settings`)

Minimal. Just two things:
1. **Export** — button that downloads `gardentime-backup-{date}.json` containing `{ boxes, plantings }`
2. **Import** — file input that reads a JSON backup and merges/overwrites after confirmation dialog

Link to Settings from a small ⚙ icon in the header.

---

### Step 7 — Routing (`App.tsx`)

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GardenMap }   from "./pages/GardenMap";
import { BoxDetail }   from "./pages/BoxDetail";
import { Settings }    from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<GardenMap />} />
        <Route path="/box/:id"   element={<BoxDetail />} />
        <Route path="/settings"  element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### Step 8 — Design system

**Aesthetic:** Organic/natural Scandinavian — seed catalogue meets clean nordic UI.

**CSS variables** (add to `src/index.css`):
```css
:root {
  --bg:           #f7f5f0;   /* warm off-white parchment */
  --surface:      #ffffff;
  --border:       #e0d9cc;
  --text:         #2c2a26;
  --text-muted:   #7a7060;
  --green:        #3d6b4f;
  --green-light:  #edf4ef;
  --amber:        #c47c2b;
  --red:          #b84444;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
}

h1, h2, h3 {
  font-family: var(--font-display);
}
```

**Box tiles:**
- Default: white background, `border: 1px solid var(--border)`, `border-radius: 12px`, soft shadow
- Has active plants: add `background: var(--green-light)` and `border-color: var(--green)`
- Empty: slightly dimmed, dashed border

**Edit mode visual cue:**
- Add a subtle dot-grid background to the garden map area:
  ```css
  .edit-mode {
    background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  ```

**Mobile-first:** All layouts stack vertically. The garden grid will naturally reflow tiles. On desktop it spreads wider. This is the primary device — phone in the garden.

---

### Step 9 — Legacy import from DinoGarden (`src/lib/importLegacy.ts`)

Your existing garden layout is already set up spatially in DinoGarden. **Import it once instead of re-entering everything manually.**

#### How the conversion works

The DinoGarden export stores boxes as pixel coordinates on a freeform canvas (X: −263 to 2074, Y: 80 to 1878). The converter maps these to react-grid-layout grid units using a **60px cell size** — chosen because:
- The smallest box dimension is 80px → maps to 1–2 grid units (clickable)
- Adjacent boxes that are 120px apart (one box-width) don't collide at this resolution
- Zero collisions confirmed across all 42 boxes in your export

This produces a **39-column grid** that preserves the spatial relationships of your real garden.

#### Converter file: `src/lib/importLegacy.ts`

See the separately provided `importLegacy.ts` file. Key exports:
- `importLegacyExport(jsonString: string): Box[]` — parses the JSON and returns `Box[]` with pre-computed layouts
- `LEGACY_GRID_COLS = 39` — import this constant into `GardenGrid.tsx` and pass it to `<GridLayout cols={LEGACY_GRID_COLS}>`

#### Settings.tsx — import button

Add a "Importer fra DinoGarden" section in Settings.tsx above the export button:

```tsx
function handleLegacyImport(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const boxes = importLegacyExport(e.target?.result as string);
      if (confirm(`Importer ${boxes.length} kasser fra DinoGarden? Dette erstatter eksisterende kasser.`)) {
        saveBoxes(boxes);
        window.location.href = "/"; // navigate home and reload
      }
    } catch (err) {
      alert("Kunne ikke lese filen. Er det en gyldig DinoGarden-eksport?");
    }
  };
  reader.readAsText(file);
}

// In JSX:
<section>
  <h2>Importer fra DinoGarden</h2>
  <p>Last opp en DinoGarden JSON-eksport for å importere dine kasser med oppsett.</p>
  <input
    type="file"
    accept=".json"
    onChange={(e) => e.target.files?.[0] && handleLegacyImport(e.target.files[0])}
  />
</section>
```

#### What imports cleanly vs what needs adjustment

| DinoGarden field | Maps to | Notes |
|---|---|---|
| `name` | `Box.name` | Direct |
| `notes` | `Box.description` | Direct |
| `positionX/Y` | `layout.x/y` | Converted via 60px grid unit |
| `width/length/rotation` | `layout.w/h` | Visual dims computed after rotation |
| `zoneType` | `Box.zoneType` | Preserved (BOX vs BUCKET) |
| `cropRecords` | — | Ignored (empty in your export) |
| **Diagonal boxes** (rotation=67.5°) | Grid position approximated | boxes 19–24: bounding box used; drag to fine-tune in edit mode |

After importing, go to the garden map in **edit mode** and drag the 6 diagonal boxes (19–24) to their correct positions — the bounding box approximation gets them close but not pixel-perfect.

#### Workflow for your real garden

1. Export from DinoGarden (same format as the sample)
2. In the MVP app, go to Settings → "Importer fra DinoGarden" → select the file
3. Your 42 boxes appear on the map in the correct spatial layout
4. Switch to edit mode, nudge any diagonal boxes into place
5. Done — never need to import again

---

### Step 10 — Seed data (dev/demo only)

Add a `?seed` URL param handler in `main.tsx`:

```ts
if (new URLSearchParams(window.location.search).has("seed")) {
  seedDemoData(); // call before React renders
}
```

`seedDemoData()` writes to localStorage:
- 4 boxes: "Kasse A" (2×2), "Kasse B" (2×2), "Stor bedd" (4×2), "Pottekrukker" (2×2)
- Layout positions that roughly form a garden shape
- ~12 plantings across 2024 and 2025 seasons with mixed statuses

This gives your wife a populated, realistic view on first open. Remove the `?seed` call once you've entered your real data.

---

### Step 10 — Export / Import (in `Settings.tsx`)

**Export:**
```ts
function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    boxes: loadBoxes(),
    plantings: loadPlantings(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `gardentime-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Import:**
```ts
function importData(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target?.result as string);
    if (confirm(`Importere ${data.boxes?.length} kasser og ${data.plantings?.length} plantinger?`)) {
      saveBoxes(data.boxes);
      savePlantings(data.plantings);
      window.location.reload(); // simplest way to refresh store from localStorage
    }
  };
  reader.readAsText(file);
}
```

---

## Hosting: Free Forever

**Recommended: Vercel**

```bash
cd mvp
vercel deploy
```

Set the Vercel project root to `mvp/`. Custom domain (e.g. `hagen.jaflaten.no`) is free.

**Alternative: Cloudflare Pages** — same simplicity, also free.

Configure build command: `npm run build`, output dir: `dist`.

---

## Future Upgrade Path (don't build now)

When you need cross-device sync (phone + laptop, or sharing with your wife across devices):

1. Sign up for **Supabase** (free tier: 500MB)
2. Replace `src/lib/storage.ts` with a `src/lib/supabase.ts` that calls the Supabase JS client
3. Add magic-link auth (email, no passwords)
4. The entire UI layer — including GardenGrid, BoxDetail, all components — is completely untouched

---

## What to Tell Copilot

> "Implement this plan exactly as specified. The MVP lives in a new `/mvp` subfolder within the existing `gardentime` repo — do not touch anything outside that folder. Build in this order:
> 1. Step 0: scaffold Vite + React + TS + install all dependencies
> 2. Steps 1–3: plants.json, types, storage helpers
> 3. Step 4: Zustand store
> 4. Step 5: all components (StatusBadge → PlantPicker → PlantingRow → BoxTile → GardenGrid)
> 5. Step 6: all pages (GardenMap → BoxDetail → Settings)
> 6. Steps 7–8: routing + design system CSS variables
> 7. Steps 9–10: seed data + export/import
>
> Use Tailwind for all layout/spacing/color. Use the CSS variables defined in Step 8 for all colors. Fraunces for headings, DM Sans for body. All UI labels in Norwegian. Mobile-first."

---

## Summary

| What | Decision |
|---|---|
| Existing repo code | ✅ Untouched — MVP is a new `/mvp` subfolder |
| Visual garden layout | ✅ `react-grid-layout` — drag to position, resize to match real proportions |
| Edit vs view mode | ✅ Toggle button — locked for reading, unlocked for rearranging |
| **DinoGarden import** | ✅ One-time import of your existing layout — 42 boxes, zero collisions |
| **Grid spec** | ✅ 39 columns, 60px cell unit, derived from your actual canvas coordinates |
| Backend | ❌ None — localStorage only |
| Database | ❌ None — JSON in localStorage |
| Auth | ❌ None for MVP — shared URL |
| Hosting | ✅ Vercel free tier |
| Future sync path | ✅ Swap `storage.ts` for Supabase, UI unchanged |
