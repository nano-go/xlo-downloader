import { useCallback, useEffect, useState } from "react";
import { type PageImage } from "../../../utils/page-images";
import { formatError } from "@/utils/errors";

const GET_PAGE_IMAGES = "GET_PAGE_IMAGES";

export type LoadState =
  | {
      status: "loading";
      images: PageImage[];
      tabId?: number;
      error?: undefined;
    }
  | {
      status: "success";
      images: PageImage[];
      tabId: number;
      error?: undefined;
    }
  | {
      status: "empty";
      images: PageImage[];
      tabId: number;
      error?: undefined;
    }
  | {
      status: "error";
      images: PageImage[];
      tabId?: number;
      error: string;
    };

type PageImagesResponse =
  | { ok: true; images: PageImage[] }
  | { ok: false; error: string };

export function usePageImages() {
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
    images: [],
  });

  const loadImages = useCallback(async () => {
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
      tabId,
    });
  }, []);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  return { loadState, loadImages };
}

async function getPageImages(tabId: number): Promise<PageImagesResponse> {
  try {
    const response = (await browser.tabs.sendMessage(tabId, {
      type: GET_PAGE_IMAGES,
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
