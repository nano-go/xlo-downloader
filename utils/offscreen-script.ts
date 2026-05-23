import { downloadZip } from "client-zip";
import { PageImage } from "@/utils/page-image-types";

export interface CreateZipObjectUrlMessage {
  type: "CREATE_ZIP_OBJECT_URL";
  images: PageImage[];
}

const objectUrls = new Set<string>();

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message?.type) {
    case "CREATE_ZIP_OBJECT_URL":
      createZipObjectUrl(message.images)
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
    default:
      return false;
  }
});

async function createZipObjectUrl(images: PageImage[]) {
  if (images.length === 0) {
    throw new Error("No images selected");
  }

  const responses = await Promise.all(
    images.map(
      async (img) =>
        await fetch(img.src, {
          cache: "force-cache",
        }),
    ),
  );

  const names = new Map<string, number>();
  const files = images.map((img, i) => {
    let name = img.name;

    while (names.has(name)) {
      let count = names.get(name)! + 1;
      names.set(img.name, count);
      name = `${img.name}(${count})`;
    }

    return {
      name: `${name}.${img.type}`,
      input: responses[i],
    };
  });

  const blob = await downloadZip(files).blob();
  return createObjectUrlFromBlob(blob);
}

function createObjectUrlFromBlob(blob: Blob, revokeAfterMs = 60_000) {
  const url = URL.createObjectURL(blob);
  objectUrls.add(url);

  if (revokeAfterMs > 0) {
    // Ensure the object URL is revoked after a certain time to free up memory
    // Actually, the URL will be revoked when the offscreen document is closed, but this is
    // an extra safety measure in case the document remains open for a long time
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
