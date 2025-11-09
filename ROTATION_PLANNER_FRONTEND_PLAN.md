# Crop Rotation Planner - Frontend Integration Plan

**Status**: Ready for Implementation  
**Priority**: HIGH - Core Feature Integration  
**Estimated Timeline**: 2-3 weeks

---

## Executive Summary

The crop rotation planner backend is now complete (Phases 1-4). We need to integrate it with the existing seasonal planner frontend to create a seamless, professional user experience. The seasonal planner already has the foundation - we'll enhance it with rotation intelligence.

---

## Current State Analysis

### ✅ What We Have

**Backend (Complete)**:
- RotationController with validation and recommendation endpoints
- RotationScoringService with comprehensive scoring (0-100)
- PlantDataApiClient fetching family, diseases, companions from plant-data-aggregator
- RotationRecommendationService suggesting best plants for each grow area

**Frontend (Existing)**:
- Season Plan page at `/gardens/[id]/season-plan`
- Climate info setup (frost dates, hardiness zone)
- Season plan creation (Spring/Summer/Fall/Winter)
- Planned crops display with dates
- Basic add/edit crop functionality

### ⚠️ Issues to Fix

**Build Error**:
- `app/api/gardens/[id]/calendar/route.ts` has type error with Next.js 15
- The `params` type needs to be awaited in Next.js 15

**Backend URL Mismatch**:
- Frontend POST to `/season-plans` (plural)
- Backend expects `/season-plan` (singular)
- Need to align these

**Missing Features**:
- No rotation validation when adding crops
- No rotation recommendations shown
- No planting history visualization
- No family-based color coding
- No disease/pest warnings

---

## Phase 1: Fix Critical Issues (Week 1, Days 1-2)

### 1.1 Fix Next.js 15 Type Errors

**Files to Update**:
- `client-next/app/api/gardens/[id]/calendar/route.ts`
- Any other route handlers with params

**Fix**:
```typescript
// OLD (broken in Next.js 15)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
}

// NEW (Next.js 15)
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const id = params.id;
}
```

**Tasks**:
- [ ] Update all route handlers to await params
- [ ] Test build succeeds
- [ ] Verify routes still work in dev mode

### 1.2 Fix Backend URL Alignment

**Option A**: Update backend to match frontend (breaking change)
**Option B**: Update frontend to match backend (simpler)

**Recommended: Option B**

**File**: `client-next/app/api/gardens/[id]/season-plans/route.ts`

**Change**:
```typescript
// Line 56 - Change POST endpoint
const response = await springApi.post(
  `/api/gardens/${params.id}/season-plan`,  // singular (was plural)
  body,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

**Tasks**:
- [ ] Update POST endpoint URL
- [ ] Test season plan creation works
- [ ] Verify no regressions

---

## Phase 2: Create API Client for Rotation (Week 1, Days 3-4)

### 2.1 Create TypeScript Types

**File**: `client-next/types/rotation.ts` (NEW)

```typescript
// Rotation Score Types
export interface RotationScore {
  plantName: string;
  growAreaId: string;
  overallScore: number;
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'AVOID';
  recommendation: string;
  components: ScoreComponent[];
  issues: RotationIssue[];
  benefits: RotationBenefit[];
}

export interface ScoreComponent {
  category: string;
  score: number;
  maxScore: number;
  explanation: string;
}

export interface RotationIssue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  message: string;
  suggestion: string;
}

export interface RotationBenefit {
  category: string;
  message: string;
  impact: string;
}

// Recommendation Types
export interface PlantRecommendation {
  plantName: string;
  score: number;
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  suitabilityReasons: string[];
  family: string;
  benefits: string[];
}

export interface RotationHistoryEntry {
  plantName: string;
  plantFamily: string;
  feederType: 'HEAVY' | 'MODERATE' | 'LIGHT';
  plantingDate: string;
  harvestDate: string | null;
  hadDiseases: boolean;
  yieldRating: number | null;
}
```

**Tasks**:
- [ ] Create types file
- [ ] Export from `types/index.ts`

### 2.2 Create API Client

**File**: `client-next/lib/api/rotation.ts` (NEW)

```typescript
import { api } from '../api';
import type {
  RotationScore,
  PlantRecommendation,
  RotationHistoryEntry
} from '@/types/rotation';

