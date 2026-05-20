import { useMemo, useState } from "react";
import { PageImage } from "@/utils/page-images";

export type UseSelectedImagesReturn = {
  selectedImages: Set<string>;
  isAllSelected: boolean;
  toggleAll: () => void;
  toggle: (src: string) => void;
  clearAll: () => void;
  selectAll: () => void;
};

export function useSelectedImages(
  filteredImages: PageImage[],
): UseSelectedImagesReturn {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  function selectImages(images: PageImage[]) {
    setSelectedImages(
      new Set([...selectedImages, ...images.map((image) => image.src)]),
    );
  }

  const isAllSelected = useMemo(
    () =>
      filteredImages.length > 0 &&
      filteredImages.length <= selectedImages.size &&
      filteredImages.every((image) => selectedImages.has(image.src)),
    [filteredImages, selectedImages],
  );

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedImages(new Set());
    } else {
      selectImages(filteredImages);
    }
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

  const clearSelection = () => setSelectedImages(new Set());
  const selectAll = () => selectImages(filteredImages);

  return {
    selectedImages,
    isAllSelected,
    toggleAll,
    toggle,
    clearAll: clearSelection,
    selectAll,
  };
}
