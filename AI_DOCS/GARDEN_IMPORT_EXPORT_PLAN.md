# Garden Import/Export Feature - Implementation Plan

**Created**: 2026-01-29  
**Status**: Planned

---

## Problem Statement
Users need to export and import garden configurations (garden + grow areas with positions/dimensions) to:
1. Share garden layouts with family members
2. Back up and restore garden setups
3. Make testing easier for developers
4. Allow users to set up gardens once and reuse configurations

## Proposed Approach
- **Format**: JSON (human-readable, easy to edit)
- **Export scope**: Garden + grow areas (with positions, dimensions, properties)
- **Import behavior**: Always creates a NEW garden for the logged-in user (no overwrite/merge)
- **UI placement**:
  - **Import**: Gardens list page (where you see all your gardens)
  - **Export**: Inside a specific garden (garden detail/board pages)

## Data Shape (Export Format)

```json
{
  "exportVersion": "1.0",
  "exportedAt": "2026-01-29T11:47:26Z",
  "garden": {
    "name": "My Garden",
    "description": "Optional description",
    "location": "Optional location"
  },
  "growAreas": [
    {
      "name": "Bed 1",
      "zoneSize": "80x120cm",
      "zoneType": "BOX",
      "nrOfRows": 2,
      "notes": "Sunny spot",
      "positionX": 100,
      "positionY": 50,
      "width": 80,
      "length": 120,
      "height": 30
    }
  ]
}
```

---

## Workplan

### Phase 1: Backend API
- [ ] **1.1** Create export endpoint `GET /api/gardens/{id}/export`
  - Returns JSON with garden + grow areas
  - Add `exportVersion` and `exportedAt` metadata
  - Validate user owns the garden

- [ ] **1.2** Create import endpoint `POST /api/gardens/import`
  - Accept JSON body with garden structure
  - Create new garden for authenticated user. let the user choose a name
  - Create all grow areas linked to new garden
  - Return the created garden with new IDs

- [ ] **1.3** Create DTOs for import/export
  - `GardenExportDto` - export response shape
  - `GardenImportRequest` - import request shape
  - Keep separate from internal entities

### Phase 2: Frontend - Export
- [ ] **2.1** Add export button to garden detail pages
  - Add to GardenNavigation or garden header area
  - Trigger download of JSON file
  - File named: `{garden-name}-export.json`

- [ ] **2.2** Implement export API call in frontend
  - Add `gardenService.export(gardenId)` method
  - Handle file download in browser

### Phase 3: Frontend - Import
- [ ] **3.1** Add import button to gardens list page
  - Add "Import Garden" button near "Create Garden"
  - Opens file picker for JSON files

- [ ] **3.2** Implement import flow
  - Read and parse JSON file
  - Call import API endpoint
  - On success: navigate to new garden or refresh list
  - On error: show user-friendly error message

- [ ] **3.3** Add validation and error handling
  - Validate JSON structure before sending
  - Handle missing/invalid fields gracefully
  - Show helpful errors if format is wrong

### Phase 4: Polish & Testing
- [ ] **4.1** Manual testing of full flow
  - Export a garden → Import to same/different user
  - Verify all grow area properties preserved
  - Test error cases (invalid JSON, missing fields)

- [ ] **4.2** Add sample export file for testing
  - Create `docs/sample-garden-export.json`
  - Useful for family onboarding

---

## Technical Notes

### Backend Changes
- File: `src/main/kotlin/no/sogn/gardentime/api/GardenController.kt`
  - Add export endpoint
  - Add import endpoint
- New DTOs in `dto/` package
- Service layer changes in `GardenService.kt`

### Frontend Changes
- `client-next/app/gardens/page.tsx` - Add import button + modal
- `client-next/app/gardens/[id]/components/GardenNavigation.tsx` - Add export button
- `client-next/lib/api.ts` - Add import/export service methods

