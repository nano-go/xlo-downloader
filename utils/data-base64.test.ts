import { describe, expect, it } from "bun:test";
import { isDataBase64, resolveBase64Image } from "./data-base64";

function makePngBase64(width: number, height: number): string {
  const ihdr = new Uint8Array(13);
  ihdr[0] = (width >>> 24) & 0xff;
  ihdr[1] = (width >>> 16) & 0xff;
  ihdr[2] = (width >>> 8) & 0xff;
  ihdr[3] = width & 0xff;
  ihdr[4] = (height >>> 24) & 0xff;
  ihdr[5] = (height >>> 16) & 0xff;
  ihdr[6] = (height >>> 8) & 0xff;
  ihdr[7] = height & 0xff;
  ihdr[8] = 8;
  ihdr[9] = 2;

  const signature = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  const type = new Uint8Array([0x49, 0x48, 0x44, 0x52]);

  const crc = crc32(new Uint8Array([...type, ...ihdr]));
  const crcBytes = new Uint8Array(4);
  crcBytes[0] = (crc >>> 24) & 0xff;
  crcBytes[1] = (crc >>> 16) & 0xff;
  crcBytes[2] = (crc >>> 8) & 0xff;
  crcBytes[3] = crc & 0xff;

  const length = new Uint8Array(4);
  length[0] = (ihdr.length >>> 24) & 0xff;
  length[1] = (ihdr.length >>> 16) & 0xff;
  length[2] = (ihdr.length >>> 8) & 0xff;
  length[3] = ihdr.length & 0xff;

  const full = new Uint8Array([
    ...signature,
    ...length,
    ...type,
    ...ihdr,
    ...crcBytes,
  ]);
  return btoa(String.fromCharCode(...full));
}

function makeGifBase64(width: number, height: number): string {
  const header = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  const logicalScreen = new Uint8Array([
    width & 0xff,
    (width >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
    0x00,
    0x00,
    0x00,
  ]);
  const block = new Uint8Array([
    0x2c,
    0x00,
    0x00,
    0x00,
    0x00,
    width & 0xff,
    (width >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
    0x00,
    0x02,
    0x3b,
  ]);
  const full = new Uint8Array([...header, ...logicalScreen, ...block]);
  return btoa(String.fromCharCode(...full));
}

function makeJpegBase64(width: number, height: number): string {
  const soi = new Uint8Array([0xff, 0xd8]);
  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
    0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  ]);
  const sof0 = new Uint8Array([
    0xff,
    0xc0,
    0x00,
    0x0b,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x01,
    0x01,
    0x11,
    0x00,
  ]);
  const eoi = new Uint8Array([0xff, 0xd9]);
  const full = new Uint8Array([...soi, ...app0, ...sof0, ...eoi]);
  return btoa(String.fromCharCode(...full));
}

function makeWebpBase64VP8(width: number, height: number): string {
  const w = width & 0x3fff;
  const h = height & 0x3fff;
  const vp8Data = new Uint8Array([
    0x9d,
    0x01,
    0x2a,
    w & 0xff,
    (w >> 8) & 0xff,
    h & 0xff,
    (h >> 8) & 0xff,
  ]);

  const riff = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
  const fileSize = 12 + 8 + vp8Data.length;
  const fileSizeBytes = new Uint8Array(4);
  fileSizeBytes[0] = fileSize & 0xff;
  fileSizeBytes[1] = (fileSize >> 8) & 0xff;
  fileSizeBytes[2] = (fileSize >> 16) & 0xff;
  fileSizeBytes[3] = (fileSize >> 24) & 0xff;

  const webp = new Uint8Array([0x57, 0x45, 0x42, 0x50]);
  const chunkType = new Uint8Array([0x56, 0x50, 0x38, 0x20]);
  const chunkSize = new Uint8Array(4);
  const cs = vp8Data.length;
  chunkSize[0] = cs & 0xff;
  chunkSize[1] = (cs >> 8) & 0xff;

  const full = new Uint8Array([
    ...riff,
    ...fileSizeBytes,
    ...webp,
    ...chunkType,
    ...chunkSize,
    ...vp8Data,
  ]);

  const base64 = btoa(String.fromCharCode(...full));
  return `data:image/webp;base64,${base64}`;
}

const CRC_TABLE = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

