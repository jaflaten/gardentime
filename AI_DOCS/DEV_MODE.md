# Dev Mode - Component Label Feature

A development toggle that displays yellow outlines and component names across the application, making it easy to identify and reference specific components during development.

## Usage

Click the **🏷️ DEV** button in the navbar to toggle dev mode on/off.

When enabled:
- Components show a yellow outline
- Component names appear as labels above each component
- Makes it easy to reference specific components (e.g., "fix the GardenSummaryCard")

## Architecture

### Files

| File | Purpose |
|------|---------|
| `client-next/contexts/DevModeContext.tsx` | React context providing `isDevMode` state and `toggleDevMode` function |
| `client-next/components/DevLabel.tsx` | Wrapper component that renders outlines and labels when dev mode is active |
| `client-next/app/components/Navbar.tsx` | Contains the toggle button |

### How It Works

1. `DevModeProvider` wraps the entire app in `layout.tsx`
2. `DevLabel` wraps individual components and reads from the context
3. When `isDevMode` is false, `DevLabel` renders children unchanged
4. When `isDevMode` is true, `DevLabel` adds a yellow outline and name label

## Wrapped Components

### Dashboard Widgets
- `ActiveCropsWidget`
- `GardenSummaryCard`
- `UpcomingTasksWidget`
- `GardenCapacityWidget`
- `PlantingCalendarWidget`
- `RecentHarvestsWidget`

### Rotation Components
- `RotationBenefitCard`
- `RotationIssueCard`

### Layout Components
- `Navbar`
- `Footer`

### Garden Components
- `GardenNavigation`
- `DrawingToolbar`
- `SaveIndicator`

### Search/Modal Components
- `AddCropToSeasonModal`
- `GrowAreaSearch`
- `PlantSearch`

## Not Wrapped (Canvas Components)

The following components use react-konva and render to an HTML canvas, not DOM elements. DevLabel cannot wrap these:

- `CanvasShape`
- `GrowAreaBox`
- `MiniMap`
- `SelectionRectangle`
- `GardenBoardView`

## Adding DevLabel to New Components

```tsx
import DevLabel from '@/components/DevLabel';

// Rename existing component to *Content
function MyComponentContent({ props }: Props) {
  return (
    <div>...</div>
  );
}

// Export wrapped version
export default function MyComponent(props: Props) {
  return (
    <DevLabel name="MyComponent">
      <MyComponentContent {...props} />
    </DevLabel>
  );
}
```

## Notes

- Dev mode state is not persisted (resets on page refresh)
- The toggle is always visible in the navbar for quick access
- Labels use `z-50` so they appear above most content
