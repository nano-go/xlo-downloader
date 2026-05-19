export type ImageType =
  | "png"
  | "jpg"
  | "jpeg"
  | "gif"
  | "webp"
  | "svg"
  | "unknown";
const VALID_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

export type PageImage = {
  src: string;
  name: string;
  type: ImageType;
  width: number;
  height: number;
  complete: boolean;
};

export function getNameWithoutExtFromUrl(url: string): string | undefined {
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

export async function getImageType(src: string): Promise<ImageType> {
  let type = getImageTypeFromUrl(src);
  if (!type) {
    type = await getImageTypeFromHeader(src);
  }
  return type || "unknown";
}

export function getImageTypeFromUrl(url: string): ImageType | undefined {
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

export async function getImageTypeFromHeader(
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

export function getImageTypeFromContentType(
  contentType: string,
): ImageType | undefined {
  return CONTENT_TYPE_TO_EXT[contentType.toLowerCase()];
}
