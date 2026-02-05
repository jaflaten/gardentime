# Grow Area Rotation Feature

## Status: ✅ IMPLEMENTED
## Date: 2026-02-05

---

## Overview

Added the ability to rotate grow areas on the canvas board view. Users can now visually rotate their garden beds, boxes, and other grow areas to match their real-world garden layout.

---

## Features

### Rotation Controls
- **Rotation handle**: Small circle above the selected grow area
- **Snap angles**: Rotates in 22.5° increments (16 positions for full 360°)
- **Visual feedback**: Grow area rotates in real-time while dragging
- **Persistence**: Rotation angle saved to database

### Supported Angles
0°, 22.5°, 45°, 67.5°, 90°, 112.5°, 135°, 157.5°, 180°, 202.5°, 225°, 247.5°, 270°, 292.5°, 315°, 337.5°

---

## How to Use

1. Navigate to a garden's **Board View**
2. **Click on a grow area** to select it
3. Look for the **rotation handle** (small circle above the selection box)
4. **Drag the rotation handle** to rotate the grow area
5. Release to save - rotation persists automatically

---

## Technical Implementation

### Database

**Migration V14** - Add rotation column:
```sql
ALTER TABLE grow_area_entity
ADD COLUMN rotation DECIMAL(5,1) DEFAULT 0;
```

**Migration V15** - Fix column type for Hibernate compatibility:
```sql
ALTER TABLE grow_area_entity
ALTER COLUMN rotation TYPE DOUBLE PRECISION USING rotation::double precision;
```

### Backend Changes

**GrowArea Model** (`src/main/kotlin/no/sogn/gardentime/model/GrowArea.kt`):
```kotlin
data class GrowArea(
    // ... existing fields
    val rotation: Double? = 0.0,  // Rotation angle in degrees (0-360)
)
```

**DTOs** (`src/main/kotlin/no/sogn/gardentime/api/GrowAreaController.kt`):
- `CreateGrowAreaRequest` - includes `rotation: Double?`
- `UpdateGrowAreaRequest` - includes `rotation: Double?`

### Frontend Changes

**Types** (`client-next/lib/api.ts`):
```typescript
export interface GrowArea {
  // ... existing fields
  rotation?: number;  // Rotation angle in degrees (0-360)
}
```

**GrowAreaBox Component** (`client-next/app/gardens/[id]/components/GrowAreaBox.tsx`):
- Added `onRotate` callback prop
- Uses Konva `Transformer` with `rotateEnabled={true}`
- Rotation snaps configured: `rotationSnaps={[0, 22.5, 45, ...]}`
- Group component applies rotation around center using `offsetX`/`offsetY`
- **Important**: Transformer must be a sibling of Group, not a child

**GardenBoardView** (`client-next/app/gardens/[id]/components/GardenBoardView.tsx`):
- Added `onUpdateRotation` prop
- Passes `onRotate` handler to GrowAreaBox

**Board Page** (`client-next/app/gardens/[id]/board/page.tsx`):
- Added `handleUpdateRotation` function
- Optimistic UI update for smooth UX
- Calls `growAreaService.update()` to persist

---

## Files Modified

### Backend
```
src/main/kotlin/no/sogn/gardentime/
├── model/GrowArea.kt                    # Added rotation field
├── api/GrowAreaController.kt            # DTOs include rotation
└── service/GrowAreaService.kt           # Handles rotation in create/update

src/main/resources/db/migration/
├── V14__add_rotation_to_grow_area.sql   # Initial column (DECIMAL)
└── V15__fix_rotation_column_type.sql    # Fix to DOUBLE PRECISION
```

### Frontend
```
client-next/
├── lib/api.ts                                      # GrowArea type includes rotation
└── app/gardens/[id]/
    ├── board/page.tsx                              # handleUpdateRotation
    └── components/
        ├── GardenBoardView.tsx                     # onUpdateRotation prop
        └── GrowAreaBox.tsx                         # Rotation UI & logic
```

---

## Key Technical Decisions

1. **22.5° increments** - Provides fine-grained control (16 positions) while maintaining snap behavior for ease of use

2. **Rotation around center** - Uses Konva's `offsetX`/`offsetY` to rotate around the center of the grow area rather than top-left corner

3. **Transformer as sibling** - Konva's Transformer component must be a sibling (not child) of the node it transforms. This required returning a React Fragment from GrowAreaBox.

4. **DOUBLE PRECISION column** - Changed from DECIMAL(5,1) to DOUBLE PRECISION to match Hibernate's expectation for Kotlin `Double` type

5. **Optimistic updates** - UI updates immediately on rotation, with API call in background for responsiveness

---

## Changelog

### 2026-02-05
- ✅ Added database migration V14 for rotation column
- ✅ Added migration V15 to fix column type (DECIMAL → DOUBLE PRECISION)
- ✅ Updated GrowArea model and entity with rotation field
- ✅ Updated frontend GrowArea type
- ✅ Implemented rotation UI in GrowAreaBox using Konva Transformer
- ✅ Added rotation handler flow from board page → GardenBoardView → GrowAreaBox
- ✅ Fixed Transformer placement (must be sibling, not child of Group)
