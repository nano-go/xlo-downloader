import type { PageImage } from "./page-images";

const WAIT_FOR_ELEMENT_TIMEOUT_MS = 1000;
const PROBE_IMAGE_TIMEOUT_MS = 10000;

export type ResolvedImageSize = {
  complete: boolean;
  width: number;
  height: number;
};

export async function resolveImageSize(
  img: HTMLImageElement,
  src: string,
): Promise<ResolvedImageSize> {
  if (hasElementSize(img)) {
    return sizeFromElement(img);
  }

  if (img.loading !== "lazy") {
    if (!img.complete) {
      await waitForElementImage(img, WAIT_FOR_ELEMENT_TIMEOUT_MS);
    }

    if (hasElementSize(img)) {
      return sizeFromElement(img);
    }
  }

  return probeImageSize(src, PROBE_IMAGE_TIMEOUT_MS);
}

export function hasValidImageSize(image: PageImage): boolean {
  return image.width > 0 && image.height > 0;
}

export function isPageImageTooSmall(image: PageImage): boolean {
  if (!hasValidImageSize(image)) {
    return false;
  }

  return image.width < 40 || image.height < 40;
}

function hasElementSize(img: HTMLImageElement): boolean {
  return img.naturalWidth > 0 && img.naturalHeight > 0;
}

function sizeFromElement(img: HTMLImageElement): ResolvedImageSize {
  return {
    complete: img.complete,
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

async function waitForElementImage(
  img: HTMLImageElement,
  timeoutMs: number,
): Promise<void> {
  try {
    await withTimeout(
      new Promise<void>((resolve) => {
        const onLoadOrError = () => {
          img.removeEventListener("load", onLoadOrError);
          img.removeEventListener("error", onLoadOrError);
          resolve();
        };
        img.addEventListener("load", onLoadOrError, { once: true });
        img.addEventListener("error", onLoadOrError, { once: true });
      }),
      timeoutMs,
    );
  } catch (error) {
    // Ignore timeout or other errors and proceed to probe the image size
  }
}

async function probeImageSize(
  src: string,
  timeoutMs: number,
): Promise<ResolvedImageSize> {
  const image = new Image();
  try {
    return await withTimeout(
      new Promise<ResolvedImageSize>((resolve) => {
        const finish = () => {
          resolve({
            complete: image.complete,
            width: image.naturalWidth || 0,
            height: image.naturalHeight || 0,
          });
        };

        image.onload = finish;
        image.onerror = finish;
        image.referrerPolicy = "no-referrer";
        image.src = src;
      }),
      timeoutMs,
    );
  } catch (error) {
    return {
      complete: false,
      width: 0,
      height: 0,
    };
  } finally {
    image.src = "";
    image.onload = null;
    image.onerror = null;
  }
}
