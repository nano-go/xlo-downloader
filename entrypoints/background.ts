import { downloadAndZip } from "@/utils/download_as_zip";
import { PageImage } from "@/utils/page-image-types";

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