### Design Decisions
1. **New garden on import** - Safest approach, no data loss risk
2. **No crop history in v1** - Keep it simple, add later if needed
3. **exportVersion field** - Future-proofs the format for schema evolution
4. **Client-side file handling** - No server-side file storage needed

---

## Detailed Implementation Plan

### Phase 1: Backend API

#### 1.1 Create DTOs for Import/Export
**File**: `src/main/kotlin/no/sogn/gardentime/dto/GardenImportExportDto.kt` (NEW)

```kotlin
package no.sogn.gardentime.dto

import java.time.Instant

// Export response structure
data class GardenExportDto(
    val exportVersion: String = "1.0",
    val exportedAt: Instant,
    val garden: GardenDataDto,
    val growAreas: List<GrowAreaExportDto>
)

data class GardenDataDto(
    val name: String,
    val description: String? = null,
    val location: String? = null
)

data class GrowAreaExportDto(
    val name: String,
    val zoneSize: String? = null,
    val zoneType: String? = null,  // "BOX", "FIELD", "BED", "BUCKET"
    val nrOfRows: Int? = null,
    val notes: String? = null,
    val positionX: Double? = null,
    val positionY: Double? = null,
    val width: Double? = null,
    val length: Double? = null,
    val height: Double? = null
)

// Import request structure
data class GardenImportRequest(
    val exportVersion: String? = null,  // Optional, for validation
    val gardenName: String,  // User-provided name for imported garden
    val garden: GardenDataDto,
    val growAreas: List<GrowAreaExportDto> = emptyList()
)
```

#### 1.2 Add Export Endpoint
**File**: `src/main/kotlin/no/sogn/gardentime/api/GardenController.kt`

```kotlin
@GetMapping("/{id}/export")
fun exportGarden(@PathVariable id: UUID): ResponseEntity<GardenExportDto> {
    val exportData = gardenService.exportGarden(id)
    return ResponseEntity.ok(exportData)
}
```

#### 1.3 Add Import Endpoint  
**File**: `src/main/kotlin/no/sogn/gardentime/api/GardenController.kt`

```kotlin
@PostMapping("/import")
fun importGarden(@RequestBody request: GardenImportRequest): ResponseEntity<Garden> {
    val createdGarden = gardenService.importGarden(request)
    return ResponseEntity.status(HttpStatus.CREATED).body(createdGarden)
}
```

#### 1.4 Add Service Methods
**File**: `src/main/kotlin/no/sogn/gardentime/service/GardenService.kt`

```kotlin
fun exportGarden(gardenId: UUID): GardenExportDto {
    val garden = getGardenById(gardenId) 
        ?: throw IllegalArgumentException("Garden not found")
    
    return GardenExportDto(
        exportVersion = "1.0",
        exportedAt = Instant.now(),
        garden = GardenDataDto(name = garden.name),
        growAreas = garden.growAreas.map { area ->
            GrowAreaExportDto(
                name = area.name,
                zoneSize = area.zoneSize,
                zoneType = area.zoneType?.name,
                nrOfRows = area.nrOfRows,
                notes = area.notes,
                positionX = area.positionX,
                positionY = area.positionY,
                width = area.width,
                length = area.length,
                height = area.height
            )
        }
    )
}

fun importGarden(request: GardenImportRequest): Garden {
    val currentUserId = securityUtils.getCurrentUserId()
    
    // Create new garden with user-provided name
    val newGarden = Garden(
        name = request.gardenName,
        userId = currentUserId
    )
    val savedGarden = gardenRepository.save(mapToGardenEntity(newGarden))
    
    // Create grow areas
    request.growAreas.forEach { areaDto ->
        growAreaService.addGrowArea(
            name = areaDto.name,
            gardenId = savedGarden.id!!,
            zoneSize = areaDto.zoneSize,
            zoneType = areaDto.zoneType?.let { ZoneType.valueOf(it) },
            nrOfRows = areaDto.nrOfRows,
            notes = areaDto.notes,
            positionX = areaDto.positionX,
            positionY = areaDto.positionY,
            width = areaDto.width,
            length = areaDto.length,
            height = areaDto.height
        )
    }
    
    return getGardenById(savedGarden.id!!)!!
}
```

