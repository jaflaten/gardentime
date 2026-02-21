# Canvas Performance Optimization Plan

**Created:** February 21, 2025  
**Status:** Planning  
**Priority:** HIGH - User Experience Impact

---

## Problem Statement

The canvas board for managing grow areas feels sluggish when:
- Dragging/moving grow area boxes
- Resizing grow areas
- Rotating grow areas via the properties panel

Users experience noticeable lag between their input and visual feedback, making the canvas feel unresponsive.

---

## Root Cause Analysis

### 1. Synchronous Backend API Calls (CRITICAL)
**Impact: HIGH**

Every user interaction triggers an **immediate HTTP request** to the backend:

```typescript
// board/page.tsx - No debouncing!
const handleUpdatePosition = async (id: string, x: number, y: number) => {
  setGrowAreas(...); // Optimistic update
  await growAreaService.update(id, { positionX: x, positionY: y }); // Blocking!
};
```

**Problem Flow:**
1. User drags box → `onDragEnd` fires
2. State updates (fast)
3. API call to Spring Boot backend (20-500ms)
4. Backend writes to PostgreSQL (10-50ms)
5. Response returns
6. Any error triggers full data refetch

This happens for **every single interaction** - drag, resize, rotate.

### 2. Component Key Causes Full Remounts (HIGH)
**Impact: HIGH**

```tsx
// GardenBoardView.tsx line 687
<GrowAreaBox
  key={`${growArea.id}-${growArea.width}-${growArea.length}-${growArea.rotation ?? 0}`}
  ...
/>
```

Including `width`, `length`, and `rotation` in the key means:
- Changing dimensions = **full component unmount/remount**
- Changing rotation = **full component unmount/remount**
- Konva transformer state is lost
- Animation state is lost
- More expensive than a simple re-render

### 3. Debug Logging on Every Render (MEDIUM)
**Impact: MEDIUM**

```tsx
// GrowAreaBox.tsx lines 48-61
React.useEffect(() => {
  console.log(`📊 GrowAreaBox "${growArea.name}" render:`, {...});
}, [isSelected, isMultiSelected, isDraggingEnabled, growArea.name, growArea.id]);
```

Console logging:
- Has measurable overhead
- Fires for every grow area on every render
- Multiplies with number of grow areas

### 4. No Memoization on GrowAreaBox (MEDIUM)
**Impact: MEDIUM**

`GrowAreaBox` is a plain functional component. When parent (`GardenBoardView`) re-renders:
- All `GrowAreaBox` instances re-render
- Even if their specific props haven't changed
- Konva nodes are recreated

### 5. Cascading State Updates (LOW-MEDIUM)
**Impact: LOW-MEDIUM**

Multiple state updates in sequence can cause multiple render cycles:
```typescript
setGrowAreas(...);      // Render 1
setSaveStatus('pending'); // Render 2
// etc.
```

---

## Prioritized Implementation Plan

### Phase 1: Debounce API Calls (HIGHEST IMPACT)
**Estimated Impact: 60-70% improvement**  
**Effort: Medium**

#### 1.1 Create `useGrowAreaSaver` Hook

Similar to existing `useCanvasObjectSaver`, but for grow areas:

```typescript
// app/gardens/[id]/hooks/useGrowAreaSaver.ts
'use client';

import { useCallback, useRef } from 'react';
import { growAreaService, UpdateGrowAreaRequest } from '@/lib/api';

interface PendingUpdate {
  id: string;
  updates: UpdateGrowAreaRequest;
  timestamp: number;
}

export function useGrowAreaSaver(delay = 500) {
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushUpdates = useCallback(async () => {
    const updates = Array.from(pendingUpdatesRef.current.values());
    pendingUpdatesRef.current.clear();

    if (updates.length === 0) return;

    // Process all updates in parallel
    const promises = updates.map(({ id, updates: data }) =>
      growAreaService.update(id, data).catch((error) => {
        console.error(`Failed to save grow area ${id}:`, error);
      })
    );

    await Promise.allSettled(promises);
  }, []);

  const scheduleUpdate = useCallback((id: string, updates: UpdateGrowAreaRequest) => {
    // Merge with existing pending updates for this grow area
    const existing = pendingUpdatesRef.current.get(id);
    const mergedUpdates = existing 
      ? { ...existing.updates, ...updates }
      : updates;

    pendingUpdatesRef.current.set(id, {
      id,
      updates: mergedUpdates,
      timestamp: Date.now(),
    });

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule flush after delay
    timeoutRef.current = setTimeout(flushUpdates, delay);
  }, [delay, flushUpdates]);

  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return flushUpdates();
  }, [flushUpdates]);

  return { scheduleUpdate, saveNow };
}
```

#### 1.2 Update `board/page.tsx` to Use Debounced Saves

```typescript
// Import the hook
import { useGrowAreaSaver } from '../hooks/useGrowAreaSaver';

// In component
const { scheduleUpdate: scheduleGrowAreaSave, saveNow } = useGrowAreaSaver(500);

const handleUpdatePosition = (id: string, x: number, y: number) => {
  // Optimistic update (instant)
  setGrowAreas(prevAreas =>
    prevAreas.map(area =>
      area.id === id ? { ...area, positionX: x, positionY: y } : area
    )
  );
  
  // Debounced save (batched)
  scheduleGrowAreaSave(id, { positionX: x, positionY: y });
};

// Similar for handleUpdateDimensions, handleUpdateRotation
```

