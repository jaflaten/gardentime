# Step 27.7 - Undo/Redo Implementation

**Status:** ✅ COMPLETED  
**Date:** October 30, 2025

---

## 🎯 Objective

Implement undo/redo functionality for the garden canvas to allow users to reverse and reapply actions, improving the editing experience and preventing data loss from accidental changes.

---

## ✨ What Was Implemented

### 1. Undo/Redo Hook (`useUndoRedo`)

**File:** `client-next/app/gardens/[id]/hooks/useUndoRedo.ts`

Created a comprehensive undo/redo system that tracks:

**Supported Actions:**
- `CREATE_OBJECT` - Creating canvas shapes
- `UPDATE_OBJECT` - Updating shape properties (position, size, color, etc.)
- `DELETE_OBJECT` - Deleting shapes
- `MOVE_GROW_AREA` - Moving grow areas
- `RESIZE_GROW_AREA` - Resizing grow areas
- `BATCH_MOVE` - Moving multiple items at once

**Features:**
- ✅ Maximum 50 undo steps (configurable)
- ✅ Separate undo and redo stacks
- ✅ Callback-based architecture for flexible action handling
- ✅ TypeScript type safety with union types
- ✅ Automatic state tracking with refs

**API:**
```typescript
const { canUndo, canRedo, undo, redo, recordAction } = useUndoRedo({
  onCreateObject: (object) => { /* recreate object */ },
  onUpdateObject: (id, updates) => { /* apply updates */ },
  onDeleteObject: (id) => { /* delete object */ },
  onMoveGrowArea: (id, x, y) => { /* move grow area */ },
  onResizeGrowArea: (id, width, height) => { /* resize grow area */ },
  onBatchMove: (moves) => { /* move multiple items */ },
});
```

---

### 2. Keyboard Shortcuts

**File:** `client-next/app/gardens/[id]/hooks/useKeyboardShortcuts.ts`

Added keyboard shortcuts for undo/redo:

- **Undo:** `Cmd+Z` (Mac) or `Ctrl+Z` (Windows/Linux)
- **Redo:** `Cmd+Shift+Z` or `Cmd+Y` (Mac) or `Ctrl+Shift+Z` or `Ctrl+Y` (Windows/Linux)

**Implementation:**
```typescript
// Undo (Cmd/Ctrl + Z)
if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
  e.preventDefault();
  onUndo?.();
}

// Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
if ((e.metaKey || e.ctrlKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) {
  e.preventDefault();
  onRedo?.();
}
```

---

### 3. UI Buttons

**File:** `client-next/app/gardens/[id]/components/DrawingToolbar.tsx`

Added Undo/Redo buttons to the toolbar:

**Visual Design:**
- Located between drawing tools and "Add Grow Area" button
- Disabled state when no actions available
- Tooltip showing keyboard shortcuts
- Arrow icons (↶ Undo, ↷ Redo)

**Features:**
- Buttons are disabled when no undo/redo actions available
- Visual feedback with gray disabled state
- Hover effects when enabled

---

### 4. Action Recording

**File:** `client-next/app/gardens/[id]/components/GardenBoardView.tsx`

Integrated action recording throughout the canvas:

**Canvas Object Actions:**
- Creating new shapes (rectangle, circle, line, arrow, text, freehand)
- Moving shapes via drag
- Resizing shapes
- Deleting shapes
- Duplicating shapes

**Grow Area Actions:**
- Moving grow areas
- Resizing grow areas
- Batch moving multiple grow areas

**Implementation Pattern:**
```typescript
// Before drag
onDragStart={() => {
  dragStartPosRef.current = { id, x, y, isGrowArea };
}}

// After drag
onDragEnd={(x, y) => {
  if (dragStartPosRef.current) {
    recordAction({
      type: 'UPDATE_OBJECT',
      objectId: id,
      before: { x: dragStartPosRef.current.x, y: dragStartPosRef.current.y },
      after: { x, y },
    });
  }
  // ... save to backend
}}
```

---

### 5. Canvas Shape Updates

**File:** `client-next/app/gardens/[id]/components/CanvasShape.tsx`

Added `onDragStart` callback support:
- Tracks initial position before drag
- Allows GardenBoardView to record "before" state
- Essential for proper undo tracking

---

## 🎨 User Experience

### Workflow

```
1. User draws a rectangle
   ↓ [recordAction: CREATE_OBJECT]
   Undo stack: [Create Rectangle]
   
2. User moves the rectangle
   ↓ [recordAction: UPDATE_OBJECT with before/after position]
   Undo stack: [Create Rectangle, Move Rectangle]
   
3. User changes rectangle color
   ↓ [recordAction: UPDATE_OBJECT with before/after color]
   Undo stack: [Create Rectangle, Move Rectangle, Change Color]
   
4. User presses Cmd+Z (Undo)
   ↓ [Applies "before" color from last action]
   Color reverts, action moves to redo stack
   
5. User presses Cmd+Shift+Z (Redo)
   ↓ [Applies "after" color from action]
   Color changes back, action returns to undo stack
```

