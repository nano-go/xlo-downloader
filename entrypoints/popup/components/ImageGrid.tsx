import type { PageImage } from "../../../utils/page-images";

type ImageGridProps = {
  images: PageImage[];
  selectedImages: Set<string>;
  onImageToggle: (image: PageImage) => void;
};

export function ImageGrid({
  images,
  selectedImages,
  onImageToggle,
}: ImageGridProps) {
  const columns = createMasonryColumns(images, 2);

  return (
    <div className="grid grid-cols-2 gap-3">
      {columns.map((column, index) => (
        <div className="flex flex-col gap-3" key={index}>
          {column.map((image) => (
            <ImageCard
              image={image}
              isSelected={selectedImages.has(image.src)}
              key={image.src}
              onToggle={onImageToggle}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function createMasonryColumns(images: PageImage[], columnCount: number) {
  const safeColumnCount = Math.max(1, Math.floor(columnCount));
  const columns = Array.from(
    { length: safeColumnCount },
    () => [] as PageImage[],
  );
  const columnHeights = Array.from({ length: safeColumnCount }, () => 0);

  for (const image of images) {
    const shortestColumnIndex = columnHeights.indexOf(
      Math.min(...columnHeights),
    );

    columns[shortestColumnIndex].push(image);
    columnHeights[shortestColumnIndex] += getRelativeRenderedHeight(image);
  }

  return columns;
}

function ImageCard({
  image,
  isSelected,
  onToggle,
}: {
  image: PageImage;
  isSelected: boolean;
  onToggle: (image: PageImage) => void;
}) {
  const aspectRatio = getAspectRatio(image);

  return (
    <article
      className={`overflow-hidden rounded-lg border bg-white shadow-sm transition ${
        isSelected
          ? "border-slate-950 ring-2 ring-slate-950/20"
          : "border-slate-200"
      }`}
    >
      <button
        aria-pressed={isSelected}
        className="block w-full text-left"
        type="button"
        onClick={() => onToggle(image)}
      >
        <div className="bg-slate-100" style={{ aspectRatio }}>
          <div className="relative w-full h-full">
            <img
              alt=""
              className="object-contain w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer"
              src={image.src}
            />
            {isSelected && (
              <div className="absolute inset-0 flex items-start justify-end p-2 bg-slate-950/20">
                <span className="flex items-center justify-center text-sm font-semibold text-white rounded-full h-7 w-7 bg-slate-950 shadow-sm">
                  ✓
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="px-2.5 py-2 text-xs font-medium text-slate-600">
          {image.width} x {image.height}
        </div>
      </button>
    </article>
  );
}

function getAspectRatio(image: PageImage) {
  if (image.width > 0 && image.height > 0) {
    return `${image.width} / ${image.height}`;
  }

  return "4 / 3";
}

function getRelativeRenderedHeight(image: PageImage) {
  if (image.width > 0 && image.height > 0) {
    return image.height / image.width;
  }

  return 3 / 4;
}
