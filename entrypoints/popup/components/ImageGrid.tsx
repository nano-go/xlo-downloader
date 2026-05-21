import { LuCheck } from "react-icons/lu";
import { useCallback, useMemo, useRef, useState } from "react";
import type { PageImage } from "@/utils/page-images";

type ImageGridProps = {
  images: PageImage[];
  selectedImages: Set<string>;
  onImageClick?: (image: PageImage) => void;
};

export function ImageGrid({
  images,
  selectedImages,
  onImageClick,
}: ImageGridProps) {
  const renderedSrcs = useRef<Set<string>>(new Set());
  const newSrcs = useMemo(() => {
    const currentSrcs = new Set(images.map((i) => i.src));
    const newSet = new Set<string>();
    if (renderedSrcs.current.size > 0) {
      for (const src of currentSrcs) {
        if (!renderedSrcs.current.has(src)) newSet.add(src);
      }
    }
    renderedSrcs.current = currentSrcs;
    return newSet;
  }, [images]);

  const [animatingSrcs, setAnimatingSrcs] = useState<Set<string>>(new Set());

  useMemo(() => {
    if (newSrcs.size > 0) {
      setAnimatingSrcs((prev) => {
        const next = new Set(prev);
        for (const src of newSrcs) next.add(src);
        return next;
      });
    }
  }, [newSrcs]);

  const handleAnimationEnd = useCallback((src: string) => {
    setAnimatingSrcs((prev) => {
      if (!prev.has(src)) return prev;
      const next = new Set(prev);
      next.delete(src);
      return next;
    });
  }, []);

  const columns = useMemo(() => createMasonryColumns(images, 2), [images]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {columns.map((column, index) => (
        <div className="flex flex-col gap-3" key={index}>
          {column.map((image) => {
            const isNew = newSrcs.has(image.src) || animatingSrcs.has(image.src);
            return (
              <ImageCard
                key={image.src}
                image={image}
                isNew={isNew}
                isSelected={selectedImages.has(image.src)}
                onImageClick={onImageClick}
                onAnimationEnd={isNew ? () => handleAnimationEnd(image.src) : undefined}
              />
            );
          })}
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
  isNew,
  isSelected,
  onImageClick,
  onAnimationEnd,
}: {
  image: PageImage;
  isNew: boolean;
  isSelected: boolean;
  onImageClick?: (image: PageImage) => void;
  onAnimationEnd?: (() => void) | undefined;
}) {
  const aspectRatio = getAspectRatio(image);

  return (
    <article
      className={`overflow-hidden rounded-lg border bg-white shadow-sm transition ${isNew ? "animate-new-image" : ""} ${
        isSelected
          ? "border-slate-950 ring-2 ring-slate-950/20"
          : "border-slate-200"
      }`}
      onAnimationEnd={onAnimationEnd}
    >
      <button
        aria-pressed={isSelected}
        className="block w-full text-left"
        type="button"
        onClick={onImageClick ? () => onImageClick(image) : undefined}
      >
        <div className="bg-slate-100" style={{ aspectRatio }}>
          <div className="relative w-full h-full">
            <img
              alt=""
              aria-label={image.name}
              className="object-contain w-full h-full"
              loading="lazy"
              referrerPolicy="origin"
              src={image.src}
            />
            {isSelected && (
              <div className="absolute inset-0 flex items-start justify-end p-2 bg-slate-950/20">
                <span className="flex items-center justify-center text-sm font-semibold text-white rounded-full h-7 w-7 bg-slate-950 shadow-sm">
                  <LuCheck aria-hidden="true" className="w-4 h-4 text-white" />
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
