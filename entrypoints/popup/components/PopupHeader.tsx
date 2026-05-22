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