import { DimensionRange } from "../hooks/useImageFilters";

type RangeSliderProps = {
  bounds: DimensionRange;
  label: string;
  value: DimensionRange;
  onChange: (value: DimensionRange) => void;
};

export function RangeSlider({
  bounds,
  label,
  value,
  onChange,
}: RangeSliderProps) {
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
