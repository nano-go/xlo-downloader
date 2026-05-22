import { formatError } from "@/utils/errors";
import { PageImagesManager, type PageImage } from "@/utils/page-images";

export type PageImagesResponse =
  | { ok: true; images: PageImage[]; complete: boolean }
  | { ok: false; error: string };

/**
 * The request type for getting page images from the content script
 */
export const TYPE_GET_PAGE_IMAGES = "GET_PAGE_IMAGES";

/**
 * The message type for posting a newly loaded image from the content script to the
 * popup by relaying through the background script.
 */
export const TYPE_POST_NEW_IMG = "CONTENT_POST_NEW_IMG";

/**
 * The message type for indicating that all images have been loaded and posted from
 * the content script to the popup by relaying through the background script.
 */
export const TYPE_COMPLETE_LOADING = "CONTENT_COMPLETE_LOADING";

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    const pageImgs = new PageImagesManager();

    function postLoadedImage(img: PageImage) {
      if (isPageImageTooSmall(img)) {
        return;
      }
      browser.runtime.sendMessage({
        relay: true,
        type: TYPE_POST_NEW_IMG,
        img,
      });
    }

    function isPageImageTooSmall(image: PageImage): boolean {
      return image.width < 40 || image.height < 40;
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
      await pageImgs.loadUncompleteImages(postLoadedImage);
      browser.runtime.sendMessage({
        relay: true,
        type: TYPE_COMPLETE_LOADING,
      });
    }

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== TYPE_GET_PAGE_IMAGES) {
        return false;
      }
      loadImages(sendResponse);
      return true;
    });
  },
});
