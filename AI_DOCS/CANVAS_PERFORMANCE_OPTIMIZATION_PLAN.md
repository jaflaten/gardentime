# Canvas Performance Optimization Plan

**Created:** February 21, 2025  
**Updated:** February 21, 2025  
**Status:** In Progress (Phases 1-4 Complete)  
**Priority:** HIGH - User Experience Impact

---

## Problem Statement

The canvas board for managing grow areas feels sluggish when:
- Dragging/moving grow area boxes
- Resizing grow areas
- Rotating grow areas via the properties panel

Users experience noticeable lag between their input and visual feedback, making the canvas feel unresponsive.

---

## Completed Optimizations

### ✅ Phase 1: Debounced API Calls (COMPLETED)
**Files Changed:**
- Created `app/gardens/[id]/hooks/useGrowAreaSaver.ts`
- Updated `app/gardens/[id]/board/page.tsx`

**What was done:**
- Created `useGrowAreaSaver` hook with 500ms debounce
- All position, dimension, and rotation updates now use optimistic UI + debounced backend saves
- Multiple updates to the same grow area are merged into single API calls
- Auto-flush on page unload

### ✅ Phase 2: Fixed Component Key (COMPLETED)
**Files Changed:**
- `app/gardens/[id]/components/GardenBoardView.tsx`

**What was done:**
- Changed key from `${growArea.id}-${width}-${length}-${rotation}` to just `growArea.id`
- Prevents full component unmount/remount on dimension changes

### ✅ Phase 3: Removed Debug Logging (COMPLETED)
**Files Changed:**
- `app/gardens/[id]/components/GrowAreaBox.tsx`
- `app/gardens/[id]/components/GardenBoardView.tsx`

**What was done:**
- Removed `console.log` statements that fired on every render
- Kept error logging for actual failures

### ✅ Phase 4: React.memo with Custom Comparison (COMPLETED)
**Files Changed:**
- `app/gardens/[id]/components/GrowAreaBox.tsx`

**What was done:**
- Wrapped `GrowAreaBoxComponent` with `React.memo` and custom `arePropsEqual` function
- Custom comparison ignores callback props (they change reference but do the same thing)
- Compares only data props: growArea fields, isSelected, isMultiSelected, isDraggingEnabled
- Prevents unchanged GrowAreaBox components from re-rendering when sibling boxes change

### ✅ Phase 4b: Local Drag State - Konva Owns Position (COMPLETED)
**Files Changed:**
- `app/gardens/[id]/components/GrowAreaBox.tsx`

**What was done:**
- Added `isDragging` state to track when a drag is in progress
- During drag, Konva controls node position natively (60fps smooth)
- React does NOT try to update position from props while dragging
- On drag end, state syncs back and props update
- Added effect to sync Konva node position from props only when not dragging (supports undo/external updates)

**Root cause fixed:**
The "slow start, then speeds up" lag was caused by React re-renders conflicting with Konva's native drag handling. When any re-render occurred, React would try to set the node position from props while Konva was moving it, causing jank. Now Konva fully owns position during drag.

### ✅ Phase 6: Disable Shadows During Drag (COMPLETED)
**Files Changed:**
- `app/gardens/[id]/components/GrowAreaBox.tsx`

**What was done:**
- Added `shadowEnabled` variable that is `false` when `isDragging` is true
- Set `shadowBlur={0}` during drag as additional safeguard
- Applied `shadowEnabled={shadowEnabled}` to both Circle and Rect shapes

**Why this helps:**
Shadow blur calculations are GPU-intensive. Every frame during drag, the GPU must calculate the blur effect. By disabling shadows during drag, we eliminate this per-frame GPU work entirely.

---

## Deep Analysis: Remaining Performance Issues

### The Rendering Pipeline

```
DURING DRAG (Konva handles smoothly):
  Mouse Move → Konva updates node internally → Canvas redraws (60fps)

ON DRAG END (where lag occurs):
  Mouse Up → onDragEnd callback → setGrowAreas() 
  → React reconciliation → GardenBoardView re-executes (975 lines!)
  → ALL GrowAreaBox components re-render → Konva redraws everything
```

