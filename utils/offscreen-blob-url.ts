import { downloadZip } from "client-zip";
import { PageImage } from "./page-images";

export interface CreateZipObjectUrlMessage {
  type: "CREATE_ZIP_OBJECT_URL";
  images: PageImage[];
  revokeAfterMs?: number;
}

export interface CreateObjectUrlMessage {
  type: "CREATE_OBJECT_URL";
  buffer: ArrayBuffer;
  mimeType: string;
  revokeAfterMs?: number;
}

export interface RevokeObjectUrlMessage {
  type: "REVOKE_OBJECT_URL";
  url: string;
}

type OffscreenMessage =
  | CreateZipObjectUrlMessage
  | CreateObjectUrlMessage
  | RevokeObjectUrlMessage;

const objectUrls = new Set<string>();

browser.runtime.onMessage.addListener(
  (message: OffscreenMessage, _sender, sendResponse) => {
    if (message?.type === "CREATE_ZIP_OBJECT_URL") {
      createZipObjectUrl(message)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            ok: false,
            error: formatError(error, String),
          });
        });
      return true;
    }

    if (message?.type === "CREATE_OBJECT_URL") {
      sendResponse(createObjectUrl(message));
      return true;
    }

    if (message?.type === "REVOKE_OBJECT_URL") {
      revokeObjectUrl(message.url);
      sendResponse({ ok: true });
      return true;
    }
  },
);

async function createZipObjectUrl(message: CreateZipObjectUrlMessage) {
  if (message.images.length === 0) {
    throw new Error("No images selected");
  }

  const names = new Map<string, number>();
  const files = await Promise.all(
    message.images.map(async (img) => {
      const res = await fetch(img.src, {
        cache: "force-cache",
      });
      const ext = img.type;
      let name = img.name;
      if (names.has(name)) {
        const count = names.get(name)! + 1;
        names.set(name, count);
        name += `(${count})`;
      } else {
        names.set(name, 0);
      }
      return {
        name: `${name}.${ext}`,
        input: res,
      };
    }),
  );

  const blob = await downloadZip(files).blob();
  return createObjectUrlFromBlob(blob, message.revokeAfterMs);
}

function createObjectUrl(message: CreateObjectUrlMessage) {
  const blob = new Blob([message.buffer], { type: message.mimeType });
  return createObjectUrlFromBlob(blob, message.revokeAfterMs);
}

function createObjectUrlFromBlob(blob: Blob, revokeAfterMs = 60_000) {
  const url = URL.createObjectURL(blob);
  objectUrls.add(url);

  if (revokeAfterMs > 0) {
    window.setTimeout(() => {
      revokeObjectUrl(url);
    }, revokeAfterMs);
  }

  return { ok: true, url };
}

function revokeObjectUrl(url: string) {
  if (!objectUrls.has(url)) {
    return;
  }

  URL.revokeObjectURL(url);
  objectUrls.delete(url);
}
