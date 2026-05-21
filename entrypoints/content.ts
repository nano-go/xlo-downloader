import { formatError } from "@/utils/errors";
import { PageImagesManager, type PageImage } from "@/utils/page-images";
import { isPageImageTooSmall } from "@/utils/page-image-size";

export type PageImagesResponse =
  | { ok: true; images: PageImage[]; complete: boolean }
  | { ok: false; error: string };

export interface PostLoadedImageMessage {
  type: typeof CONTENT_POPUP_POST_LOADED_IMAGE;
  img: PageImage;
}

// The request type for getting page images from the content script
export const REQ_TYPE_GET_PAGE_IMAGES = "GET_PAGE_IMAGES";

// The port name for the long-lived connection between the content script and the popup
export const CONTENT_POPUP_PORT_NAME = "CONTENT_POPUP_PORT";

// The message type for posting a loaded image from the content script to the popup
export const CONTENT_POPUP_POST_LOADED_IMAGE =
  "CONTENT_POPUP_POST_LOADED_IMAGE";

export function isPostLoadedImageMessage(
  message: any,
): message is PostLoadedImageMessage {
  return message.type === CONTENT_POPUP_POST_LOADED_IMAGE;
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    const pageImgs = new PageImagesManager();
    let port: Browser.runtime.Port | null = null;

    function connect(): boolean {
      try {
        port = browser.runtime.connect({ name: CONTENT_POPUP_PORT_NAME });
        port.onDisconnect.addListener(() => {
          port = null;
        });
        return true;
      } catch (error) {
        return false;
      }
    }

    function postLoadedImage(img: PageImage) {
      if (isPageImageTooSmall(img)) {
        return;
      }
      if (!port && !connect()) {
        return;
      }
      port!.postMessage({
        type: CONTENT_POPUP_POST_LOADED_IMAGE,
        img,
      } as PostLoadedImageMessage);
    }

    async function loadImages(
      sendResponse: (response: PageImagesResponse) => void,
    ) {
      try {
        const imgElements = document.querySelectorAll("img");
        const images = (
          await pageImgs.collectPageImages(Array.from(imgElements))
        ).filter((img) => !isPageImageTooSmall(img));
        sendResponse({
          ok: true,
          images,
          complete: pageImgs.isComplete,
        });
      } catch (error) {
        sendResponse({
          ok: false,
          error: formatError(error, "Unable to read page images"),
        });
        return;
      }

      if (pageImgs.isComplete || pageImgs.isLoadingUncompleteImages) {
        return;
      }

      // Start loading uncomplete images and post them to the popup as they are loaded
      connect();
      await pageImgs.loadUncompleteImages(postLoadedImage);
      port?.disconnect();
      port = null;
    }

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== REQ_TYPE_GET_PAGE_IMAGES) {
        return false;
      }
      loadImages(sendResponse);
      return true;
    });
  },
});
