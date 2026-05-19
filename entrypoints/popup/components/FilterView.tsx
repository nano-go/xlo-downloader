import {
  DimensionRange,
  ImageFilters,
  ImageTypeFilter,
} from "../hooks/useImageFilters";
import { BottomSheet } from "./BottomSheet";

type FilterViewProps = {
  filters: ImageFilters;
  heightBounds: DimensionRange;
  isOpen: boolean;
  resultCount: number;
  selectedCount: number;
  totalCount: number;
  widthBounds: DimensionRange;
  onClose: () => void;
  onFilterChange: (filters: ImageFilters) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
};

const typeOptions: { label: string; value: ImageTypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "PNG / JPG", value: "png-jpg" },
  { label: "GIF / WebP", value: "gif-webp" },
];

export function FilterView({
  filters,
  heightBounds,
  isOpen,
  resultCount,
  selectedCount,
  totalCount,
  widthBounds,
  onClose,
  onFilterChange,
  onSelectAll,
  onClearSelection,
}: FilterViewProps) {
  return (
    <BottomSheet
      description={`${resultCount} of ${totalCount} images · ${selectedCount} selected`}
      isOpen={isOpen}
      title="Filters"
      onClose={onClose}
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-xs font-semibold tracking-wide uppercase text-slate-500">
            Image Type
          </h3>
          <div className="p-1 grid grid-cols-3 gap-1 rounded-xl bg-slate-100">
            {typeOptions.map((option) => (
              <button
                className={`min-h-11 rounded-lg px-2 text-sm font-medium transition ${
                  filters.type === option.value
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500"
                }`}
                key={option.value}
                type="button"
                onClick={() =>
                  onFilterChange({ ...filters, type: option.value })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <RangeSlider
          bounds={widthBounds}
          label="Width"
          value={filters.widthRange}
          onChange={(widthRange) => onFilterChange({ ...filters, widthRange })}
        />

        <RangeSlider
          bounds={heightBounds}
          label="Height"
          value={filters.heightRange}
          onChange={(heightRange) =>
            onFilterChange({ ...filters, heightRange })
          }
        />

        <div className="pt-1 grid grid-cols-2 gap-3">
          <button
            className="px-4 text-sm font-semibold text-white min-h-12 rounded-xl bg-slate-950 shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={resultCount === 0}
            type="button"
            onClick={onSelectAll}
          >
            Select All
          </button>
          <button
            className="px-4 text-sm font-semibold bg-white border min-h-12 rounded-xl border-slate-200 text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={selectedCount === 0}
            type="button"
            onClick={onClearSelection}
          >
            Clear
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

function RangeSlider({
  bounds,
  label,
  value,
  onChange,
}: {
  bounds: DimensionRange;
  label: string;
  value: DimensionRange;
  onChange: (value: DimensionRange) => void;
}) {
  const [minBound, maxBound] = bounds;
  const [minValue, maxValue] = value;
  const disabled = minBound === maxBound;
  const rangeSize = maxBound - minBound;
  const selectedStart =
    rangeSize > 0 ? ((minValue - minBound) / rangeSize) * 100 : 0;
  const selectedEnd =
    rangeSize > 0 ? ((maxValue - minBound) / rangeSize) * 100 : 100;

  return (
    <section>
      <div className="flex items-center justify-between mb-2 gap-3">
        <h3 className="text-xs font-semibold tracking-wide uppercase text-slate-500">
          {label}
        </h3>
        <p className="text-sm font-medium text-slate-700">
          {minValue}px ~ {maxValue}px
        </p>
      </div>

      <div className="relative h-12">
        <div className="absolute left-0 right-0 h-2 rounded-full top-1/2 -translate-y-1/2 bg-slate-100" />
        <div
          className="absolute h-2 rounded-full top-1/2 -translate-y-1/2 bg-slate-950"
          style={{
            left: `${selectedStart}%`,
            width: `${Math.max(selectedEnd - selectedStart, 0)}%`,
          }}
        />
        <input
          aria-label={`${label} minimum`}
          className="absolute inset-x-0 w-full range-input top-1/2 -translate-y-1/2 accent-slate-950"
          disabled={disabled}
          max={maxBound}
          min={minBound}
          type="range"
          value={minValue}
          onChange={(event) => {
            const nextMin = Math.min(Number(event.target.value), maxValue);
            onChange([nextMin, maxValue]);
          }}
        />
        <input
          aria-label={`${label} maximum`}
          className="absolute inset-x-0 w-full range-input top-1/2 -translate-y-1/2 accent-slate-950"
          disabled={disabled}
          max={maxBound}
          min={minBound}
          type="range"
          value={maxValue}
          onChange={(event) => {
            const nextMax = Math.max(Number(event.target.value), minValue);
            onChange([minValue, nextMax]);
          }}
        />
      </div>
    </section>
  );
}