#### 1.3 Save on Page Unload

```typescript
useEffect(() => {
  const handleBeforeUnload = () => saveNow();
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [saveNow]);
```

---

### Phase 2: Fix Component Key (HIGH IMPACT)
**Estimated Impact: 15-20% improvement**  
**Effort: Low (5 minutes)**

#### 2.1 Simplify GrowAreaBox Key

**Before:**
```tsx
key={`${growArea.id}-${growArea.width}-${growArea.length}-${growArea.rotation ?? 0}`}
```

**After:**
```tsx
key={growArea.id}
```

The component will still re-render when props change, but it won't **unmount and remount**, preserving:
- Transformer state
- Animation state
- Internal component state

---

### Phase 3: Remove Debug Logging (MEDIUM IMPACT)
**Estimated Impact: 5-10% improvement**  
**Effort: Low (5 minutes)**

#### 3.1 Remove or Conditionally Enable Debug Logs

**Option A: Remove entirely**
```typescript
// Delete these useEffects from GrowAreaBox.tsx
// Lines 48-61
```

**Option B: Environment-based (recommended)**
```typescript
// Only log in development when DEBUG_CANVAS is set
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_CANVAS) {
  console.log(...);
}
```

---

### Phase 4: Memoize GrowAreaBox (MEDIUM IMPACT)
**Estimated Impact: 10-15% improvement**  
**Effort: Low-Medium**

#### 4.1 Wrap Component with React.memo

```typescript
// GrowAreaBox.tsx
import React, { useState, memo } from 'react';

function GrowAreaBoxComponent({ ... }: GrowAreaBoxProps) {
  // ... existing implementation
}

// Custom comparison for performance
export default memo(GrowAreaBoxComponent, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return (
    prevProps.growArea.id === nextProps.growArea.id &&
    prevProps.growArea.positionX === nextProps.growArea.positionX &&
    prevProps.growArea.positionY === nextProps.growArea.positionY &&
    prevProps.growArea.width === nextProps.growArea.width &&
    prevProps.growArea.length === nextProps.growArea.length &&
    prevProps.growArea.rotation === nextProps.growArea.rotation &&
    prevProps.growArea.zoneType === nextProps.growArea.zoneType &&
    prevProps.growArea.customColor === nextProps.growArea.customColor &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isMultiSelected === nextProps.isMultiSelected &&
    prevProps.isDraggingEnabled === nextProps.isDraggingEnabled
  );
});
```

---

### Phase 5: Batch State Updates (LOW IMPACT)
**Estimated Impact: 2-5% improvement**  
**Effort: Low**

React 18 automatically batches state updates in most cases, but explicit batching can help:

```typescript
import { unstable_batchedUpdates } from 'react-dom';

// If needed for complex updates
unstable_batchedUpdates(() => {
  setGrowAreas(...);
  setSaveStatus('pending');
});
```

---

## Implementation Order

| Priority | Task | Impact | Effort | Phase |
|----------|------|--------|--------|-------|
| 1 | Create `useGrowAreaSaver` hook | HIGH | Medium | 1 |
| 2 | Integrate debounced saves in board/page.tsx | HIGH | Medium | 1 |
| 3 | Simplify GrowAreaBox key | HIGH | Low | 2 |
| 4 | Remove debug logging | MEDIUM | Low | 3 |
| 5 | Memoize GrowAreaBox | MEDIUM | Low | 4 |
| 6 | Batch state updates | LOW | Low | 5 |

---

## Expected Results

After implementing all phases:

| Metric | Before | After |
|--------|--------|-------|
| API calls per drag | 1 per drag-end | 1 per 500ms (batched) |
| Component remounts on resize | Yes | No |
| Re-renders on parent update | All boxes | Only changed boxes |
| Console log overhead | Every render | None/conditional |

**Overall Expected Improvement: 70-85% reduction in perceived lag**

---

## Testing Plan

1. **Baseline Measurement**
   - Open Chrome DevTools → Performance tab
   - Record while dragging a box
   - Note frame rate and main thread blocking

2. **After Each Phase**
   - Repeat measurement
   - Compare Network tab for API call frequency
   - Note subjective "feel" improvement

3. **Stress Test**
   - Create 20+ grow areas
   - Drag multiple in succession
   - Verify no dropped frames

---

## Rollback Plan

Each phase is independent. If issues arise:
1. Revert the specific phase's changes
2. Other optimizations remain in place
3. No data loss risk (backend unchanged)

---

## Future Considerations

1. **Virtual Canvas** - For 100+ grow areas, consider virtualization
2. **WebSocket Updates** - Real-time sync without polling
3. **IndexedDB Cache** - Offline-first with background sync
4. **Web Workers** - Offload heavy calculations

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/gardens/[id]/hooks/useGrowAreaSaver.ts` | NEW - Create debounce hook |
| `app/gardens/[id]/board/page.tsx` | Use debounced saves |
| `app/gardens/[id]/components/GardenBoardView.tsx` | Simplify key |
| `app/gardens/[id]/components/GrowAreaBox.tsx` | Remove logs, add memo |

---

**Ready to implement?** Start with Phase 1 (debouncing) for the biggest immediate impact.
