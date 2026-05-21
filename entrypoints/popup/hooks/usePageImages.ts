import { useCallback, useEffect, useState } from "react";
import { type PageImage } from "@/utils/page-images";
import { formatError } from "@/utils/errors";
import { useAsyncLock } from "./useAsyncLock";
import {
  REQ_TYPE_GET_PAGE_IMAGES,
  PageImagesResponse,
  CONTENT_POPUP_PORT_NAME,
  isPostLoadedImageMessage,
} from "@/entrypoints/content";

export type LoadState =
  | {
      status: "loading";
      images: PageImage[];
      tabId?: number;
      error?: undefined;
      complete?: boolean;
    }
  | {
      status: "success";
      images: PageImage[];
      tabId: number;
      error?: undefined;
      complete: boolean;
    }
  | {
      status: "empty";
      images: PageImage[];
      tabId: number;
      error?: undefined;
      complete?: boolean;
    }
  | {
      status: "error";
      images: PageImage[];
      tabId?: number;
      error: string;
      complete?: boolean;
    };

export function usePageImages() {
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
    images: [],
  });

  const addPageImages = useCallback(
    (newImages: PageImage[]) => {
      setLoadState((prevState) => {
        if (prevState.status !== "success") {
          return prevState;
        }

        const existingImages = new Set(prevState.images.map((img) => img.src));
        const uniqueNewImages = newImages.filter(
          (img) => !existingImages.has(img.src),
        );

        if (uniqueNewImages.length === 0) {
          return prevState;
        }

        return {
          ...prevState,
          images: [...prevState.images, ...uniqueNewImages],
        };
      });
    },
    [setLoadState],
  );

  const handleConnect = useCallback(
    (port: Browser.runtime.Port) => {
      if (port.name !== CONTENT_POPUP_PORT_NAME) {
        return;
      }

      // Listen for new images from content script
      port.onMessage.addListener((message) => {
        if (!isPostLoadedImageMessage(message)) {
          return;
        }
        addPageImages([message.img]);
      });

      // Listen for port disconnection to know when to stop listening for new images
      port.onDisconnect.addListener(() => {
        setLoadState((prevState) => {
          if (prevState.status !== "success") {
            return prevState;
          }
          return {
            ...prevState,
            complete: true,
          };
        });

        browser.runtime.onConnect.removeListener(handleConnect);
      });
    },
    [addPageImages, setLoadState],
  );

  const [_, loadImages] = useAsyncLock(async () => {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      setLoadState({
        status: "error",
        images: [],
        error: "Can't find the active tab",
      });
      return;
    }

    const tabId = tab.id;
    setLoadState({ status: "loading", images: [], tabId });

    const response = await getPageImages(tabId);

    if (!response.ok) {
      setLoadState({
        status: "error",
        images: [],
        error: response.error,
      });
      return;
    }

    if (response.images.length === 0) {
      setLoadState({
        status: "empty",
        images: [],
        tabId,
      });
      return;
    }

    setLoadState({
      status: "success",
      images: response.images,
      complete: response.complete,
      tabId,
    });

    if (response.complete) {
      return;
    }

    // Listen for new images from content script
    browser.runtime.onConnect.addListener(handleConnect);
  }, [setLoadState, handleConnect]);

  // Initial load of page images
  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  return { loadState, loadImages };
}

async function getPageImages(tabId: number): Promise<PageImagesResponse> {
  try {
    const response = (await browser.tabs.sendMessage(tabId, {
      type: REQ_TYPE_GET_PAGE_IMAGES,
    })) as PageImagesResponse | undefined;

    return (
      response || {
        ok: false,
        error: "There is no response from content script",
      }
    );
  } catch (error) {
    return {
      ok: false,
      error: formatError(
        error,
        "Unknown error occurred while reading page images",
      ),
    };
  }
}
