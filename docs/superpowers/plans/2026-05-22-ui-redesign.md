# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the XLO Downloader popup UI with a modern minimal style — frosted glass header, card-style image grid, smooth transitions, and refined filter bottom sheet.

**Architecture:** Visual-only redesign. No data flow, hooks, or logic changes. Touch 9 component files + 2 CSS files. Changes are purely Tailwind class swaps and minor CSS keyframe updates.

**Tech Stack:** React 19, Tailwind CSS 4, TypeScript, WXT

---

### Task 1: Update CSS — Animation keyframe and range-input styles

**Files:**
- Modify: `entrypoints/popup/App.css:1-49`

- [ ] **Step 1: Update keyframe and range-input styles in App.css**

Replace the entire contents of `App.css` with:

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
  animation: fadeSlideIn 0.4s ease-in-out both;
}

.range-input {
  appearance: none;
  background: transparent;
  pointer-events: none;
}

.range-input::-webkit-slider-runnable-track {
  background: transparent;
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  background: #020617;
  border: 2px solid #ffffff;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.24);
  height: 22px;
  pointer-events: auto;
  width: 22px;
}

.range-input::-moz-range-track {
  background: transparent;
}

.range-input::-moz-range-thumb {
  background: #020617;
  border: 2px solid #ffffff;
  border-radius: 9999px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 0.24);
  height: 22px;
  pointer-events: auto;
  width: 22px;
}
```

Changes from current: `0.6s ease-out` → `0.4s ease-in-out` on the animation. Range input styles unchanged.

- [ ] **Step 2: Commit**

```bash
git add entrypoints/popup/App.css
git commit -m "style: update animation timing to 0.4s ease-in-out"
```

---

### Task 2: Update PopupHeader — Frosted glass, pill badges, icon button styling

**Files:**
- Modify: `entrypoints/popup/components/PopupHeader.tsx`

- [ ] **Step 1: Replace PopupHeader implementation**

Replace the full content of `PopupHeader.tsx` with:

```tsx
import {
  LuFilter,
  LuLoaderCircle,
  LuRefreshCw,
  LuSquareCheckBig,
  LuSquareMinus,
} from "react-icons/lu";
import type { ReactNode } from "react";
import type { LoadState } from "../hooks/usePageImages";

type PopupHeaderProps = {
  canSelectFilteredImages: boolean;
  imageCount: number;
  isAllSelected: boolean;
  selectedCount: number;
  state: LoadState;
  onOpenControls: () => void;
  onRefresh: () => void;
  onToggleSelectFilteredImages: () => void;
};

