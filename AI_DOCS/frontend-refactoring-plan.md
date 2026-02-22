2# Frontend Refactoring Plan

**Created:** February 22, 2026  
**Status:** In Progress  
**Priority:** Medium - Technical debt reduction

---

## Completed Tasks ✅

### 1. Extract Authentication Guard HOC/Hook (Phase 1) - DONE
Already implemented as `useRequireAuth` hook in `hooks/useRequireAuth.ts`. Used by 6 pages:
- `gardens/page.tsx`
- `gardens/[id]/board/page.tsx`
- `gardens/[id]/grow-areas/page.tsx`
- `gardens/[id]/grow-areas/[growAreaId]/page.tsx`
- `profile/page.tsx`
- `search/page.tsx`

### 2. Remove Console Statements (Phase 2) - DONE
Removed ~15 debug console.log statements from client-side code:
- `grow-areas/[growAreaId]/page.tsx` - removed 8 debug logs
- `rotation-planner/page.tsx` - removed 3 debug logs  
- `useCopyPaste.ts` - removed 4 debug logs
- `season-plan/page.tsx` - removed 2 debug logs
- `profile/page.tsx`, `login/page.tsx` - removed error logs
- `AddCropToSeasonModal.tsx`, search components - removed error logs

Kept: E2E test logs (useful), BFF route logs (server-side debugging), error handling logs in critical paths.

### 3. Shared UI Component Library (Phase 3) - DONE
Created `components/ui/` directory with reusable components:
- `Button.tsx` - variants: primary, secondary, danger, ghost, outline; sizes: sm, md, lg
- `Input.tsx` - styled input with error state support
- `Select.tsx` - styled select with error state support
- `Modal.tsx` - reusable modal with Escape key handling and backdrop click
- `FormField.tsx` - label + children + error wrapper
- `Card.tsx` - card container with padding variants
- `Badge.tsx` - badge component with variants: default, success, warning, danger, info
- `index.ts` - barrel export for easy imports

Refactored `gardens/page.tsx` as proof of concept, replacing:
- Raw button elements → `<Button>` component
- Manual modal structure → `<Modal>` component  
- Label + input patterns → `<FormField>` + `<Input>` components

---

## Executive Summary

After analyzing the `client-next/` codebase, I've identified several areas of technical debt that should be addressed to improve maintainability, reduce code duplication, and enhance developer experience.

**Key Findings:**
- Large monolithic components (GardenBoardView: 1007 lines, grow area detail page: 902 lines)
- Duplicated authentication guard logic across 8+ pages
- No shared button/form components (duplicated Tailwind classes)
- Inconsistent error handling patterns
- 30+ console.log statements left in production code
- Duplicated type definitions and color presets
- Missing loading/error state abstractions

---

## 🔴 High Priority Refactors

### 1. Extract Authentication Guard HOC/Hook

**Problem:** Every protected page repeats the same auth check pattern:
```tsx
const { isAuthenticated, isLoading } = useAuth();

useEffect(() => {
  if (isLoading) return;
  if (!isAuthenticated) {
    router.push('/login');
  }
}, [isAuthenticated, isLoading]);

if (isLoading) return <Loading />;
if (!isAuthenticated) return null;
```

**Found in:** 8+ pages including:
- `gardens/page.tsx`
- `gardens/[id]/board/page.tsx`
- `gardens/[id]/grow-areas/page.tsx`
- `gardens/[id]/grow-areas/[growAreaId]/page.tsx`
- `profile/page.tsx`
- `search/page.tsx`

**Solution:** Create a `withAuth` HOC or `useRequireAuth` hook:

```tsx
// Option A: HOC wrapper component
export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <PageSkeleton />;
  if (!isAuthenticated) return null;
  
  return <>{children}</>;
}

// Option B: Custom hook
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isReady: !isLoading && isAuthenticated, isLoading };
}
```

**Estimated effort:** 2-3 hours  
**Impact:** Eliminates 50+ lines of duplicated code across 8+ files

---

### 2. Split GardenBoardView Component (1007 lines)

**Problem:** `GardenBoardView.tsx` is doing too much:
- Canvas rendering
- Drawing interaction handling
- Selection state management
- Undo/redo coordination
- Context menu handling
- Keyboard shortcuts coordination
- Auto-save coordination
- Grow area CRUD operations
- Canvas object CRUD operations

**Solution:** Further decompose into:

