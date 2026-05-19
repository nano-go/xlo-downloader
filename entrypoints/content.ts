import { formatError } from "@/utils/errors";
import {
  getImageType,
  getNameWithoutExtFromUrl,
  type PageImage,
} from "@/utils/page-images";

const GET_PAGE_IMAGES = "GET_PAGE_IMAGES";

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    const loadedPageImages = new Map<string, PageImage>();

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== GET_PAGE_IMAGES) {
        return false;
      }

      collectImages(loadedPageImages)
        .then((images) =>
          sendResponse({
            ok: true,
            images,
          }),
        )
        .catch((error) => {
          sendResponse({
            ok: false,
            error: formatError(error, "Unable to read page images"),
          });
        });

      return true;
    });
  },
});

async function collectImages(
  loadedPageImages: Map<string, PageImage>,
): Promise<PageImage[]> {
  const images: PageImage[] = [];
  for (let img of document.querySelectorAll("img")) {
    const src = imageSrc(img);
    if (src.length === 0) {
      continue;
    }

    const loadedImage = loadedPageImages.get(src);
    if (loadedImage) {
      images.push(loadedImage);
      continue;
    }

    if (!isVisible(img) || isTooSmall(img)) {
      continue;
    }

    const pageImage = await convertToPageImage(img, src);
    if (pageImage === undefined) {
      continue;
    }
    images.push(pageImage);
    loadedPageImages.set(src, pageImage);
  }
  return images;
}

function isVisible(img: Element): boolean {
  const style = window.getComputedStyle(img);
  return (
    img.isConnected &&
    img.getClientRects().length > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
}

function isTooSmall(img: HTMLImageElement): boolean {
  if (!img.complete) {
    return false;
  }
  return img.naturalWidth * img.naturalHeight < 50 * 50;
}

async function convertToPageImage(
  img: HTMLImageElement,
  src: string,
): Promise<PageImage> {
  return {
    complete: img.complete,
    src,
    name: getNameWithoutExtFromUrl(src) ?? "image",
    type: await getImageType(src),
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

function imageSrc(img: HTMLImageElement): string {
  return (
    img.currentSrc ||
    img.src ||
    img.dataset.src ||
    img.dataset.lazySrc ||
    img.dataset.original ||
    img.dataset.imgSrc ||
    img.getAttribute("data-lazy") ||
    img.getAttribute("data-url") ||
    ""
  );
}
