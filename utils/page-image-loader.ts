import { resolvePageImageInfo as resolveImageElement } from "@/utils/page-image-resolver";
import { type PageImage } from "@/utils/page-image-types";

const COLLECT_BATCH_SIZE = 70;
const LOAD_MAX_CONCURRENT = 30;

export class PageImagesLoader {
  private loadedPageImages: Map<string, PageImage> = new Map();
  private uncompleteImages: Map<string, HTMLImageElement> = new Map();
  private _isLoadingUncompleteImages = false;

  public get isLoadingUncompleteImages() {
    return this._isLoadingUncompleteImages;
  }

  public get isComplete() {
    return this.uncompleteImages.size === 0 && !this._isLoadingUncompleteImages;
  }

  /**
   * Collects images from the given HTMLImageElement array. If an image is already
   * loaded and has valid size, it will be added to the result immediately. If an
   * image is not complete, it will be added to the uncompleteImages map for later
   * processing.
   *
   * @see loadUncompleteImages for loading images that are not complete at the time of collection.
   *
   * @param imgElements An array of HTMLImageElement to collect images from.
   * @returns A promise that resolves to an array of PageImage objects.
   */
public async collectPageImages(imgElements: HTMLImageElement[]) {
    const images: PageImage[] = [];
    const seenSrcs = new Set<string>();
    const toResolve: { img: HTMLImageElement; src: string }[] = [];

    for (const img of imgElements) {
      const src = imageSrc(img);
      if (!src || seenSrcs.has(src)) continue;
      seenSrcs.add(src);

      const loadedImage = this.loadedPageImages.get(src);
      if (loadedImage) {
        images.push(loadedImage);
        continue;
      }

      if (this.uncompleteImages.has(src)) continue;

      if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
        this.uncompleteImages.set(src, img);
        continue;
      }

      if (toResolve.length < COLLECT_BATCH_SIZE) {
        toResolve.push({ img, src });
      } else {
        this.uncompleteImages.set(src, img);
      }
    }

    const imagePromises = toResolve.map(async ({ img, src }) => {
      const pageImage = await resolveImageElement(img, src);
      if (this.pushLoadedPageImage(pageImage)) {
        images.push(pageImage);
      }
    });

    await Promise.allSettled(imagePromises);
    return images;
  }

  /**
   * Loads images that were not complete at the time of collection. This function
   * will attempt to load all uncomplete images, If an image is successfully loaded
   * and valid, the provided onLoaded callback will be called with the loaded PageImage.
   *
   * @param onLoaded A callback function that will be called with each successfully loaded PageImage.
   */
  public async loadUncompleteImages(onLoaded: (image: PageImage) => void) {
    if (this._isLoadingUncompleteImages || this.uncompleteImages.size === 0) {
      return;
    }
    this._isLoadingUncompleteImages = true;

    const entries = [...this.uncompleteImages.entries()];
    let index = 0;

    const workers = Array.from(
      { length: Math.min(LOAD_MAX_CONCURRENT, entries.length) },
      () =>
        (async () => {
          while (index < entries.length) {
            const [src, img] = entries[index++];
            try {
              const pageImage = await resolveImageElement(img, src);
              const push = this.pushLoadedPageImage(pageImage);
              this.uncompleteImages.delete(src);
              if (push) {
                onLoaded(pageImage);
              }
            } catch {
              this.uncompleteImages.delete(src);
            }
          }
        })(),
    );

    await Promise.allSettled(workers);

    this._isLoadingUncompleteImages = false;
    if (this.uncompleteImages.size > 0) {
      await this.loadUncompleteImages(onLoaded);
    }
  }

  public pushLoadedPageImage(image: PageImage) {
    if (this.loadedPageImages.has(image.src) || !hasValidImageSize(image)) {
      return false;
    }

    this.loadedPageImages.set(image.src, image);
    return true;
  }
}

function imageSrc(img: HTMLImageElement): string {
  return (
    img.currentSrc ||
    img.src ||
    img.dataset.src ||
    img.dataset.lazySrc ||
    img.dataset.original ||
    img.dataset.imgSrc ||
    img.getAttribute("data-lazy") ||
    img.getAttribute("data-url") ||
    ""
  );
}

function hasValidImageSize(image: PageImage): boolean {
  return image.width > 0 && image.height > 0;
}
