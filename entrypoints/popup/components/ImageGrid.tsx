import { LuCheck } from "react-icons/lu";
import { useCallback, useMemo, useRef, useState } from "react";
import type { PageImage } from "@/utils/page-image-types";

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
    <div className="grid grid-cols-2 gap-2.5">
      {columns.map((column, index) => (
        <div className="flex flex-col gap-2.5" key={index}>
          {column.map((image) => {
            const isNew =
              newSrcs.has(image.src) || animatingSrcs.has(image.src);
            return (
              <ImageCard
                key={image.src}
                image={image}
                isNew={isNew}
                isSelected={selectedImages.has(image.src)}
                onImageClick={onImageClick}
                onAnimationEnd={
                  isNew ? () => handleAnimationEnd(image.src) : undefined
                }
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
      className={`overflow-hidden rounded-xl transition-all duration-300 ease-in-out cursor-pointer ${
        isNew ? "animate-new-image" : ""
      } ${
        isSelected
          ? "ring-2 ring-blue-500 shadow-md"
          : "bg-white shadow-sm hover:shadow-md hover:scale-[1.02]"
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
              <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                <LuCheck aria-hidden="true" className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
        <div className="px-2 py-1.5 text-[11px] text-slate-500">
          {image.width} × {image.height}
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
