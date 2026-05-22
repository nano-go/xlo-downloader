import { PageImage } from "@/utils/page-image-types";

const OFFSCREEN_DOCUMENT_PATH = "/offscreen.html";

/**
 * Downloads the provided images as a zip file. It creates an offscreen document to generate a Blob URL for the zip file, which is then downloaded using the browser's downloads API.
 *
 * @param images - An array of PageImage objects representing the images to be included in the zip file.
 * @param zipName - The desired name for the downloaded zip file (without the .zip extension).
 */
export async function downloadAndZip(images: PageImage[], zipName: string) {
  const url = await createZipObjectUrl(images);
  await browser.downloads.download({
    url,
    filename: `${zipName}.zip`,
    saveAs: true,
  });
  await browser.offscreen.closeDocument();
}

async function createZipObjectUrl(images: PageImage[]) {
  await ensureOffscreenDocument();

  const response = await sendOffscreenMessage({
    type: "CREATE_ZIP_OBJECT_URL",
    images,
    revokeAfterMs: 60_000,
  } as CreateZipObjectUrlMessage);

  if (!response?.ok || !response.url) {
    throw new Error(response?.error || "Unable to create zip object URL");
  }

  return response.url as string;
}

async function ensureOffscreenDocument() {
  if (await browser.offscreen.hasDocument()) {
    return;
  }

  await browser.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: ["BLOBS"],
    justification: "Create Blob URLs for generated zip downloads",
  });
}

async function sendOffscreenMessage(message: unknown) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await browser.runtime.sendMessage(message);
    } catch (error) {
      lastError = error;

      if (!isReceivingEndMissingError(error)) {
        throw error;
      }

      await delay(100);
    }
  }

  throw lastError;
}

function isReceivingEndMissingError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Receiving end does not exist")
  );
}
