import { formatError } from "@/utils/errors";
import {
  getImageType,
  getNameWithoutExtFromUrl,
  type PageImage,
} from "@/utils/page-images";
import {
  hasValidImageSize,
  isPageImageTooSmall,
  resolveImageSize,
} from "@/utils/page-image-size";

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
  const seenSrcs = new Set<string>();

  const imageElements = document.querySelectorAll("img");

  const imagePromises = Array.from(imageElements).map(async (img) => {
    const src = imageSrc(img);
    if (src.length === 0) {
      return;
    }
    if (seenSrcs.has(src)) {
      return;
    }
    seenSrcs.add(src);

    const loadedImage = loadedPageImages.get(src);
    if (loadedImage) {
      images.push(loadedImage);
      return;
    }

    if (!isVisible(img)) {
      return;
    }

    const pageImage = await convertToPageImage(img, src);
    if (isPageImageTooSmall(pageImage)) {
      return;
    }

    images.push(pageImage);
    if (hasValidImageSize(pageImage)) {
      loadedPageImages.set(src, pageImage);
    }
  });

  await Promise.all(imagePromises);

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

async function convertToPageImage(
  img: HTMLImageElement,
  src: string,
): Promise<PageImage> {
  const size = await resolveImageSize(img, src);
  return {
    complete: size.complete,
    src,
    name: getNameWithoutExtFromUrl(src) ?? "image",
    type: await getImageType(src),
    width: size.width,
    height: size.height,
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