```
GardenBoardView.tsx (main orchestrator, ~300 lines)
├── hooks/useCanvasState.ts (consolidated state management)
├── hooks/useCanvasEventHandlers.ts (mouse/keyboard events)
├── components/CanvasLayer.tsx (Konva Stage + rendering)
├── components/CanvasToolbarContainer.tsx (all toolbars)
└── components/CanvasPropertiesSidebar.tsx (properties panels)
```

**Already good:** The codebase already has 10 custom hooks extracted - this is excellent. The issue is the main component still coordinates too many concerns.

**Estimated effort:** 4-6 hours  
**Impact:** Better testability, easier maintenance

---

### 3. Split Grow Area Detail Page (902 lines)

**Problem:** `grow-areas/[growAreaId]/page.tsx` handles:
- Grow area display/edit
- Crop record CRUD (create, update, delete)
- 3 different modals
- Multiple form states (17 useState hooks!)
- History toggle view

**Solution:** Extract into separate components:

```
[growAreaId]/page.tsx (~200 lines, orchestration only)
├── components/GrowAreaHeader.tsx (display + edit button)
├── components/GrowAreaEditModal.tsx
├── components/CropRecordsList.tsx
├── components/CropRecordCard.tsx
├── components/CreateCropModal.tsx
├── components/EditCropModal.tsx
└── components/DeleteCropModal.tsx
```

**Estimated effort:** 4-5 hours  
**Impact:** Significantly easier to maintain crop record features

---

## 🟡 Medium Priority Refactors

### 4. Create Shared UI Component Library

**Problem:** Duplicated Tailwind classes for common patterns:

**Buttons (7+ variations found):**
```tsx
// Primary button - duplicated in 7+ files
className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"

// Secondary button - duplicated in 5+ files
className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
```

**Solution:** Create `components/ui/` directory:

```tsx
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  const baseClasses = 'rounded-lg transition font-medium disabled:opacity-50';
  const variantClasses = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    />
  );
}
```

**Additional components needed:**
- `components/ui/Input.tsx`
- `components/ui/Select.tsx`
- `components/ui/Modal.tsx`
- `components/ui/Card.tsx`
- `components/ui/Badge.tsx`
- `components/ui/FormField.tsx` (label + input + error)

**Estimated effort:** 4-6 hours  
**Impact:** Consistent UI, faster development, easier theming

---

### 5. Consolidate Color Presets

**Problem:** `COLOR_PRESETS` array defined in 2 places:
- `ShapePropertiesPanel.tsx`
- `GrowAreaPropertiesPanel.tsx`

Both have slightly different colors and no shared source.

**Solution:** Create shared constants:

```tsx
// lib/constants/colors.ts
export const SHAPE_COLOR_PRESETS = [
  '#000000', '#ffffff', '#ef4444', '#f59e0b', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

export const ZONE_TYPE_COLORS: Record<string, string> = {
  BOX: '#3b82f6',
  FIELD: '#22c55e',
  BED: '#92400e',
  BUCKET: '#6b7280',
};

// Reusable ColorPicker component
export function ColorPicker({ value, onChange, presets = SHAPE_COLOR_PRESETS }) {
  // ...
}
```

**Estimated effort:** 1-2 hours  
**Impact:** Single source of truth for colors

---

### 6. Standardize Error Handling

**Problem:** Inconsistent error extraction patterns:

```tsx
// Pattern 1 (most common)
setError(err.response?.data?.message || 'Failed to load data');

// Pattern 2
setError(err.response?.data?.message || err.message || 'Failed to load data');

// Pattern 3 (in API interceptor)
console.error('Get gardens error:', error);
```

**Solution:** Create error utility:

```tsx
// lib/utils/errors.ts
export function extractErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'object' && err !== null) {
    const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
    return axiosError.response?.data?.message || axiosError.message || fallback;
  }
  return fallback;
}

// Usage
catch (err) {
  setError(extractErrorMessage(err, 'Failed to load garden'));
}
```

**Estimated effort:** 2 hours  
**Impact:** Consistent error messages, easier debugging

---

### 7. Remove Console Statements

**Problem:** 30+ `console.log`, `console.error`, `console.warn` statements in production code.

**Files with most console statements:**
- `grow-areas/[growAreaId]/page.tsx`: 8 occurrences
- `GardenBoardView.tsx`: 6 occurrences
- `season-plan/page.tsx`: 4 occurrences