export function PopupHeader({
  canSelectFilteredImages,
  imageCount,
  isAllSelected,
  selectedCount,
  state,
  onOpenControls,
  onRefresh,
  onToggleSelectFilteredImages,
}: PopupHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-2">
        <h1 className="text-[15px] font-semibold leading-5 text-slate-900 flex items-center gap-1.5">
          XLO Downloader
          {state.status === "success" &&
            (state.complete ? (
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            ) : (
              <LuLoaderCircle
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin text-slate-400"
              />
            ))}
        </h1>
        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          {imageCount}
        </span>
        {selectedCount > 0 && (
          <span className="rounded-lg bg-slate-950 px-2 py-0.5 text-xs text-white">
            {selectedCount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <HeaderIconButton
          aria-label="Open filters"
          title="Open filters"
          onClick={onOpenControls}
        >
          <LuFilter aria-hidden="true" className="w-[18px] h-[18px]" />
        </HeaderIconButton>
        <HeaderIconButton
          aria-label={
            isAllSelected
              ? "Deselect filtered images"
              : "Select all filtered images"
          }
          disabled={!canSelectFilteredImages}
          title={
            isAllSelected
              ? "Deselect filtered images"
              : "Select all filtered images"
          }
          onClick={onToggleSelectFilteredImages}
        >
          {isAllSelected ? (
            <LuSquareMinus aria-hidden="true" className="w-[18px] h-[18px]" />
          ) : (
            <LuSquareCheckBig
              aria-hidden="true"
              className="w-[18px] h-[18px]"
            />
          )}
        </HeaderIconButton>
        <HeaderIconButton
          aria-label="Refresh images"
          title="Refresh images"
          onClick={onRefresh}
        >
          <LuRefreshCw aria-hidden="true" className="w-[18px] h-[18px]" />
        </HeaderIconButton>
      </div>
    </header>
  );
}

function HeaderIconButton({
  children,
  disabled = false,
  title,
  onClick,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  "aria-label": string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="flex items-center justify-center bg-transparent h-9 w-9 rounded-lg text-slate-600 transition-colors duration-200 hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
      disabled={disabled}
      title={title}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

Key changes:
- Removed `border-b` and `bg-white` from header (frosted glass is applied at wrapper level in App.tsx)
- Title text: `text-[15px] font-semibold text-slate-900`
- Pill badges: image count as `bg-slate-100 rounded-lg px-2 py-0.5 text-xs text-slate-500`, selected count as `bg-slate-950 rounded-lg px-2 py-0.5 text-xs text-white` (conditionally shown)
- Removed subtitle `<p>` line — counts now shown as pill badges
- Status dot: `bg-emerald-500` instead of `bg-green-500`
- Icon buttons: `h-9 w-9 rounded-lg` with `transition-colors duration-200`, `text-slate-600`
- Icons: `w-[18px] h-[18px]` (slightly smaller)
- Removed `active:scale-95` from icon button (smoother feel without bounce)

- [ ] **Step 2: Commit**

```bash
git add entrypoints/popup/components/PopupHeader.tsx
git commit -m "style: redesign PopupHeader with pill badges and refined icon buttons"
```

---

### Task 3: Update App.tsx — Frosted glass header, refined action buttons, content padding

**Files:**
- Modify: `entrypoints/popup/App.tsx`

- [ ] **Step 1: Update the header section in App.tsx**

Change the fixed header `<div>` from:

```tsx
<div
  className="fixed inset-x-0 top-0 z-40 bg-white shadow-sm"
  ref={topBarRef}
>
```

to:

```tsx
<div
  className="fixed inset-x-0 top-0 z-40 backdrop-blur-xl bg-white/75 border-b border-black/[0.06]"
  ref={topBarRef}
>
```

Change the action buttons section from:

```tsx
<section className="px-4 py-3 bg-white border-b grid grid-cols-2 gap-2 border-slate-200">
```

to:

```tsx
<section className="px-4 pb-3 pt-1 grid grid-cols-2 gap-2">
```

(Removed `bg-white`, `border-b`, `border-slate-200`, reduced `py-3` to `pb-3 pt-1` — header is now frosted glass, no need for solid bg/border)

Change the content section padding from `p-3` to `p-2.5`:

```tsx
<section
  className="h-full p-2.5 overflow-y-auto"
  ref={imageListRef}
  style={{ paddingTop: topBarHeight + 12 }}
>
```

- [ ] **Step 2: Commit**

```bash
git add entrypoints/popup/App.tsx
git commit -m "style: frosted glass header and refined spacing"
```

---

### Task 4: Update HideOnScrollHeader — Smoother transition

**Files:**
- Modify: `entrypoints/popup/components/HideOnScrollHeader.tsx`

- [ ] **Step 1: Update transition timing**

Change the transition class from:

```tsx
className={`overflow-hidden transition-[max-height,transform] duration-200 ease-in-out ${
```

to:

```tsx
className={`overflow-hidden transition-[max-height,transform] duration-300 ease-in-out ${
```

(Changed `duration-200` to `duration-300` for smoother feel matching the spec's 0.3s)

- [ ] **Step 2: Commit**

```bash
git add entrypoints/popup/components/HideOnScrollHeader.tsx
git commit -m "style: smoother header hide/show transition 0.3s"
```

---

### Task 5: Update ImageGrid — Card restyling, selection badge, hover animation

**Files:**
- Modify: `entrypoints/popup/components/ImageGrid.tsx`

- [ ] **Step 1: Update ImageGrid and ImageCard components**

Change the grid `<div>` from:

```tsx
<div className="grid grid-cols-2 gap-3">
```

to:

```tsx
<div className="grid grid-cols-2 gap-2.5">
```

Change each column `<div>` from:

```tsx
<div className="flex flex-col gap-3" key={index}>
```

to:

```tsx
<div className="flex flex-col gap-2.5" key={index}>
```

Replace the `<article>` in `ImageCard` with:

```tsx
<article
  className={`overflow-hidden rounded-xl transition-all duration-300 ease-in-out cursor-pointer ${
    isNew ? "animate-new-image" : ""
  } ${
    isSelected
      ? "ring-2 ring-blue-500 shadow-md"
      : "bg-white shadow-sm hover:shadow-md hover:scale-[1.02]"
  }`}
  onAnimationEnd={onAnimationEnd}
>
```

Replace the selected overlay `<div>` inside the image (the `isSelected` conditional block) from:

```tsx
{isSelected && (
  <div className="absolute inset-0 flex items-start justify-end p-2 bg-slate-950/20">
    <span className="flex items-center justify-center text-sm font-semibold text-white rounded-full h-7 w-7 bg-slate-950 shadow-sm">
      <LuCheck aria-hidden="true" className="w-4 h-4 text-white" />
    </span>
  </div>
)}
```

to:

```tsx
{isSelected && (
  <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
    <LuCheck aria-hidden="true" className="w-3 h-3 text-white" />
  </div>
)}
```

(Blue badge top-right instead of full overlay, smaller badge `h-5 w-5` with white check)

Change the dimension text `<div>` from:

```tsx
<div className="px-2.5 py-2 text-xs font-medium text-slate-600">
  {image.width} x {image.height}
</div>
```

to:

```tsx
<div className="px-2 py-1.5 text-[11px] text-slate-500">
  {image.width} × {image.height}
</div>
```

(Smaller text, lighter color, `×` instead of ` x `)

- [ ] **Step 2: Commit**

```bash
git add entrypoints/popup/components/ImageGrid.tsx
git commit -m "style: redesign image cards with rounded-xl, blue selection badge, hover scale"
```

---

### Task 6: Update ActionButton — Refined styling for secondary variant

**Files:**
- Modify: `entrypoints/popup/components/ActionButton.tsx`

- [ ] **Step 1: Update ActionButton component**

Replace the full content of `ActionButton.tsx` with:

```tsx
import { type ReactNode } from "react";

type ActionButtonProps = {
  disabled: boolean;
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  className?: string;
};

export function ActionButton({
  disabled,
  icon,
  label,
  onClick,
  variant = "primary",
  className = "",
}: ActionButtonProps) {
  const baseClasses =
    "flex items-center justify-center px-3 text-sm font-medium min-h-11 gap-2 rounded-xl transition-colors duration-150 disabled:cursor-not-allowed";

  const variantClasses =
    variant === "primary"
      ? "bg-slate-950 text-white active:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
      : "bg-slate-100 text-slate-700 active:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-300";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
```

Key changes:
- Added `variant` prop (`"primary" | "secondary"`, default `"primary"`)
- `font-semibold` → `font-medium` (less heavy)
- Removed `active:scale-95` (smoother feel per spec)
- Added `transition-colors duration-150` (smooth color change on active instead of scale)
- Primary: `bg-slate-950` with `active:bg-slate-800`
- Secondary: `bg-slate-100 text-slate-700` with `active:bg-slate-200`

- [ ] **Step 2: Update App.tsx action buttons to use secondary variant**

In `App.tsx`, change the "Copy URLs" `ActionButton` to use `variant="secondary"`:

```tsx
<ActionButton
  disabled={selectedImages.size === 0 || isCopying}
  icon={<LuCopy aria-hidden="true" className="w-4 h-4" />}
  label={isCopying ? "Copying..." : "Copy URLs"}
  onClick={() => void runCopySelectedImageUrls()}
  variant="secondary"
/>
```

The Download ZIP button stays as default `variant="primary"` (no change needed).

- [ ] **Step 3: Commit**

```bash
git add entrypoints/popup/components/ActionButton.tsx entrypoints/popup/App.tsx
git commit -m "style: add secondary variant to ActionButton, update Copy URLs button"
```

---

### Task 7: Update BottomSheet — Backdrop blur, drag handle

**Files:**
- Modify: `entrypoints/popup/components/BottomSheet.tsx`

- [ ] **Step 1: Update BottomSheet styling**

Change the backdrop `<div>` className from:

```tsx
className="fixed inset-0 z-50 flex items-end overflow-hidden overscroll-none bg-slate-950/35"
```

to:

```tsx
className="fixed inset-0 z-50 flex items-end overflow-hidden overscroll-none bg-black/40 backdrop-blur-sm"
```

(Changed from `bg-slate-950/35` to `bg-black/40 backdrop-blur-sm`)

Change the sheet `<section>` className from:

```tsx
className="relative max-h-[calc(100vh-24px)] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-slate-200 bg-white px-4 pb-4 pt-3 shadow-2xl"
```

to:

```tsx
className="relative max-h-[calc(100vh-24px)] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-slate-200/80 bg-white px-4 pb-4 pt-3 shadow-2xl"
```

(Changed `border-slate-200` to `border-slate-200/80` for subtler border)

Change the drag handle `<div>` from:

```tsx
<div className="w-10 h-1 mx-auto mb-3 rounded-full bg-slate-300" />
```

to:

```tsx
<div className="w-10 h-1 mx-auto mb-2 rounded-full bg-slate-300" />
```

(Changed `mb-3` to `mb-2` for tighter spacing under handle)

- [ ] **Step 2: Commit**

```bash
git add entrypoints/popup/components/BottomSheet.tsx
git commit -m "style: update BottomSheet with backdrop blur and subtle border"
```

---

### Task 8: Update FilterView — Refined type toggle and action buttons

**Files:**
- Modify: `entrypoints/popup/components/FilterView.tsx`

- [ ] **Step 1: Update FilterView component**

Change the type toggle button className from:

```tsx
className={`min-h-11 rounded-lg px-2 text-sm font-medium transition ${
  filters.type === option.value
    ? "bg-white text-slate-950 shadow-sm"
    : "text-slate-500"
}`}
```

to:

```tsx
className={`min-h-10 rounded-lg px-2 text-sm font-medium transition-colors duration-150 ${
  filters.type === option.value
    ? "bg-white text-slate-950 shadow-sm"
    : "text-slate-500 hover:text-slate-700"
}`}
```

(`min-h-11` → `min-h-10`, `transition` → `transition-colors duration-150`, added `hover:text-slate-700` for inactive)

Change the action row `<div>` from:

```tsx
<div className="pt-1 grid grid-cols-2 gap-3">
```

to:

```tsx
<div className="pt-2 grid grid-cols-2 gap-3">
```

Change the "Select All" ActionButton to add `variant="primary"`:

```tsx
<ActionButton
  disabled={resultCount === 0}
  label="Select All"
  onClick={onSelectAll}
  variant="primary"
/>
```

Change the "Clear" ActionButton to use `variant="secondary"`:

```tsx
<ActionButton
  disabled={selectedCount === 0}
  label="Clear"
  onClick={onClearSelection}
  variant="secondary"
/>
```

- [ ] **Step 2: Commit**

```bash
git add entrypoints/popup/components/FilterView.tsx
git commit -m "style: refine FilterView type toggle and action buttons"
```

---

### Task 9: Update StatusMessage — Softer styling

**Files:**
- Modify: `entrypoints/popup/components/StatusMessage.tsx`

- [ ] **Step 1: Update StatusMessage styling**

Change the `<div>` className from:

```tsx
className="flex flex-col items-center justify-center px-6 text-center bg-white border border-dashed rounded-lg min-h-55 border-slate-300"
```

to:

```tsx
className="flex flex-col items-center justify-center px-6 text-center bg-white/80 border border-dashed rounded-xl min-h-55 border-slate-200"
```

(Changed `bg-white` → `bg-white/80`, `rounded-lg` → `rounded-xl`, `border-slate-300` → `border-slate-200`)

- [ ] **Step 2: Commit**

```bash
git add entrypoints/popup/components/StatusMessage.tsx
git commit -m "style: softer StatusMessage with rounded-xl and subtle border"
```

---

### Task 10: Verify and final commit

- [ ] **Step 1: Run type check**

```bash
node ./node_modules/typescript/bin/tsc --noEmit
```

Expected: No errors

- [ ] **Step 2: Run tests**

```bash
bun test
```

Expected: All 26 tests pass

- [ ] **Step 3: Visual verification**

Run `bun run build` and load the extension to verify:
- Frosted glass header with pill badges
- Blue ring + checkmark badge on selected images
- Smooth hover scale on image cards
- Refined bottom sheet with backdrop blur
- Smooth entrance animation (0.4s ease-in-out)
- Action buttons with secondary variant styling

- [ ] **Step 4: Final commit if any fixes needed**

Only if there are fixes from verification.