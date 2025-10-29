# Testing Guide: Canvas Drawing Tools

**Last Updated:** October 29, 2025

This guide provides step-by-step instructions for testing the newly implemented canvas drawing features.

---

## Prerequisites

1. **Backend Running:** Spring Boot server on `localhost:8080`
2. **Frontend Running:** Next.js dev server on `localhost:3000`
3. **Logged In:** Have a user account and be logged in
4. **Garden Created:** Have at least one garden to work with

---

## Test 1: Drawing Basic Shapes

### Rectangle Tool
1. Navigate to a garden detail page (board view)
2. Click the **Rectangle** tool (icon: ▭, shortcut: `3`)
3. Click and drag on the canvas to draw a rectangle
4. Release mouse - rectangle should be saved and appear in the view
5. **Expected:** Rectangle appears with black border, transparent fill

### Circle Tool
1. Click the **Circle** tool (icon: ○, shortcut: `4`)
2. Click and drag on the canvas
3. Release mouse
4. **Expected:** Perfect circle appears with black border, transparent fill

### Line Tool
1. Click the **Line** tool (icon: ─, shortcut: `5`)
2. Click and drag to draw a line
3. Release mouse
4. **Expected:** Straight line appears between start and end points

### Arrow Tool
1. Click the **Arrow** tool (icon: →, shortcut: `6`)
2. Click and drag to draw an arrow
3. Release mouse
4. **Expected:** Arrow appears with arrowhead pointing toward the end point

---

## Test 2: Shift Key Modifiers

### Perfect Squares (Rectangle + Shift)
1. Select Rectangle tool (`3`)
2. Start dragging to draw a rectangle
3. **While still dragging, press and hold Shift**
4. **Expected:** Rectangle should instantly snap to a perfect square
5. **Move mouse while holding Shift** - should remain a square
6. **Release Shift** (still dragging) - should return to rectangle
7. **Press Shift again** - back to square
8. Release mouse to save

**Success Criteria:**
- ✓ Shape instantly changes to square when Shift is pressed
- ✓ Shape returns to rectangle when Shift is released
- ✓ Works smoothly during dragging
- ✓ Square maintains aspect ratio in all drag directions

### 45° Angle Constraints (Line + Shift)
1. Select Line tool (`5`)
2. Start dragging to draw a line
3. **While still dragging, press and hold Shift**
4. **Expected:** Line should snap to nearest 45° angle (horizontal, vertical, or diagonal)
5. **Move mouse in a circle while holding Shift**
6. **Expected:** Line should snap through 8 different angles:
   - 0° (→ horizontal right)
   - 45° (↗ diagonal up-right)
   - 90° (↑ vertical up)
   - 135° (↖ diagonal up-left)
   - 180° (← horizontal left)
   - 225° (↙ diagonal down-left)
   - 270° (↓ vertical down)
   - 315° (↘ diagonal down-right)
7. Release Shift - line should move freely again
8. Release mouse to save

**Success Criteria:**
- ✓ Line snaps to 45° increments when Shift is held
- ✓ Snapping feels responsive and natural
- ✓ All 8 angles are reachable
- ✓ Line maintains length while snapping

### 45° Angle Constraints (Arrow + Shift)
1. Select Arrow tool (`6`)
2. Repeat the same test as with lines
3. **Expected:** Same behavior as lines
4. **Additional Check:** Arrowhead should always point in the correct direction

---

## Test 3: Adjustable Endpoints

### Line Endpoint Editing
1. **Create a line** using the Line tool
2. **Switch to Select tool** (`1` or click SELECT)
3. **Click the line** to select it
4. **Expected:** Two green circular handles appear at each endpoint
5. **Drag the start point handle** to a new location
6. **Expected:** 
   - Handle follows cursor while dragging
   - Line updates in real-time
   - Line is saved when you release
7. **Drag the end point handle** to a different location
8. **Expected:** Same behavior - line updates and saves
9. **Click elsewhere** to deselect
10. **Expected:** Handles disappear

**Visual Check:**
- Handles should be green circles with white borders
- Handles should be easily clickable (6px radius = 12px diameter)
- Line should update smoothly during drag

### Arrow Endpoint Editing
1. **Create an arrow** using the Arrow tool
2. **Select it** with the Select tool
3. **Expected:** Two green handles appear (one at tail, one at arrowhead)
4. **Drag the end point handle** (at arrowhead)
5. **Expected:** 
   - Arrow updates in real-time
   - Arrowhead rotates to point in new direction
   - Arrow is saved when you release
6. **Drag the start point handle** (at tail)
7. **Expected:** Arrow length and angle update

**Success Criteria:**
- ✓ Handles appear on selection
- ✓ Handles are easily visible and clickable
- ✓ Dragging is smooth and responsive
- ✓ Arrow arrowhead points in correct direction after editing
- ✓ Changes are persisted (refresh page to verify)