### Root Cause 1: Inline Callback Functions (CRITICAL)
Every render creates NEW function instances for each grow area:

```tsx
// GardenBoardView.tsx - Lines 691-760
{growAreas.map((growArea) => (
  <GrowAreaBox
    onDragStart={() => { ... }}      // NEW function every render
    onDragEnd={(x, y) => { ... }}    // NEW function every render  
    onResize={(w, h) => { ... }}     // NEW function every render
    onSelect={() => { ... }}         // NEW function every render
  />
))}
```

Even with `React.memo`, new function references trigger re-renders.

### Root Cause 2: No Memoization on GrowAreaBox
When ANY grow area changes position:
1. `setGrowAreas()` updates state with new array
2. Parent `GardenBoardView` re-renders
3. ALL `GrowAreaBox` children re-render (even unchanged ones)
4. Konva recreates/updates all nodes

With 10 grow areas, moving 1 causes 10 re-renders.

### Root Cause 3: Grid Recalculation on Every Render
```tsx
generateGridLines({ dimensions, scale, stagePosition }).map(...)
```
Grid lines array is regenerated on every render, creating new objects.

### Root Cause 4: Shadow Effects (GPU Expensive)
Each GrowAreaBox renders with blur shadows:
```tsx
shadowBlur={5-15px}
shadowOpacity={0.3}
```
Shadow calculations are GPU-intensive, especially with many boxes.

### Root Cause 5: Large Component Function
`GardenBoardView.tsx` is 975 lines. Every state change:
- Re-executes entire function body
- Recreates all inline functions
- Reconstructs entire JSX tree

---

## Remaining Implementation Plan

### Phase 5: Memoize Grid Lines (NEXT)
**Impact: 10% improvement**  
**Effort: Low**

```tsx
const gridLines = useMemo(
  () => generateGridLines({ dimensions, scale, stagePosition }),
  [dimensions.width, dimensions.height, scale, stagePosition.x, stagePosition.y]
);
```

### Phase 6: Disable Shadows During Drag
**Impact: 15% improvement**  
**Effort: Low**

Pass `isDragging` prop and disable shadows while dragging.

### Phase 7: Stable Callback References (Future)
**Impact: 25% improvement**  
**Effort: Medium**

Refactor to pass IDs instead of closures:
```tsx
// Instead of inline callbacks
<GrowAreaBox 
  id={growArea.id}
  onDragEnd={handleDragEnd}  // Stable reference, receives id as first arg
/>
```

### Phase 8: Konva Layer Separation (Future)
**Impact: 20% improvement**  
**Effort: Medium**

Separate Konva layers for:
- Static layer (grid - rarely changes)
- Dynamic layer (grow areas - frequently changes)
- UI layer (transformers, selection)

---

## Progress Summary

| Phase | Description | Status | Impact |
|-------|-------------|--------|--------|
| 1 | Debounce API calls | ✅ Complete | 60-70% |
| 2 | Fix component key | ✅ Complete | 15-20% |
| 3 | Remove debug logging | ✅ Complete | 5-10% |
| 4 | React.memo GrowAreaBox | ✅ Complete | 40% |
| 4b | Local drag state (Konva owns position) | ✅ Complete | 30% |
| 5 | Memoize grid lines | Pending | 10% |
| 6 | Disable shadows during drag | ✅ Complete | 15% |
| 7 | Stable callbacks | Future | 25% |
| 8 | Layer separation | Future | 20% |

---

## Files Modified

| File | Phase | Changes |
|------|-------|---------|
| `hooks/useGrowAreaSaver.ts` | 1 | NEW - Debounce hook |
| `board/page.tsx` | 1 | Use debounced saves |
| `components/GardenBoardView.tsx` | 2, 3 | Fix key, remove logs |
| `components/GrowAreaBox.tsx` | 3, 4, 4b, 6 | Remove logs, add memo, local drag state, disable shadows |
