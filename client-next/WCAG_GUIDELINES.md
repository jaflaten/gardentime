# WCAG Accessibility Guidelines

This document outlines the WCAG 2.1 AA compliance standards for GardenTime UI components.

## Color Contrast Requirements

### Text Contrast Ratios (WCAG 2.1 Level AA)
- **Normal text** (< 18pt / 14pt bold): Minimum **4.5:1** contrast ratio
- **Large text** (≥ 18pt / 14pt bold): Minimum **3:1** contrast ratio
- **UI components & icons**: Minimum **3:1** contrast ratio

### Approved Color Combinations

| Element | Text Color | Background | Tailwind Classes |
|---------|------------|------------|------------------|
| Body text | `#171717` | `#ffffff` | `text-gray-900 bg-white` |
| Secondary text | `#374151` | `#ffffff` | `text-gray-700 bg-white` |
| Input text | `#171717` | `#ffffff` | `text-gray-900` |
| Placeholder text | `#6b7280` | `#ffffff` | `placeholder:text-gray-500` |
| Labels | `#374151` | `#ffffff` | `text-gray-700` |
| Error text | `#b91c1c` | `#fef2f2` | `text-red-700 bg-red-50` |
| Success text | `#15803d` | `#f0fdf4` | `text-green-700 bg-green-50` |

### Colors to AVOID (Insufficient Contrast)
- ❌ `text-gray-300` on white (fails 4.5:1)
- ❌ `text-gray-400` on white (fails 4.5:1)
- ❌ Light gray placeholder defaults in browsers

## Form Elements

### Input Fields
```tsx
<input
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
             focus:border-green-500 focus:ring-green-500 
             sm:text-sm px-3 py-2 border 
             text-gray-900 placeholder:text-gray-500"
/>
```

### Select Elements
```tsx
<select
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
             focus:border-green-500 focus:ring-green-500 
             sm:text-sm px-3 py-2 border text-gray-900"
>
```

### Textarea Elements
```tsx
<textarea
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
             focus:border-green-500 focus:ring-green-500 
             sm:text-sm px-3 py-2 border 
             text-gray-900 placeholder:text-gray-500"
/>
```

### Labels
```tsx
<label className="block text-sm font-medium text-gray-700">
  Field Name
</label>
```

## Focus States

All interactive elements MUST have visible focus indicators for keyboard navigation.

### Buttons
```tsx
// Primary button
<button className="bg-green-600 text-white px-4 py-2 rounded-lg 
                   hover:bg-green-700 transition
                   focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
  Submit
</button>

// Secondary button
<button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg 
                   hover:bg-gray-300 transition
                   focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
  Cancel
</button>

// Danger button
<button className="bg-red-600 text-white px-4 py-2 rounded-lg 
                   hover:bg-red-700 transition
                   focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
  Delete
</button>
```

### Links
```tsx
<a className="text-green-600 hover:text-green-700 
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
              rounded">
  Link Text
</a>
```

## Modal Dialogs

### Structure Requirements
1. Use `role="dialog"` and `aria-modal="true"`
2. Include `aria-labelledby` pointing to the modal title
3. Trap focus within the modal when open
4. Return focus to trigger element when closed
5. Close on Escape key press

### Modal Styling
```tsx
{/* Overlay */}
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
  {/* Modal container */}
  <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
    {/* Title */}
    <h3 className="text-lg font-medium text-gray-900 mb-4">Modal Title</h3>
    {/* Content with accessible form fields */}
  </div>
</div>
```

## Error Messages

### Inline Errors
```tsx
<div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
  Error message text
</div>
```

### Form Validation
- Associate error messages with inputs using `aria-describedby`
- Use `aria-invalid="true"` on invalid inputs

```tsx
<input
  aria-invalid={hasError}
  aria-describedby={hasError ? "name-error" : undefined}
  className={`... ${hasError ? 'border-red-500' : 'border-gray-300'}`}
/>
{hasError && (
  <p id="name-error" className="mt-1 text-sm text-red-600">
    Error description
  </p>
)}
```

## Loading States

```tsx
<div className="min-h-screen bg-gray-50 flex items-center justify-center">
  <div className="text-gray-700" role="status" aria-live="polite">
    Loading...
  </div>
</div>
```

## Quick Reference Checklist

### For Every Form Input
- [ ] `text-gray-900` for input text color
- [ ] `placeholder:text-gray-500` for placeholder text
- [ ] `text-gray-700` for labels
- [ ] Visible focus ring with `focus:ring-2`

### For Every Button
- [ ] Sufficient contrast (4.5:1 minimum)
- [ ] Visible focus ring: `focus:outline-none focus:ring-2 focus:ring-{color}-500 focus:ring-offset-2`
- [ ] Hover state for visual feedback

### For Every Modal
- [ ] All form fields follow input guidelines
- [ ] Modal title uses `text-gray-900`
- [ ] Descriptive text uses `text-gray-600` minimum (not `text-gray-500` or lighter)
- [ ] Buttons include focus states

## Testing

### Manual Testing
1. Use keyboard-only navigation (Tab, Shift+Tab, Enter, Escape)
2. Verify all interactive elements are reachable and have visible focus
3. Test with browser zoom at 200%

### Automated Tools
- [axe DevTools](https://www.deque.com/axe/) browser extension
- [WAVE](https://wave.webaim.org/) accessibility evaluator
- Lighthouse accessibility audit in Chrome DevTools

### Color Contrast Checkers
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