---

## Test 4: Combined Workflow

### Realistic Drawing Scenario
1. **Draw a rectangle** to represent a garden bed
2. **Hold Shift** while dragging to make it a perfect square
3. **Draw another rectangle** nearby (any size)
4. **Draw a line** from the first square to the second rectangle
5. **Hold Shift** to make it horizontal
6. **Release and save the line**
7. **Select the line** and adjust its endpoints to fine-tune the connection
8. **Draw an arrow** pointing to one of the rectangles
9. **Use Shift** to make it point at 45° angle
10. **Adjust the arrow's start point** to originate from the other rectangle

**Expected Result:**
A simple diagram showing two rectangles connected by a line, with an arrow pointing to one of them.

**Success Criteria:**
- ✓ All shapes draw correctly
- ✓ Shift modifiers work during initial drawing
- ✓ Endpoint editing works after creation
- ✓ All shapes persist after page refresh
- ✓ Workflow feels natural and efficient

---

## Test 5: Edge Cases

### Test: Minimum Size Validation
1. Draw a very small rectangle (click and barely move mouse)
2. **Expected:** Should not save (too small to be useful)

### Test: Locked Objects
(This will be testable after properties panel is implemented)
1. Create a line or arrow
2. Lock it via properties panel or database
3. Select it
4. **Expected:** Handles appear but are not draggable

### Test: Zoom and Pan
1. Draw a line at 100% zoom
2. Zoom in to 150%
3. Select the line
4. Drag an endpoint
5. **Expected:** Endpoint editing works correctly at all zoom levels

### Test: Multi-object Selection
1. Draw multiple lines and arrows
2. Select one line
3. **Expected:** Only that line shows endpoint handles
4. Select a different object
5. **Expected:** Handles switch to the newly selected object

---

## Test 6: Keyboard Shortcuts

### Tool Switching
Test each shortcut key:
- `1` = SELECT tool
- `2` = PAN tool
- `3` = RECTANGLE tool
- `4` = CIRCLE tool
- `5` = LINE tool
- `6` = ARROW tool
- `7` = TEXT tool
- `8` = FREEHAND tool

**Expected:** Pressing each number switches to that tool immediately.

### Shift Modifier
- Works during drawing (tested above)
- Should NOT interfere when typing in text fields

---

## Test 7: Error Handling

### Backend Offline
1. Stop the Spring Boot backend server
2. Try to draw a shape
3. **Expected:** Shape appears visually but will fail to save
4. Error should be logged to browser console
5. Restart backend and try again - should work

### Network Issues
1. Use browser DevTools to throttle network to "Slow 3G"
2. Draw several shapes quickly
3. **Expected:** 
   - Shapes appear immediately (optimistic UI)
   - Backend saves may be delayed but should all eventually succeed
   - No errors or failed saves

---

## Test 8: Performance

### Many Objects
1. Draw 20-30 shapes (mix of rectangles, circles, lines, arrows)
2. **Expected:** 
   - Canvas remains responsive
   - Drawing new shapes is still smooth
   - Selecting objects is instant
   - Endpoint dragging is smooth

### Rapid Drawing
1. Select rectangle tool
2. Rapidly draw 10 rectangles in succession
3. **Expected:** 
   - All rectangles appear
   - No visual glitches
   - All rectangles are saved

---

## Bug Report Template

If you find any issues during testing, please report them with this format:

```
**Bug Title:** [Short description]

**Steps to Reproduce:**
1. Step one
2. Step two
3. ...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Screenshots:**
[If applicable]

**Browser:** Chrome/Firefox/Safari
**Zoom Level:** 100%/150%/etc.
**Console Errors:** [Any errors in browser console]
```

---

## Success Metrics

After completing all tests, the following should be true:

- ✓ All 4 basic shape tools (Rectangle, Circle, Line, Arrow) work
- ✓ Shift key modifiers work for rectangles (squares) and lines/arrows (45° angles)
- ✓ Endpoint handles appear when lines/arrows are selected
- ✓ Endpoint handles are draggable and update the shape
- ✓ All changes persist to the database
- ✓ No TypeScript errors in console
- ✓ No network errors (when backend is running)
- ✓ UI feels responsive and smooth
- ✓ Keyboard shortcuts work
- ✓ Help text in toolbar is accurate

---

## Next Features to Test (When Implemented)

### Step 25.6 - Shape Properties Panel
- [ ] Change fill color
- [ ] Change stroke color
- [ ] Adjust opacity
- [ ] Change border width
- [ ] Lock/unlock shapes
- [ ] Change line style (solid/dashed/dotted)

### Step 27 - Auto-save
- [ ] Changes save automatically without manual action
- [ ] Debouncing prevents excessive API calls
- [ ] Visual indicator shows save status

---

**Happy Testing! 🧪**