### Visual Feedback

- **Undo Button:** Disabled (gray) when no actions to undo
- **Redo Button:** Disabled (gray) when no actions to redo
- **Tooltips:** Show keyboard shortcuts on hover
- **Instant Response:** Actions are undone/redone immediately

---

## 🔧 Technical Details

### Action Type System

```typescript
// Each action type has specific data
type CreateObjectAction = {
  type: 'CREATE_OBJECT';
  object: CanvasObject;  // Full object to recreate
  timestamp: number;
}

type UpdateObjectAction = {
  type: 'UPDATE_OBJECT';
  objectId: number;
  before: Partial<CanvasObject>;  // Previous state
  after: Partial<CanvasObject>;   // New state
  timestamp: number;
}

type DeleteObjectAction = {
  type: 'DELETE_OBJECT';
  object: CanvasObject;  // Full object to restore
  timestamp: number;
}
```

### State Management

**Two Stacks:**
1. **Undo Stack:** Stores actions that can be undone (most recent at end)
2. **Redo Stack:** Stores actions that can be redone (most recent at end)

**Flow:**
- New action → Push to undo stack, clear redo stack
- Undo → Pop from undo stack, push to redo stack, execute reverse
- Redo → Pop from redo stack, push to undo stack, execute forward

**Limits:**
- Maximum 50 actions in undo stack (configurable via `MAX_HISTORY`)
- Oldest actions are removed when limit exceeded
- Redo stack is cleared when new action is performed

---

## 📊 Action Coverage

### Fully Supported

✅ **Canvas Objects:**
- Creating shapes (all types)
- Moving shapes (drag)
- Resizing shapes (rectangle, circle)
- Deleting shapes
- Duplicating shapes
- Updating shape properties (color, opacity, stroke, etc.)

✅ **Grow Areas:**
- Moving grow areas (single)
- Moving grow areas (batch/multi-select)
- Resizing grow areas

### Not Yet Supported

❌ **Text Editing:**
- Text content changes are not tracked
- Could be added by recording UPDATE_OBJECT on text edit

❌ **Point Updates:**
- Line/arrow endpoint adjustments are not tracked
- Would need special handling for points array

❌ **Property Panel Changes:**
- Color picker, opacity slider changes are tracked
- But could be optimized to batch rapid changes

---

## 🧪 Testing Scenarios

### Test 1: Basic Undo/Redo
**Steps:**
1. Draw a rectangle
2. Move it to a new position
3. Press Cmd+Z (Undo)
4. Press Cmd+Shift+Z (Redo)

**Expected:**
- Undo: Rectangle returns to original position
- Redo: Rectangle moves back to new position
- Buttons enable/disable correctly

---

### Test 2: Multiple Actions
**Steps:**
1. Draw 3 shapes (rectangle, circle, line)
2. Move each shape
3. Change color of rectangle
4. Press Cmd+Z repeatedly

**Expected:**
- Each undo reverses one action in order
- After 7 undos, all shapes are removed
- Undo button disables when stack is empty

---

### Test 3: Delete and Restore
**Steps:**
1. Draw a circle
2. Delete the circle
3. Press Cmd+Z (Undo)

**Expected:**
- Circle reappears in original position
- All properties restored (color, size, etc.)

---

### Test 4: Grow Area Movement
**Steps:**
1. Move a grow area
2. Press Cmd+Z (Undo)

**Expected:**
- Grow area returns to original position
- Works with both single and batch moves

---

### Test 5: Redo Clears on New Action
**Steps:**
1. Draw a shape
2. Move it
3. Press Cmd+Z (Undo)
4. Draw a new shape

**Expected:**
- Redo stack is cleared
- Redo button becomes disabled
- Cannot redo the move anymore

---

### Test 6: Keyboard Shortcuts Don't Interfere
**Steps:**
1. Click in a text input
2. Type some text
3. Press Cmd+Z

**Expected:**
- Text input's native undo works
- Canvas undo doesn't trigger
- No interference with form editing

---

## 🎯 Design Decisions

### 1. Callback-Based Architecture

**Choice:** Use callbacks instead of direct state manipulation  
**Reasoning:**
- Parent component controls state
- Hook is reusable in different contexts
- Easier to test independently
- Cleaner separation of concerns

### 2. Before/After Tracking

**Choice:** Store both before and after states for updates  
**Reasoning:**
- Makes undo AND redo straightforward
- No need to recompute state
- More reliable than reverse operations
- Slightly more memory, but better UX

