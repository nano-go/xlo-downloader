import type { PageImage } from "./page-images";
import { isValidImageType, type ImageType } from "./page-image-info";

const DATA_BASE64_PREFIX_RE = /^data:image\/[^;]+;base64,/;

export function isDataBase64(url: string): boolean {
  return DATA_BASE64_PREFIX_RE.test(url);
}

export function resolveBase64Image(
  img: HTMLImageElement,
  src: string,
): PageImage | null {
  try {
    if (!isDataBase64(src)) {
      return null;
    }

    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      return {
        src,
        name: "data-base64-image",
        type: extractTypeFromDataBase64(src),
        width: img.naturalWidth,
        height: img.naturalHeight,
      };
    }

    const bytes = decodeBase64DataUrl(src);
    if (!bytes) {
      return null;
    }

    const dimensions = parseDimensions(bytes);
    return {
      src,
      name: "data-base64-image",
      type: extractTypeFromDataBase64(src),
      width: dimensions?.width ?? 0,
      height: dimensions?.height ?? 0,
    };
  } catch {
    return null;
  }
}

function extractTypeFromDataBase64(url: string): ImageType {
  const mimePart = url.split(";")[0];
  let subtype = mimePart.split("/")[1];
  if (!subtype) {
    return "jpg";
  }

  subtype = subtype.toLowerCase();
  if (!isValidImageType(subtype)) {
    return "jpg";
  }

  return subtype;
}

function decodeBase64DataUrl(url: string): Uint8Array | null {
  try {
    const commaIndex = url.indexOf(",");
    if (commaIndex === -1) {
      return null;
    }

    const base64 = url.slice(commaIndex + 1);
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function parseDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  if (bytes.length < 2) return null;

  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return parsePngDimensions(bytes);
  }

  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return parseGifDimensions(bytes);
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return parseJpegDimensions(bytes);
  }

  if (
    bytes.length > 11 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return parseWebpDimensions(bytes);
  }

  return null;
}

function parsePngDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  if (bytes.length < 24) return null;

  const width =
    (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height =
    (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  return { width, height };
}

function parseGifDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  if (bytes.length < 10) return null;

  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  return { width, height };
}

function parseJpegDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  let offset = 2;

  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) return null;

    const marker = bytes[offset + 1];
    offset += 2;

    if ((marker & 0xf0) === 0xc0 && marker !== 0xc4 && marker !== 0xc8) {
      if (offset + 7 > bytes.length) return null;
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      return { width, height };
    }

    if (
      marker === 0xd0 ||
      marker === 0xd1 ||
      marker === 0xd2 ||
      marker === 0xd3 ||
      marker === 0xd4 ||
      marker === 0xd5 ||
      marker === 0xd6 ||
      marker === 0xd7 ||
      marker === 0xd8 ||
      marker === 0xd9
    ) {
      continue;
    }

    if (offset + 2 > bytes.length) return null;
    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    offset += segmentLength;
  }

  return null;
}

function parseWebpDimensions(
  bytes: Uint8Array,
): { width: number; height: number } | null {
  if (bytes.length < 12) return null;

  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (riff !== "RIFF") return null;

  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (webp !== "WEBP") return null;

  const chunkFourCC = String.fromCharCode(
    bytes[12],
    bytes[13],
    bytes[14],
    bytes[15],
  );

  if (chunkFourCC === "VP8 ") {
    if (bytes.length < 27) return null;
    const width = (bytes[23] | (bytes[24] << 8)) & 0x3fff;
    const height = (bytes[25] | (bytes[26] << 8)) & 0x3fff;
    return { width, height };
  }

  if (chunkFourCC === "VP8L") {
    if (bytes.length < 25) return null;
    const bits =
      bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }

  if (chunkFourCC === "VP8X") {
    if (bytes.length < 30) return null;
    const width = (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)) + 1;
    const height = (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) + 1;
    return { width, height };
  }

  return null;
}

