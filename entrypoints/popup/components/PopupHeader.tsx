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
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b gap-3 border-slate-200">
      <div>
        <h1 className="text-base font-semibold leading-5 flex items-center gap-1.5">
          XLO Downloader
          {state.status === "success" &&
            (state.complete ? (
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            ) : (
              <LuLoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin text-slate-400" />
            ))}
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          {state.status === "loading"
            ? "Loading..."
            : `${imageCount} images · ${selectedCount} selected`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <HeaderIconButton
          aria-label="Open filters"
          title="Open filters"
          onClick={onOpenControls}
        >
          <LuFilter aria-hidden="true" className="w-5 h-5" />
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
            <LuSquareMinus aria-hidden="true" className="w-5 h-5" />
          ) : (
            <LuSquareCheckBig aria-hidden="true" className="w-5 h-5" />
          )}
        </HeaderIconButton>
        <HeaderIconButton
          aria-label="Refresh images"
          title="Refresh images"
          onClick={onRefresh}
        >
          <LuRefreshCw aria-hidden="true" className="w-5 h-5" />
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
      className="flex items-center justify-center bg-transparent h-11 w-11 rounded-xl text-slate-700 transition hover:bg-slate-100 active:scale-95 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent disabled:active:scale-100"
      disabled={disabled}
      title={title}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