### 3. Refs for Position Tracking

**Choice:** Use refs to store drag start position  
**Reasoning:**
- Avoids state updates during drag
- More performant
- Position available when drag ends
- No unnecessary re-renders

### 4. Limited History

**Choice:** Maximum 50 undo steps  
**Reasoning:**
- Prevents unlimited memory growth
- 50 actions is sufficient for most sessions
- Can be increased if needed
- Oldest actions are least likely to be undone

### 5. Clear Redo on New Action

**Choice:** Clear redo stack when new action is performed  
**Reasoning:**
- Standard undo/redo behavior
- Prevents confusing state branches
- Matches user expectations from other apps
- Simpler state management

---

## 🔄 Integration with Existing Features

### Auto-Save

**Behavior:** Undo/redo triggers auto-save  
**Flow:**
1. User undoes action
2. Canvas object state updates
3. Auto-save hook detects change
4. Debounced save to backend (800ms)

**Note:** This is intentional - undo/redo updates the actual data, not just local UI state.

### Multi-Select

**Behavior:** Batch moves are recorded as single action  
**Example:**
- Select 3 grow areas
- Drag them together
- One BATCH_MOVE action is recorded
- Undo moves all 3 back at once

### Snap-to-Grid

**Behavior:** Snapped positions are recorded  
**Flow:**
1. User drags with snap enabled
2. Position snaps to grid
3. Snapped position is recorded in undo action
4. Undo restores to pre-snap position

---

## 🚀 Future Enhancements

### Potential Improvements

1. **Undo/Redo History Panel**
   - Show list of actions
   - Jump to specific action
   - Clear history button

2. **Grouped Actions**
   - Batch rapid property changes
   - Treat related actions as one step
   - Reduces undo stack noise

3. **Persistent Undo**
   - Save undo stack to localStorage
   - Restore on page reload
   - Useful for long editing sessions

4. **Visual Undo Preview**
   - Highlight what will change
   - Show before/after comparison
   - Helps user understand action

5. **Undo/Redo for Text Editing**
   - Track text content changes
   - Support rich text editing
   - Multiple text edit steps

6. **Smart Action Merging**
   - Merge consecutive moves
   - Merge rapid color changes
   - Cleaner undo experience

---

## 📁 Files Created/Modified

### New Files

1. **`client-next/app/gardens/[id]/hooks/useUndoRedo.ts`** (NEW)
   - Complete undo/redo system
   - ~230 lines
   - TypeScript union types for actions

### Modified Files

1. **`client-next/app/gardens/[id]/hooks/useKeyboardShortcuts.ts`**
   - Added onUndo/onRedo callbacks
   - Keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
   - ~25 lines added

2. **`client-next/app/gardens/[id]/components/DrawingToolbar.tsx`**
   - Added undo/redo buttons
   - Props for canUndo, canRedo, onUndo, onRedo
   - ~35 lines added

3. **`client-next/app/gardens/[id]/components/GardenBoardView.tsx`**
   - Integrated useUndoRedo hook
   - Added recordAction calls throughout
   - Added refs for drag start tracking
   - Passed undo/redo to toolbar
   - ~100 lines modified/added

4. **`client-next/app/gardens/[id]/components/CanvasShape.tsx`**
   - Added onDragStart prop and callback
   - ~10 lines added

**Total Changes:** ~400 lines across 5 files

---

## ✅ Checklist

- [x] Create useUndoRedo hook
- [x] Define action types (CREATE, UPDATE, DELETE, MOVE, RESIZE, BATCH_MOVE)
- [x] Implement undo/redo logic with stacks
- [x] Add keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- [x] Add undo/redo buttons to toolbar
- [x] Track canvas object creation
- [x] Track canvas object updates (move, resize)
- [x] Track canvas object deletion
- [x] Track canvas object duplication
- [x] Track grow area movement
- [x] Track grow area resizing
- [x] Track batch moves (multi-select)
- [x] Add drag start tracking with refs
- [x] Update CanvasShape with onDragStart
- [x] Test TypeScript compilation
- [x] Build successfully
- [x] Update documentation

---

## 🎉 Conclusion

The undo/redo implementation provides a professional editing experience for the garden canvas. Users can confidently experiment with their garden layouts knowing they can easily reverse any mistakes.

The system is built on solid TypeScript foundations with proper type safety, making it maintainable and extensible. The callback-based architecture allows for easy integration with existing features like auto-save and multi-select.

With keyboard shortcuts matching industry standards (Cmd/Ctrl+Z for undo) and clear visual feedback through toolbar buttons, the feature feels familiar and intuitive to users.

**Status:** ✅ Production Ready  
**Impact:** High - Essential feature for professional editing tools  
**User Experience:** Significantly enhanced - reduces fear of making mistakes
