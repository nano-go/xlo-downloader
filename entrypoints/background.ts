import { CreateZipObjectUrlMessage } from "@/utils/offscreen-blob-url";
import { PageImage } from "@/utils/page-images";

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
          sendResponse({ ok: false, error: formatError(err, String) }),
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
 * Downloads the given images as a zip file with the specified name. This function ensures that an offscreen document is available to create Blob URLs for the zip file, and it handles retries if the offscreen document is not yet ready.
 *
 * @param images - An array of PageImage objects representing the images to be included in the zip file.
 * @param zipName - The desired name for the downloaded zip file (without the .zip extension).
 */
async function downloadAndZip(images: PageImage[], zipName: string) {
  const url = await createZipObjectUrl(images);
  await browser.downloads.download({
    url,
    filename: `${zipName}.zip`,
    saveAs: true,
  });
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

let creatingOffscreenDocument: Promise<void> | undefined;

async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    return;
  }

  if (creatingOffscreenDocument === undefined) {
    creatingOffscreenDocument = browser.offscreen
      .createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: ["BLOBS"],
        justification: "Create Blob URLs for generated zip downloads",
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("Only a single offscreen document")) {
          throw error;
        }
      })
      .finally(() => {
        creatingOffscreenDocument = undefined;
      });
  }

  await creatingOffscreenDocument;
}

async function hasOffscreenDocument() {
  const offscreenUrl = browser.runtime.getURL(OFFSCREEN_DOCUMENT_PATH as never);

  if ("getContexts" in browser.runtime) {
    const contexts = await browser.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [offscreenUrl],
    });

    return contexts.length > 0;
  }

  const serviceWorkerClients = (
    globalThis as typeof globalThis & {
      clients?: { matchAll: () => Promise<Array<{ url: string }>> };
    }
  ).clients;

  if (!serviceWorkerClients) {
    return false;
  }

  const matchedClients = await serviceWorkerClients.matchAll();

  return matchedClients.some((client) => client.url === offscreenUrl);
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

      await wait(100);
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

function wait(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