describe("isDataBase64", () => {
  it("returns true for valid data base64 URL", () => {
    expect(isDataBase64("data:image/png;base64,iVBOR")).toBe(true);
  });

  it("returns true for different image types", () => {
    expect(isDataBase64("data:image/jpeg;base64,/9j/")).toBe(true);
    expect(isDataBase64("data:image/webp;base64,UklG")).toBe(true);
    expect(isDataBase64("data:image/gif;base64,R0lG")).toBe(true);
    expect(isDataBase64("data:image/svg+xml;base64,PHN2")).toBe(true);
  });

  it("returns false for http URL", () => {
    expect(isDataBase64("https://example.com/image.png")).toBe(false);
  });

  it("returns false for data URL without base64", () => {
    expect(isDataBase64("data:image/png;charset=utf8,test")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isDataBase64("")).toBe(false);
  });
});

describe("resolvePageImage", () => {
  function mockImg(naturalWidth: number, naturalHeight: number) {
    return { naturalWidth, naturalHeight } as HTMLImageElement;
  }

  it("uses naturalWidth/naturalHeight when available", () => {
    const b64 = makePngBase64(100, 200);
    const url = `data:image/png;base64,${b64}`;
    const result = resolveBase64Image(mockImg(100, 200), url);
    expect(result).not.toBeNull();
    expect(result!.width).toBe(100);
    expect(result!.height).toBe(200);
    expect(result!.type).toBe("png");
    expect(result!.name).toBe("data-base64-image");
  });

  it("parses PNG dimensions from base64 when naturalWidth is 0", () => {
    const b64 = makePngBase64(64, 128);
    const url = `data:image/png;base64,${b64}`;
    const result = resolveBase64Image(mockImg(0, 0), url);
    expect(result).not.toBeNull();
    expect(result!.width).toBe(64);
    expect(result!.height).toBe(128);
    expect(result!.type).toBe("png");
  });

  it("parses GIF dimensions from base64", () => {
    const b64 = makeGifBase64(320, 240);
    const url = `data:image/gif;base64,${b64}`;
    const result = resolveBase64Image(mockImg(0, 0), url);
    expect(result).not.toBeNull();
    expect(result!.width).toBe(320);
    expect(result!.height).toBe(240);
    expect(result!.type).toBe("gif");
  });

  it("parses JPEG dimensions from base64", () => {
    const b64 = makeJpegBase64(1920, 1080);
    const url = `data:image/jpeg;base64,${b64}`;
    const result = resolveBase64Image(mockImg(0, 0), url);
    expect(result).not.toBeNull();
    expect(result!.width).toBe(1920);
    expect(result!.height).toBe(1080);
    expect(result!.type).toBe("jpeg");
  });

  it("parses WEBP dimensions from base64 (VP8)", () => {
    const url = makeWebpBase64VP8(800, 600);
    const result = resolveBase64Image(mockImg(0, 0), url);
    expect(result).not.toBeNull();
    expect(result!.width).toBe(800);
    expect(result!.height).toBe(600);
    expect(result!.type).toBe("webp");
  });

  it("returns null for non-data URL", () => {
    const result = resolveBase64Image(
      mockImg(100, 100),
      "https://example.com/img.png",
    );
    expect(result).toBeNull();
  });

  it("returns null for non-base64 data URL", () => {
    const result = resolveBase64Image(
      mockImg(0, 0),
      "data:image/png;charset=utf8,test",
    );
    expect(result).toBeNull();
  });

  it("returns 0 width/height for unrecognizable binary data", () => {
    const garbage = btoa("not an image at all just random text here");
    const url = `data:image/png;base64,${garbage}`;
    const result = resolveBase64Image(mockImg(0, 0), url);
    expect(result).not.toBeNull();
    expect(result!.width).toBe(0);
    expect(result!.height).toBe(0);
  });

  it("defaults type to jpg for unknown MIME subtype", () => {
    const full = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33,
    ]);
    const b64 = btoa(String.fromCharCode(...full));
    const url = `data:image/bmp;base64,${b64}`;
    const result = resolveBase64Image(mockImg(1, 1), url);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("jpg");
  });

  it("prefers naturalWidth/naturalHeight over base64 parsing", () => {
    const b64 = makePngBase64(64, 128);
    const url = `data:image/png;base64,${b64}`;
    const result = resolveBase64Image(mockImg(200, 300), url);
    expect(result!.width).toBe(200);
    expect(result!.height).toBe(300);
  });
});