---

### Phase 2: Frontend - API Layer

#### 2.1 Add TypeScript Types
**File**: `client-next/lib/api.ts`

```typescript
// Garden Import/Export types
export interface GardenExportData {
  exportVersion: string;
  exportedAt: string;
  garden: {
    name: string;
    description?: string;
    location?: string;
  };
  growAreas: Array<{
    name: string;
    zoneSize?: string;
    zoneType?: ZoneType;
    nrOfRows?: number;
    notes?: string;
    positionX?: number;
    positionY?: number;
    width?: number;
    length?: number;
    height?: number;
  }>;
}

export interface GardenImportRequest {
  exportVersion?: string;
  gardenName: string;  // User-chosen name
  garden: {
    name: string;
    description?: string;
    location?: string;
  };
  growAreas: Array<{
    name: string;
    zoneSize?: string;
    zoneType?: ZoneType;
    nrOfRows?: number;
    notes?: string;
    positionX?: number;
    positionY?: number;
    width?: number;
    length?: number;
    height?: number;
  }>;
}
```

#### 2.2 Add Service Methods
**File**: `client-next/lib/api.ts` - add to `gardenService` object

```typescript
exportGarden: async (id: string): Promise<GardenExportData> => {
  const response = await api.get(`/gardens/${id}/export`);
  return response.data;
},

importGarden: async (data: GardenImportRequest): Promise<Garden> => {
  const response = await api.post('/gardens/import', data);
  return response.data;
},
```

---

### Phase 3: Frontend - Export UI

#### 3.1 Update GardenNavigation Component
**File**: `client-next/app/gardens/[id]/components/GardenNavigation.tsx`

- Add `Download` icon import from lucide-react
- Add `onExport` prop
- Add export button in header area

```tsx
import { Download } from 'lucide-react';

interface GardenNavigationProps {
  gardenId: string;
  gardenName?: string;
  onExport?: () => void;
}

// In the header section, add:
{onExport && (
  <button
    onClick={onExport}
    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-green-600 transition"
    title="Export garden configuration"
  >
    <Download className="w-4 h-4" />
    <span>Export</span>
  </button>
)}
```

#### 3.2 Add Export Handler to Garden Pages
**Files to update**:
- `client-next/app/gardens/[id]/board/page.tsx`
- `client-next/app/gardens/[id]/dashboard/page.tsx`  
- `client-next/app/gardens/[id]/grow-areas/page.tsx`
- `client-next/app/gardens/[id]/season-plan/page.tsx`

Add in each file:
```typescript
const handleExport = async () => {
  try {
    const exportData = await gardenService.exportGarden(gardenId);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${garden?.name || 'garden'}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    setError('Failed to export garden');
  }
};

// Update GardenNavigation usage:
<GardenNavigation gardenId={gardenId} gardenName={garden?.name} onExport={handleExport} />
```

---

### Phase 4: Frontend - Import UI

#### 4.1 Update Gardens List Page
**File**: `client-next/app/gardens/page.tsx`

Add state:
```typescript
const [showImportModal, setShowImportModal] = useState(false);
const [importData, setImportData] = useState<GardenExportData | null>(null);
const [importName, setImportName] = useState('');
const [importError, setImportError] = useState('');
const [importing, setImporting] = useState(false);
```

Add button next to "+ New Garden":
```tsx
<div className="flex gap-3">
  <button
    onClick={() => setShowImportModal(true)}
    className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
  >
    Import Garden
  </button>
  <button
    onClick={() => setShowCreateModal(true)}
    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
  >
    + New Garden
  </button>
</div>
```

