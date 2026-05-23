import { PageImage } from "@/utils/page-image-types";

const OFFSCREEN_DOCUMENT_PATH = "/offscreen.html";

export interface DownloadImagesMessage {
  type: "DOWNLOAD_IMAGES";
  images: PageImage[];
  zipName: string;
}

export default defineBackground(() => {
  initRelayFromContentToPopup();
  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "DOWNLOAD_IMAGES") {
      const downloadMsg = msg as DownloadImagesMessage;
      downloadAndZip(downloadMsg.images, downloadMsg.zipName)
        .then(() => sendResponse({ ok: true }))
        .catch((err) =>
          sendResponse({
            ok: false,
            error: formatError(err, "unknown error while downloading images"),
          }),
        );
      return true;
    }
  });
});

/**
 * Initializes a relay mechanism to forward messages from content scripts to the popup.
 *
 * In the private mode of some browsers (especially mobile), content scripts cannot
 * communicate directly with the popup.
 *
 * This function listens for messages from content scripts and relays them to the
 * popup if it is connected. It maintains a reference to the popup's communication
 * port and ensures that messages with the `relay` property are forwarded appropriately.
 */
export function initRelayFromContentToPopup() {
  let popupPort: Browser.runtime.Port | null = null;
  // Listen for connections from the popup
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== "background-popup") return;
    popupPort = port;
    port.onDisconnect.addListener(() => {
      popupPort = null;
    });
  });

  // Listen for messages from the content script and relay them to the popup if connected
  browser.runtime.onMessage.addListener((msg) => {
    if (!msg.relay) return;
    popupPort?.postMessage(msg);
  });
}

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