**Solution:** 
1. Remove unnecessary debug logs
2. Replace error logs with proper error reporting (Sentry, etc.) or use a logger that can be disabled in production

```tsx
// lib/logger.ts
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: unknown[]) => isDev && console.log('[DEBUG]', ...args),
  warn: (...args: unknown[]) => isDev && console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args), // Keep errors
};
```

**Estimated effort:** 1-2 hours  
**Impact:** Cleaner production console, better log hygiene

---

## 🟢 Low Priority / Nice-to-Have

### 8. Type Safety Improvements

**Problem:** Several `any` type usages found:
- `GardenCapacityWidget.tsx`: 3 occurrences
- `grow-areas/page.tsx`: 6 occurrences
- Multiple `err: any` in catch blocks

**Solution:** Replace `any` with proper types or `unknown`.

**Estimated effort:** 2-3 hours

---

### 9. Consolidate API Service Types

**Problem:** `lib/api.ts` is 576 lines and growing. Types and services are mixed together.

**Solution:** Split into:
```
lib/
├── api/
│   ├── client.ts          (axios instance + interceptors)
│   ├── services/
│   │   ├── auth.ts
│   │   ├── gardens.ts
│   │   ├── grow-areas.ts
│   │   ├── crops.ts
│   │   ├── plants.ts
│   │   └── canvas-objects.ts
│   └── index.ts           (re-exports)
├── types/
│   ├── auth.ts
│   ├── garden.ts
│   ├── grow-area.ts
│   ├── crop.ts
│   ├── plant.ts
│   └── canvas.ts
└── api.ts                  (backward-compatible re-export)
```

**Estimated effort:** 3-4 hours  
**Impact:** Better code organization, easier to find types

---

### 10. BFF Route Code Deduplication

**Problem:** All 20+ BFF routes follow identical patterns:
```tsx
// Pattern repeated in every route
const token = getTokenFromRequest(request);
if (!token) {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}
// ... actual logic
catch (error: any) {
  if (error.response) { ... }
  return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
}
```

**Solution:** Create middleware helpers:

```tsx
// lib/api/bff-helpers.ts
export async function withAuth<T>(
  request: NextRequest,
  handler: (token: string) => Promise<T>
): Promise<NextResponse> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await handler(token);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleApiError(error);
  }
}

// Usage
export async function GET(request: NextRequest) {
  return withAuth(request, async (token) => {
    const response = await springApi.get('/api/gardens', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  });
}
```

**Estimated effort:** 3-4 hours  
**Impact:** 50%+ reduction in BFF route code

---

## Implementation Order (Recommended)

| Phase | Items | Est. Time | Impact |
|-------|-------|-----------|--------|
| 1 | Auth guard HOC (#1) | 2-3 hours | Quick win, reduces 50+ lines |
| 2 | Remove console statements (#7) | 1-2 hours | Quick cleanup |
| 3 | Shared UI components (#4) | 4-6 hours | Foundation for future |
| 4 | Error handling utility (#6) | 2 hours | Consistency |
| 5 | Color presets consolidation (#5) | 1-2 hours | Quick win |
| 6 | Split GardenBoardView (#2) | 4-6 hours | Maintainability |
| 7 | Split Grow Area Detail (#3) | 4-5 hours | Maintainability |
| 8 | API service split (#9) | 3-4 hours | Organization |
| 9 | BFF route helpers (#10) | 3-4 hours | DRY backend |
| 10 | Type safety (#8) | 2-3 hours | Quality |

**Total estimated effort:** 26-39 hours

---

## What's Already Done Well ✅

The codebase has several good patterns already:

1. **Custom hooks extraction** - 10 hooks in `hooks/` folder covering persistence, zoom, drawing, selection, undo/redo, etc.
2. **Component separation** - Canvas components are well-separated (CanvasShape, GrowAreaBox, etc.)
3. **BFF pattern** - Clean separation between client and Spring Boot backend
4. **TypeScript usage** - Good type definitions in `lib/api.ts`
5. **Context providers** - Auth and DevMode contexts properly implemented
6. **Dashboard widgets** - Dashboard components are properly modular

---

## Notes

- Consider using a component library (shadcn/ui, Radix) for the UI components instead of building from scratch
- The hooks folder is well-organized; follow this pattern for new abstractions
- Consider adding ESLint rules to prevent `console.log` and `any` types in PRs
