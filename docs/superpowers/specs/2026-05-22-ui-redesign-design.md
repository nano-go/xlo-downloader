# XLO Downloader UI Redesign — Mobile-First Modern Minimal

**Date**: 2026-05-22  
**Scope**: Visual redesign of the browser extension popup UI  
**Constraint**: Browser popup only (no standalone tab page)

## Design Decisions

| Aspect | Decision |
|--------|----------|
| Usage context | Browser popup (fixed narrow width) |
| Grid layout | 2-column masonry (keep current — Pinterest style) |
| Header style | Frosted glass floating header |
| Motion style | Smooth transitions (ease-in-out) |
| Filter panel | Bottom Sheet (keep current — improve visuals) |
| Card style | Rounded card with shadow + blue ring on selection |

## 1. Color & Spacing

- **Page background**: `#f8fafc` (slate-50)
- **Card surface**: white (`#ffffff`)
- **Grid gap**: `gap-2.5` (10px) — tighter than current `gap-3` (12px)
- **Card border radius**: `rounded-xl` (12px)
- **Button border radius**: `rounded-xl` (12px)
- **Icon button radius**: `rounded-lg` (8px), size `h-9 w-9`

## 2. Frosted Glass Header

- **Background**: `rgba(255, 255, 255, 0.75)` + `backdrop-blur(12px)` + `-webkit-backdrop-filter: blur(12px)`
- **Bottom border**: `1px solid rgba(0, 0, 0, 0.06)`
- **Title row**: Left-aligned "XLO Downloader" (`font-semibold text-[15px] text-slate-900`)
- **Right side of title row**: Two pill badges
  - Image count: `bg-slate-100 rounded-lg px-2 py-0.5 text-slate-500 text-xs`
  - Selected count: `bg-slate-950 text-white rounded-lg px-2 py-0.5 text-xs` (hidden when 0 selected)
- **Icon buttons** (filter, select-all, refresh): between title and pills, `h-9 w-9 rounded-lg`, hover `bg-slate-100`, `transition-colors duration-200`
- **Action buttons row**: `grid grid-cols-2 gap-2`
  - Download ZIP: `bg-slate-950 text-white rounded-xl h-11 font-medium`
  - Copy URLs: `bg-slate-100 text-slate-700 rounded-xl h-11 font-medium`
  - Active state: `active:bg-slate-800` / `active:bg-slate-200`

## 3. Image Cards

- **Default**: `rounded-xl shadow-sm overflow-hidden bg-white`
- **Selected state**: `ring-2 ring-blue-500 shadow-md` + blue checkmark badge (top-right corner)
  - Checkmark badge: `absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center` with white checkmark icon
- **Hover**: `shadow-md scale-[1.02]`, `transition-all duration-300 ease-in-out`
- **Dimension overlay**: bottom overlay `text-xs text-white/80 bg-black/30 rounded-b-xl` stays as-is
- **Entrance animation for new images**: 
  - Keyframe: fade in (opacity 0→1) + slide up (translateY 12px→0) + shadow fade
  - Duration: 0.4s ease-in-out
  - Class: `animate-new-image`

## 4. Bottom Sheet Filter Panel

- **Backdrop**: `bg-black/40 backdrop-blur-sm`
- **Sheet**: `rounded-t-2xl bg-white shadow-2xl`
- **Drag handle**: centered grey bar `w-10 h-1 rounded-full bg-slate-300 mt-3 mb-2`
- **Title row**: "Filter" + close button "Done" (`text-slate-500 font-medium`)
- **Type toggle**: `grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1`
  - Active tab: `bg-white shadow-sm rounded-lg text-slate-900 font-medium`
  - Inactive tab: `text-slate-500`
- **Range sliders**: keep current implementation, update thumb/track styling:
  - Thumb: `h-[22px] w-[22px] rounded-full bg-slate-950 border-2 border-white shadow-md`
  - Track fill: `bg-slate-950`
- **Action row**: `grid grid-cols-2 gap-3`
  - Select All: `bg-slate-950 text-white rounded-xl h-11`
  - Clear: `bg-slate-100 text-slate-700 rounded-xl h-11`

## 5. Motion Spec

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Card hover | shadow + scale | 0.3s | ease-in-out |
| Card selection | ring + badge appear | 0.25s | ease-in-out |
| New card entrance | opacity + translateY + shadow | 0.4s | ease-in-out |
| Header show/hide | max-height + translateY | 0.3s | ease-in-out |
| Bottom Sheet | slideUp + backdrop opacity | 0.3s | ease-in-out |
| Icon button hover | background-color | 0.2s | ease-in-out |
| Action button active | background-color darken | 0.15s | ease-in-out |

## 6. CSS Changes

### New keyframe in `App.css`

```css
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-new-image {
  animation: fadeSlideIn 0.4s ease-in-out forwards;
}
```

### Header blur classes (Tailwind)

The header wrapper needs custom Tailwind classes for backdrop-filter. Since Tailwind 4 supports `backdrop-blur-*` natively, use:

```
fixed inset-x-0 top-0 z-40 backdrop-blur-xl bg-white/75 border-b border-black/[0.06]
```

## 7. Files to Modify

| File | Changes |
|------|---------|
| `entrypoints/popup/App.tsx` | Header styling: replace shadow-sm with frosted glass, update pill badges layout |
| `entrypoints/popup/App.css` | Update `fadeSlideIn` keyframe (0.4s, translate 12px), remove old `.range-input` overrides if needed |
| `entrypoints/popup/components/PopupHeader.tsx` | Frosted glass header, pill badges, icon button styling |
| `entrypoints/popup/components/HideOnScrollHeader.tsx` | Update transition to ease-in-out 0.3s |
| `entrypoints/popup/components/ImageGrid.tsx` | Card styling: rounded-xl, shadow-sm, ring-2 ring-blue-500 on select, checkmark badge, hover scale, entrance animation class |
| `entrypoints/popup/components/FilterView.tsx` | Bottom Sheet styling: rounded-t-2xl, drag handle, type toggle pill style |
| `entrypoints/popup/components/BottomSheet.tsx` | Backdrop blur, rounded-t-2xl, shadow-2xl, drag handle |
| `entrypoints/popup/components/ActionButton.tsx` | Rounded-xl, active state colors |
| `entrypoints/popup/style.css` | Remove hardcoded `min-width: 380px` constraints (keep reasonable min-width) |

## 8. What Stays the Same

- 2-column masonry layout algorithm (`createMasonryColumns`)
- Data flow: hooks (`usePageImages`, `useImageFilters`, `useSelectedImages`, `useAsyncLock`)
- Toast system (imperative pub-sub)
- Bottom Sheet interaction pattern (drag, close, lock body scroll)
- All functionality: download ZIP, copy URLs, select/deselect, filter by type/dimensions
- `min-width` on body (but review exact value)