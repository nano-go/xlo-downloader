import { downloadZip } from "client-zip";
import { PageImage } from "@/utils/page-image-types";

export interface CreateZipObjectUrlMessage {
  type: "CREATE_ZIP_OBJECT_URL";
  images: PageImage[];
  revokeAfterMs?: number;
}

const objectUrls = new Set<string>();

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CREATE_ZIP_OBJECT_URL") {
    createZipObjectUrl(message)
      .then(sendResponse)
      .catch((error) => {
        let msg;

        if (error instanceof TypeError) {
          msg = "network error while fetching image data";
        } else {
          msg = formatError(error, "unknown error while creating zip");
        }

        sendResponse({
          ok: false,
          error: msg,
        });
      });
    return true;
  }
});

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
      let name = img.name;
      if (names.has(name)) {
        const count = names.get(name)! + 1;
        names.set(name, count);
        name += `(${count})`;
      } else {
        names.set(name, 0);
      }
      return {
        name: `${name}.${img.type}`,
        input: res,
      };
    }),
  );

  const blob = await downloadZip(files).blob();
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
