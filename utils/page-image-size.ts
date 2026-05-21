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
    await waitForElementImage(img, WAIT_FOR_ELEMENT_TIMEOUT_MS);

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
  if (img.complete) {
    return;
  }

  await new Promise<void>((resolve) => {
    let timeoutId: number;

    const cleanup = () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      window.clearTimeout(timeoutId);
    };

    const done = () => {
      cleanup();
      resolve();
    };

    timeoutId = window.setTimeout(done, timeoutMs);
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });
}

async function probeImageSize(
  src: string,
  timeoutMs: number,
): Promise<ResolvedImageSize> {
  return new Promise<ResolvedImageSize>((resolve) => {
    const image = new Image();
    let timeoutId: number;

    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      window.clearTimeout(timeoutId);
    };

    const finish = () => {
      cleanup();
      resolve({
        complete: image.complete,
        width: image.naturalWidth || 0,
        height: image.naturalHeight || 0,
      });
    };

    timeoutId = window.setTimeout(finish, timeoutMs);
    image.onload = finish;
    image.onerror = finish;
    image.referrerPolicy = "no-referrer";
    image.src = src;
  });
}
