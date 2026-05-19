import { useMemo, useState } from "react";
import { PageImage } from "@/utils/page-images";

export type UseSelectedImagesReturn = {
  selectedImages: Set<string>;
  isAllFilteredSelected: boolean;
  toggleAll: (images?: PageImage[]) => void;
  toggle: (src: string) => void;
  clearSelection: () => void;
  selectAll: (images?: PageImage[]) => void;
};

export function useSelectedImages(
  filteredImages: PageImage[],
): UseSelectedImagesReturn {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const isAllFilteredSelected = useMemo(
    () => areImagesSelected(selectedImages, filteredImages),
    [filteredImages, selectedImages],
  );

  const toggleAll = (images?: PageImage[]) => {
    if (!images) {
      images = filteredImages;
    }
    if (areImagesSelected(selectedImages, images)) {
      return setSelectedImages(deselectImages(selectedImages, images!));
    }
    setSelectedImages(selectImages(images!));
  };

  const toggle = (src: string) => {
    setSelectedImages((current) => {
      if (current.has(src)) {
        const nextSelected = new Set(current);
        nextSelected.delete(src);
        return nextSelected;
      } else {
        return new Set(current).add(src);
      }
    });
  };

  const clearSelection = () => {
    setSelectedImages(new Set());
  };

  const selectAll = (images?: PageImage[]) => {
    if (!images) {
      return setSelectedImages(selectImages(filteredImages));
    }
    setSelectedImages(selectImages(images));
  };

  return {
    selectedImages,
    isAllFilteredSelected,
    toggleAll,
    toggle,
    clearSelection,
    selectAll,
  };
}

export function selectImages(images: PageImage[]) {
  return new Set(images.map((image) => image.src));
}

export function deselectImages(selected: Set<string>, images: PageImage[]) {
  const nextSelected = new Set(selected);

  for (const image of images) {
    nextSelected.delete(image.src);
  }

  return nextSelected;
}

export function areImagesSelected(selected: Set<string>, images: PageImage[]) {
  return images.length > 0 && images.every((image) => selected.has(image.src));
}