export const rotationApi = {
  // Validate a plant for a grow area
  validateRotation: async (
    gardenId: string,
    growAreaId: string,
    plantName: string,
    plantingDate?: string
  ): Promise<RotationScore> => {
    const response = await api.post(
      `/gardens/${gardenId}/grow-areas/${growAreaId}/rotation/validate`,
      { plantName, plantingDate }
    );
    return response.data;
  },

  // Get rotation recommendations
  getRecommendations: async (
    gardenId: string,
    growAreaId: string,
    filters?: {
      season?: string;
      maxResults?: number;
    }
  ): Promise<PlantRecommendation[]> => {
    const params = new URLSearchParams();
    if (filters?.season) params.append('season', filters.season);
    if (filters?.maxResults) params.append('maxResults', filters.maxResults.toString());
    
    const response = await api.get(
      `/gardens/${gardenId}/grow-areas/${growAreaId}/rotation/recommendations?${params}`
    );
    return response.data;
  },

  // Get planting history for a grow area
  getHistory: async (
    gardenId: string,
    growAreaId: string,
    yearsBack: number = 5
  ): Promise<RotationHistoryEntry[]> => {
    const response = await api.get(
      `/gardens/${gardenId}/grow-areas/${growAreaId}/rotation/history?yearsBack=${yearsBack}`
    );
    return response.data;
  }
};
```

**Tasks**:
- [ ] Create API client
- [ ] Add error handling
- [ ] Export from `lib/api/index.ts`

---

## Phase 3: Build Rotation UI Components (Week 1, Day 5 - Week 2, Day 3)

### 3.1 Rotation Score Gauge Component

**File**: `client-next/components/rotation/RotationScoreGauge.tsx` (NEW)

**Purpose**: Visual 0-100 score with color-coded grade

**Design**:
```
┌─────────────────────────┐
│    ROTATION SCORE       │
│                         │
│      ⬤  85             │
│      GOOD               │
│                         │
│  Safe to plant!         │
└─────────────────────────┘
```

**Features**:
- Circular progress indicator (0-100)
- Color coding: 
  - 80-100: Green (Excellent)
  - 60-79: Light green (Good)
  - 40-59: Yellow (Fair)
  - 20-39: Orange (Poor)
  - 0-19: Red (Avoid)
- Grade badge
- Short recommendation text

**Tasks**:
- [ ] Create gauge component with Tailwind
- [ ] Add color mapping logic
- [ ] Add animation on load
- [ ] Make responsive

### 3.2 Score Breakdown Component

**File**: `client-next/components/rotation/ScoreBreakdown.tsx` (NEW)

**Purpose**: Show detailed scoring by category

**Design**:
```
┌─────────────────────────────────────┐
│  SCORE BREAKDOWN                    │
├─────────────────────────────────────┤
│  Family Rotation      ████████ 28/35│
│  Nutrient Balance     ██████   20/25│
│  Disease Risk         ███      15/20│
│  Root Diversity       ████     8/10 │
│  Companions           ████████ 10/10│
└─────────────────────────────────────┘
```

**Features**:
- Progress bars for each category
- Hover tooltips explaining each category
- Color coding per bar
- Expandable explanations

**Tasks**:
- [ ] Create breakdown component
- [ ] Add tooltips with explanations
- [ ] Style progress bars
- [ ] Add expand/collapse for details

### 3.3 Issues & Benefits Component

**File**: `client-next/components/rotation/IssuesAndBenefits.tsx` (NEW)

**Purpose**: Show rotation warnings and benefits

**Design**:
```
┌─────────────────────────────────────┐
│  ⚠️ ISSUES (2)                     │
├─────────────────────────────────────┤
│  🔴 CRITICAL                         │
│  Same family planted last year      │
│  → Wait 1 more year or choose       │
│     different plant                 │
│                                     │
│  🟡 WARNING                          │
│  Heavy feeder after heavy feeder    │
│  → Consider adding compost          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ✅ BENEFITS (3)                    │
├─────────────────────────────────────┤
│  🌱 Good family rotation            │
│  🍃 Nitrogen fixer after heavy      │
│  🌿 Compatible with nearby crops    │
└─────────────────────────────────────┘
```

**Features**:
- Severity icons (🔴 Critical, 🟡 Warning, ℹ️ Info)
- Actionable suggestions
- Collapsible sections
- Benefit highlights with emojis

**Tasks**:
- [ ] Create issues section
- [ ] Create benefits section
- [ ] Add severity styling
- [ ] Make expandable

### 3.4 Plant Recommendations Component

**File**: `client-next/components/rotation/PlantRecommendations.tsx` (NEW)

**Purpose**: Show AI-recommended plants for the grow area

**Design**:
```
┌──────────────────────────────────────────────┐
│  🌟 RECOMMENDED FOR THIS GROW AREA           │
├──────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐            │
│  │  Beans     │  │  Peas      │            │
│  │  Score: 92 │  │  Score: 88 │            │
│  │  EXCELLENT │  │  EXCELLENT │            │
│  │  [+ Add]   │  │  [+ Add]   │            │
│  └────────────┘  └────────────┘            │
│                                             │
│  ✓ Nitrogen fixer after heavy feeder       │
│  ✓ Different family than last 3 years      │
│  ✓ Good for spring planting                │
└──────────────────────────────────────────────┘
```

**Features**:
- Card grid of top 6-12 recommendations
- Score and grade for each
- Quick "Add to Plan" button
- Reasons for recommendation
- Filter by season
- Search/filter functionality

**Tasks**:
- [ ] Create recommendation cards
- [ ] Add quick-add functionality
- [ ] Add filtering
- [ ] Style with hover effects
- [ ] Make responsive grid

### 3.5 Planting History Timeline

**File**: `client-next/components/rotation/PlantingHistory.tsx` (NEW)

**Purpose**: Visual timeline of what was planted when

**Design**:
```
┌─────────────────────────────────────────────┐
│  PLANTING HISTORY - Grow Area A             │
├─────────────────────────────────────────────┤
│  2024  [Tomatoes]  [Basil]                 │
│        Solanaceae  Lamiaceae               │
│                                             │
│  2023  [Beans]     [Lettuce]               │
│        Fabaceae    Asteraceae              │
│                                             │
│  2022  [Cabbage]   [Broccoli]              │
│        Brassicaceae Brassicaceae           │
│                                             │
│  2021  [Carrots]   [Onions]                │
│        Apiaceae    Amaryllidaceae          │
└─────────────────────────────────────────────┘
```

**Features**:
- Year-by-year timeline
- Family color coding (consistent colors per family)
- Hover to see details (dates, yield, diseases)
- Disease indicators (🦠 icon if diseases occurred)
- Yield ratings (⭐⭐⭐⭐⭐)

**Tasks**:
- [ ] Create timeline component
- [ ] Implement family color palette
- [ ] Add hover tooltips
- [ ] Add disease/yield indicators
- [ ] Make scrollable for long history

---

## Phase 4: Integrate into Season Planner (Week 2, Days 4-5)

### 4.1 Update Season Plan Page

**File**: `client-next/app/gardens/[id]/season-plan/page.tsx`

**Integration Points**:

1. **When adding a new crop**:
   - Show rotation validation before adding
   - Display score and issues
   - Allow user to proceed anyway (with warning)

2. **In planned crops list**:
   - Show rotation score badge next to each crop
   - Color-code by grade
   - Click to see full breakdown

3. **New "Rotation Planner" tab/section**:
   - Recommendations for each grow area
   - Planting history view
   - Educational content

**Tasks**:
- [ ] Add rotation validation to add crop flow
- [ ] Show scores in crop list
- [ ] Create rotation planner section
- [ ] Add tab navigation if needed

### 4.2 Enhanced Add Crop Modal

**Updated Flow**:
```
1. User clicks "Add Crop"
2. Modal shows plant selector
3. User selects plant
4. User selects grow area
5. → API: Validate rotation
6. → Show rotation score
7. If score < 60: Show warning
8. User can proceed or cancel
9. Save crop with rotation data
```

**Tasks**:
- [ ] Add rotation validation step
- [ ] Show validation results in modal
- [ ] Add "Proceed anyway" option for low scores
- [ ] Add "Choose different plant" button that shows recommendations

### 4.3 Grow Area Selector Enhancement

**Current**: Simple dropdown  
**Enhanced**: Show rotation scores for selected plant in each area

**Design**:
```
Select Grow Area:
┌─────────────────────────────────┐
│ ● Grow Area A       Score: 85   │ ← Recommended
│   Family: None last 3 years     │
│                                 │
│ ● Grow Area B       Score: 45   │
│   ⚠️ Same family last year      │
│                                 │
│ ● Grow Area C       Score: 72   │
│   Good rotation, heavy feeder   │
└─────────────────────────────────┘
```

**Tasks**:
- [ ] Fetch scores for all grow areas when plant selected
- [ ] Display scores in selector
- [ ] Sort by score (best first)
- [ ] Add visual indicators

---

## Phase 5: Polish & Professional UX (Week 3)

### 5.1 Loading States

**Add skeleton loaders for**:
- Rotation validation (in-progress spinner)
- Recommendations loading
- History loading

**Tasks**:
- [ ] Create skeleton components
- [ ] Add loading states to all async operations
- [ ] Add smooth transitions

### 5.2 Error Handling

**Graceful degradation when**:
- plant-data-aggregator API is down → Show basic validation only
- Plant not found → Suggest similar plants
- No grow areas → Prompt to create one
- No planting history → Show welcome/tutorial

**Tasks**:
- [ ] Add error boundaries
- [ ] Create fallback UI for each error case
- [ ] Add retry mechanisms
- [ ] Show helpful error messages

### 5.3 Onboarding & Education

**First-time user experience**:
1. Welcome modal explaining rotation benefits
2. Interactive tutorial highlighting key features
3. Sample data option to explore features
4. Tooltips throughout interface

**Tasks**:
- [ ] Create welcome modal
- [ ] Add feature highlights
- [ ] Create tooltip system
- [ ] Add "Learn more" links

### 5.4 Animations & Transitions

**Add subtle animations**:
- Score gauge animates from 0 to score
- Cards fade in on load
- Smooth tab transitions
- Hover effects on recommendations

**Tasks**:
- [ ] Add Framer Motion or CSS animations
- [ ] Test performance
- [ ] Ensure accessibility (respects prefers-reduced-motion)

### 5.5 Mobile Responsiveness

**Optimize for mobile**:
- Stack cards vertically on small screens
- Drawer for recommendations (bottom sheet)
- Touch-friendly buttons
- Swipe gestures for history timeline

**Tasks**:
- [ ] Test on mobile viewports
- [ ] Adjust layouts for small screens
- [ ] Test touch interactions
- [ ] Optimize performance

### 5.6 Accessibility

**Ensure WCAG 2.1 AA compliance**:
- Semantic HTML
- Keyboard navigation
- Screen reader friendly
- Sufficient color contrast
- Focus indicators
- ARIA labels

**Tasks**:
- [ ] Add ARIA labels
- [ ] Test with keyboard only
- [ ] Test with screen reader
- [ ] Check color contrast
- [ ] Add skip links

---

## Phase 6: Testing & Quality Assurance (Week 3)

### 6.1 Unit Tests

**Components to test**:
- RotationScoreGauge
- ScoreBreakdown
- IssuesAndBenefits
- PlantRecommendations
- PlantingHistory

**Tasks**:
- [ ] Write component tests
- [ ] Test with various score values
- [ ] Test edge cases (no data, errors)
- [ ] Aim for 80%+ coverage

### 6.2 Integration Tests

**User flows to test**:
1. Create season plan → Add crop with rotation validation
2. View rotation recommendations → Add recommended crop
3. Check planting history → See family patterns
4. Try to add bad rotation → See warnings → Proceed anyway

**Tasks**:
- [ ] Write Playwright E2E tests
- [ ] Test happy paths
- [ ] Test error scenarios
- [ ] Test mobile flows

### 6.3 Visual Regression Tests

**Use Playwright to capture**:
- Season plan page
- Add crop modal with rotation score
- Rotation planner view
- Mobile layouts

**Tasks**:
- [ ] Set up visual regression testing
- [ ] Capture baseline screenshots
- [ ] Add to CI pipeline

### 6.4 Performance Testing

**Metrics to monitor**:
- Time to validate rotation: < 500ms
- Time to load recommendations: < 2s
- Page load time: < 3s
- Lighthouse score: > 90

**Tasks**:
- [ ] Profile page performance
- [ ] Optimize slow queries
- [ ] Add caching where appropriate
- [ ] Test with slow network

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Day 1-2: Fix build errors and URL mismatches
- [ ] Day 3-4: Create API client and types
- [ ] Day 5: Start UI components (Score Gauge, Breakdown)

### Week 2: Core Features
- [ ] Day 1-3: Complete UI components (Issues, Benefits, Recommendations, History)
- [ ] Day 4-5: Integrate into Season Planner page

### Week 3: Polish
- [ ] Day 1-2: Loading states, error handling, animations
- [ ] Day 3: Mobile responsiveness
- [ ] Day 4: Accessibility audit
- [ ] Day 5: Testing and bug fixes

---

## Success Criteria

### Functional
- [ ] User can see rotation score when adding crop
- [ ] User can view recommendations for grow areas
- [ ] User can see planting history with family visualization
- [ ] Warnings shown for poor rotations
- [ ] Benefits highlighted for good rotations
- [ ] Quick-add from recommendations works

### Quality
- [ ] No TypeScript errors
- [ ] No runtime errors in console
- [ ] All tests passing
- [ ] Lighthouse score > 90
- [ ] Mobile friendly
- [ ] Accessible (WCAG AA)

### User Experience
- [ ] Intuitive and easy to use
- [ ] Professional appearance
- [ ] Fast and responsive (< 2s interactions)
- [ ] Helpful error messages
- [ ] Educational tooltips
- [ ] Smooth animations

---

## Risk Mitigation

### Risk: plant-data-aggregator API unavailable
**Mitigation**: Graceful degradation - show basic validation without detailed scoring

### Risk: User has no planting history
**Mitigation**: Show onboarding, explain benefits, allow adding crops anyway

### Risk: Performance issues with many grow areas
**Mitigation**: Implement pagination, lazy loading, caching

### Risk: User confusion about scores
**Mitigation**: Tooltips, help modals, clear explanations, visual indicators

---

## Future Enhancements (Post-Launch)

### Phase 7: Advanced Features
- Multi-year rotation calendar view
- Rotation plan templates (classic 4-year, etc.)
- Succession planting integration
- Soil health tracking over time
- Export rotation plan as PDF
- Integration with garden journal notes
- AI-powered full season plan generator

### Phase 8: Analytics
- Rotation compliance tracking
- Yield correlation with rotation score
- Disease occurrence tracking
- Soil quality trends
- Family diversity metrics

---

## Developer Notes

### Code Organization
```
client-next/
├── app/
│   └── gardens/
│       └── [id]/
│           └── season-plan/
│               └── page.tsx (main integration)
├── components/
│   └── rotation/
│       ├── RotationScoreGauge.tsx
│       ├── ScoreBreakdown.tsx
│       ├── IssuesAndBenefits.tsx
│       ├── PlantRecommendations.tsx
│       ├── PlantingHistory.tsx
│       └── index.ts
├── lib/
│   └── api/
│       └── rotation.ts
└── types/
    └── rotation.ts
```

### Design System Consistency
- Use existing Tailwind theme colors
- Match button styles from rest of app
- Use consistent spacing (4px grid)
- Follow existing card/shadow patterns
- Maintain typography hierarchy

### Performance Considerations
- Implement request caching (React Query recommended)
- Debounce API calls during plant search
- Lazy load heavy components
- Optimize images and icons
- Use React.memo for expensive renders

---

## Launch Readiness Checklist

- [ ] All phases 1-6 complete
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] User testing completed
- [ ] Documentation updated
- [ ] Error monitoring configured (Sentry)
- [ ] Analytics events tracked
- [ ] Backup/rollback plan ready
- [ ] Team trained on new features

---

**Ready to Build a Professional Rotation Planner! 🚀🌱**

This integration will transform GardenTime into a truly intelligent gardening assistant that helps users grow better, healthier crops through science-based rotation planning.
