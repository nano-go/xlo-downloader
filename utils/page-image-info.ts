import { resolveBase64Image } from "./data-base64";
import type { PageImage } from "./page-images";

export type ImageType = "png" | "jpg" | "jpeg" | "gif" | "webp" | "svg";
export const VALID_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

export function isValidImageType(type: string): type is ImageType {
  return VALID_EXTS.includes(type);
}

const WAIT_FOR_ELEMENT_TIMEOUT_MS = 1000;
const PROBE_IMAGE_TIMEOUT_MS = 10000;

export type ResolvedImageResolution = {
  width: number;
  height: number;
};

export async function resolvePageImageInfo(
  img: HTMLImageElement,
  src: string,
): Promise<PageImage> {
  const result = resolveBase64Image(img, src);
  if (result) {
    return result;
  }

  const resolution = await resolveImageResolution(img, src);
  const type = await getImageType(src);

  return {
    src,
    name: getNameWithoutExtFromUrl(src) ?? "image",
    type,
    width: resolution.width,
    height: resolution.height,
  };
}

/**
 * Resolves the resolution of an html image element.
 *
 * If the image element has invalid size (naturalWidth or naturalHeight is 0), this
 * function will load the image by waiting for the load or error event, or probing
 * the image size by creating a new Image object with the same src.
 */
async function resolveImageResolution(
  img: HTMLImageElement,
  src: string,
): Promise<ResolvedImageResolution> {
  if (hasElementSize(img)) {
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  }

  if (img.loading !== "lazy") {
    await waitForElementImage(img, WAIT_FOR_ELEMENT_TIMEOUT_MS);

    if (hasElementSize(img)) {
      return {
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
    }
  }

  return probeImageSize(src, PROBE_IMAGE_TIMEOUT_MS);
}

function hasElementSize(img: HTMLImageElement): boolean {
  return img.naturalWidth > 0 && img.naturalHeight > 0;
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
): Promise<ResolvedImageResolution> {
  const image = new Image();
  try {
    return await withTimeout(
      new Promise<ResolvedImageResolution>((resolve) => {
        const finish = () => {
          resolve({
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
      width: 0,
      height: 0,
    };
  } finally {
    image.src = "";
    image.onload = null;
    image.onerror = null;
  }
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
    type = url.split("?")[0].split("#")[0].split(".").pop();
  }

  if (!type) {
    return undefined;
  }

  type = type.toLowerCase();

  return isValidImageType(type) ? type : undefined;
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
