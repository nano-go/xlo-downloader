import {
  DimensionRange,
  ImageFilters,
  ImageTypeFilter,
} from "../hooks/useImageFilters";
import { ActionButton } from "./ActionButton";
import { BottomSheet } from "./BottomSheet";
import { RangeSlider } from "./RangeSlider";

export interface FilterViewProps {
  isOpen: boolean;
  filters: ImageFilters;
  heightBounds: DimensionRange;
  widthBounds: DimensionRange;
  resultCount: number;
  selectedCount: number;
  totalCount: number;
  onClose: () => void;
  onFilterChange: (filters: ImageFilters) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

const typeOptions: { label: string; value: ImageTypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "PNG / JPG", value: "png-jpg" },
  { label: "GIF / WebP", value: "gif-webp" },
];

export function FilterView({
  isOpen,
  filters,
  heightBounds,
  widthBounds,
  resultCount,
  selectedCount,
  totalCount,
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
          <ActionButton
            disabled={resultCount === 0}
            label="Select All"
            onClick={onSelectAll}
          />
          <ActionButton
            disabled={selectedCount === 0}
            label="Clear"
            onClick={onClearSelection}
          />
        </div>
      </div>
    </BottomSheet>
  );
}
