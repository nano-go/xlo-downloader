import { resolveImageSize, hasValidImageSize } from "@/utils/page-image-size";

export type ImageType = "png" | "jpg" | "jpeg" | "gif" | "webp" | "svg";
const VALID_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

export type PageImage = {
  src: string;
  name: string;
  type: ImageType;
  width: number;
  height: number;
};

export class PageImagesManager {
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

    const imagePromises = imgElements.map(async (img) => {
      const src = imageSrc(img);
      if (!src || seenSrcs.has(src)) {
        return;
      }
      seenSrcs.add(src);

      const loadedImage = this.loadedPageImages.get(src);
      if (loadedImage) {
        images.push(loadedImage);
        return;
      }

      if (this.uncompleteImages.has(src)) {
        // The images that are in the uncompleteImages map will be handled in the
        // loadUncompleteImages function, so we can skip them here.
        return;
      }

      if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
        this.uncompleteImages.set(src, img);
        return;
      }

      const pageImage = await convertToPageImage(img, src);
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
    const uncompleteImages = this.uncompleteImages;

    await Promise.allSettled(
      [...uncompleteImages.entries()].map(async ([src, img]) => {
        try {
          const pageImage = await loadUncompleteImage(img, src);
          const push = this.pushLoadedPageImage(pageImage);
          uncompleteImages.delete(src);
          if (push) {
            onLoaded(pageImage);
          }
        } catch (error) {
          uncompleteImages.delete(src);
          return;
        }
      }),
    );

    this._isLoadingUncompleteImages = false;
    if (uncompleteImages.size > 0) {
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

async function convertToPageImage(
  img: HTMLImageElement,
  src: string,
): Promise<PageImage> {
  return {
    src,
    name: getNameWithoutExtFromUrl(src) ?? "image",
    type: await getImageType(src),
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

async function loadUncompleteImage(img: HTMLImageElement, src: string) {
  const size = await resolveImageSize(img, src);
  const type = await getImageType(src);
  return {
    src,
    name: getNameWithoutExtFromUrl(src) ?? "image",
    type,
    width: size.width,
    height: size.height,
  };
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

function getNameWithoutExtFromUrl(url: string): string | undefined {
  const path = url.split("?")[0].split("#")[0];
  const filename = path.split("/").pop();

  if (!filename) {
    return undefined;
  }

  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    return filename;
  }

  return filename.slice(0, lastDotIndex);
}

async function getImageType(src: string): Promise<ImageType> {
  let type = getImageTypeFromUrl(src);
  if (!type) {
    type = await getImageTypeFromHeader(src);
  }
  return type || "jpg";
}

function getImageTypeFromUrl(url: string): ImageType | undefined {
  let type = undefined;
  if (url.startsWith("data:image/")) {
    type = url.split(";")[0].split("/")[1]; // data:image/png → png
  } else {
    type = url.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase();
  }

  if (type && VALID_EXTS.includes(type)) {
    return type as ImageType;
  }

  return undefined;
}

async function getImageTypeFromHeader(
  url: string,
): Promise<ImageType | undefined> {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "force-cache" });
    const contentType = response.headers.get("content-type");
    if (contentType) {
      return getImageTypeFromContentType(contentType);
    }
  } catch (error) {
    return undefined;
  }
}

const CONTENT_TYPE_TO_EXT: Record<string, ImageType> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function getImageTypeFromContentType(
  contentType: string,
): ImageType | undefined {
  return CONTENT_TYPE_TO_EXT[contentType.toLowerCase()];
}