Add handlers:
```typescript
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target?.result as string);
      if (!data.garden?.name) {
        setImportError('Invalid file: missing garden name');
        return;
      }
      setImportData(data);
      setImportName(data.garden.name);  // Pre-fill with original name
      setImportError('');
    } catch {
      setImportError('Invalid JSON file');
    }
  };
  reader.readAsText(file);
};

const handleImport = async () => {
  if (!importData || !importName.trim()) return;
  
  setImporting(true);
  try {
    await gardenService.importGarden({
      ...importData,
      gardenName: importName.trim()
    });
    setShowImportModal(false);
    setImportData(null);
    setImportName('');
    fetchGardens();
  } catch (err: any) {
    setImportError(err.response?.data?.message || 'Import failed');
  } finally {
    setImporting(false);
  }
};
```

Add modal:
```tsx
{showImportModal && (
  <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-gray-900">Import Garden</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select JSON file
        </label>
        <input
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        />
      </div>
      
      {importData && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Garden Name *
          </label>
          <input
            type="text"
            value={importName}
            onChange={(e) => setImportName(e.target.value)}
            className="w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Enter name for imported garden"
          />
          <p className="mt-2 text-sm text-gray-500">
            {importData.growAreas.length} grow area(s) will be imported
          </p>
        </div>
      )}
      
      {importError && (
        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded text-sm">
          {importError}
        </div>
      )}
      
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => {
            setShowImportModal(false);
            setImportData(null);
            setImportName('');
            setImportError('');
          }}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={!importData || !importName.trim() || importing}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? 'Importing...' : 'Import'}
        </button>
      </div>
    </div>
  </div>
)}
```

---

### Phase 5: Testing & Sample File

#### 5.1 Create Sample Export File
**File**: `docs/sample-garden-export.json` (NEW)

```json
{
  "exportVersion": "1.0",
  "exportedAt": "2026-01-29T12:00:00Z",
  "garden": {
    "name": "Family Garden 2026"
  },
  "growAreas": [
    {
      "name": "Tomato Bed",
      "zoneType": "BOX",
      "zoneSize": "120x80cm",
      "width": 120,
      "length": 80,
      "height": 30,
      "positionX": 50,
      "positionY": 50,
      "notes": "Full sun, south facing"
    },
    {
      "name": "Herb Corner",
      "zoneType": "BED",
      "width": 60,
      "length": 60,
      "positionX": 200,
      "positionY": 50
    },
    {
      "name": "Carrot Row",
      "zoneType": "BOX",
      "nrOfRows": 3,
      "width": 40,
      "length": 200,
      "positionX": 50,
      "positionY": 150
    }
  ]
}
```

#### 5.2 Test Cases
- [ ] Export garden with 0 grow areas → should work
- [ ] Export garden with multiple grow areas → all properties preserved
- [ ] Import exported file as same user → creates new garden
- [ ] Import and rename the garden → uses new name
- [ ] Import invalid JSON → shows error message
- [ ] Import file missing garden.name → shows error
- [ ] Import file with unknown zoneType → handles gracefully or shows error

---

## Files Changed Summary

| Layer | File | Change |
|-------|------|--------|
| Backend DTO | `dto/GardenImportExportDto.kt` | NEW |
| Backend API | `api/GardenController.kt` | Add 2 endpoints |
| Backend Service | `service/GardenService.kt` | Add 2 methods |
| Frontend Types | `lib/api.ts` | Add types + service methods |
| Frontend UI | `app/gardens/page.tsx` | Add import button + modal |
| Frontend UI | `app/gardens/[id]/components/GardenNavigation.tsx` | Add export button |
| Frontend UI | `app/gardens/[id]/board/page.tsx` | Add export handler |
| Frontend UI | `app/gardens/[id]/dashboard/page.tsx` | Add export handler |
| Frontend UI | `app/gardens/[id]/grow-areas/page.tsx` | Add export handler |
| Frontend UI | `app/gardens/[id]/season-plan/page.tsx` | Add export handler |
| Docs | `docs/sample-garden-export.json` | NEW sample file |

---

## Future Enhancements (Out of Scope)
- Export/import crop history and planting records
- Export/import season plans
- Export multiple gardens at once
- Garden templates/presets
- Share gardens via link (cloud storage)
