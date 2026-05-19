import { PageImage } from "@/utils/page-images";
import { useEffect, useMemo, useState } from "react";

export type ImageTypeFilter = "all" | "png-jpg" | "gif-webp";
export type Dimension = "width" | "height";
export type DimensionRange = [number, number];

export type ImageFilters = {
  type: ImageTypeFilter;
  widthRange: DimensionRange;
  heightRange: DimensionRange;
};

export type UseImageFiltersReturn = {
  filters: ImageFilters;
  setFilters: React.Dispatch<React.SetStateAction<ImageFilters>>;
  widthBounds: DimensionRange;
  heightBounds: DimensionRange;
  filteredImages: PageImage[];
};

export function useImageFilters(images: PageImage[]) {
  const [filters, setFilters] = useState<ImageFilters>({
    type: "all",
    widthRange: [0, 0],
    heightRange: [0, 0],
  });

  const { widthBounds, heightBounds } = useMemo(
    () => createRangesBounds(images),
    [images],
  );

  const filteredImages = useMemo(
    () => filterImages(images, filters),
    [filters, images],
  );

  useEffect(() => {
    setFilters((current) => ({
      type: current.type,
      widthRange: reconcileRange(current.widthRange, widthBounds),
      heightRange: reconcileRange(current.heightRange, heightBounds),
    }));
  }, [heightBounds, widthBounds]);

  return {
    filters,
    setFilters,
    widthBounds,
    heightBounds,
    filteredImages,
  };
}

function filterImages(images: PageImage[], filters: ImageFilters) {
  return images.filter((image) => {
    return (
      matchesTypeFilter(image.type, filters.type) &&
      image.width >= filters.widthRange[0] &&
      image.width <= filters.widthRange[1] &&
      image.height >= filters.heightRange[0] &&
      image.height <= filters.heightRange[1]
    );
  });
}

function matchesTypeFilter(type: ImageType, filter: ImageTypeFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "png-jpg") {
    return type === "png" || type === "jpg" || type === "jpeg";
  }

  return type === "gif" || type === "webp";
}

function createRangesBounds(images: PageImage[]): {
  widthBounds: DimensionRange;
  heightBounds: DimensionRange;
} {
  if (images.length === 0) {
    return {
      widthBounds: [0, 0],
      heightBounds: [0, 0],
    };
  }

  let minWidth = images[0].width;
  let maxWidth = images[0].width;
  let minHeight = images[0].height;
  let maxHeight = images[0].height;

  for (const image of images) {
    minWidth = Math.min(minWidth, image.width);
    maxWidth = Math.max(maxWidth, image.width);
    minHeight = Math.min(minHeight, image.height);
    maxHeight = Math.max(maxHeight, image.height);
  }

  return {
    widthBounds: [minWidth, maxWidth],
    heightBounds: [minHeight, maxHeight],
  };
}

function reconcileRange(
  range: DimensionRange,
  bounds: DimensionRange,
): DimensionRange {
  const [minBound, maxBound] = bounds;

  if (minBound === 0 && maxBound === 0) {
    return range;
  }

  if (range[0] === 0 && range[1] === 0) {
    return bounds;
  }

  return [
    Math.min(Math.max(range[0], minBound), maxBound),
    Math.max(Math.min(range[1], maxBound), minBound),
  ];
}
