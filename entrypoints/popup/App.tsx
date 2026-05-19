import "./App.css";
import "@/assets/tailwind.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FilterView } from "./components/FilterView";
import { HideOnScrollHeader } from "./components/HideOnScrollHeader";
import { ImageGrid } from "./components/ImageGrid";
import { PopupHeader } from "./components/PopupHeader";
import { StatusMessage } from "./components/StatusMessage";
import { Toast, ToastProvider } from "./components/Toast";
import { useAsyncLock } from "./hooks/useAsyncLock";
import { LoadState, usePageImages } from "./hooks/usePageImages";
import { LuCopy, LuDownload } from "react-icons/lu";
import { PageImage } from "@/utils/page-images";
import { DownloadImagesMessage } from "../background";
import { useImageFilters } from "./hooks/useImageFilters";
import { useSelectedImages } from "./hooks/useSelectedImages";

async function downloadSelectedImages(state: LoadState, images: PageImage[]) {
  if (state.status !== "success") {
    Toast.error("images not loaded yet");
    return;
  }

  if (images.length === 0) {
    Toast.warning("select images first");
    return;
  }

  Toast.info("preparing zip...");

  const response = await browser.runtime.sendMessage({
    type: "DOWNLOAD_IMAGES",
    images,
    zipName: `images_${state.tabId}`,
  } as DownloadImagesMessage);

  if (!response.ok) {
    Toast.error("Download failed: " + response.error);
    return;
  }

  Toast.success("Download successful");
}

async function copyImageURLs(state: LoadState, images: string[]) {
  if (state.status !== "success") {
    Toast.error("Images not loaded yet");
    return;
  }

  if (images.length === 0) {
    Toast.warning("Select images first");
    return;
  }

  try {
    const urls = images.join("\n");
    await navigator.clipboard.writeText(urls);
    Toast.success("URLs copied");
  } catch (error) {
    Toast.error(
      "Copy failed: " +
        (error instanceof Error ? error.message : "clipboard unavailable"),
    );
  }
}

function App() {
  const { loadState, loadImages } = usePageImages();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [topBarHeight, setTopBarHeight] = useState(0);
  const { filteredImages, filters, setFilters, widthBounds, heightBounds } =
    useImageFilters(loadState.images);
  const {
    selectedImages,
    toggleAll,
    isAllFilteredSelected,
    toggle,
    clearSelection,
    selectAll,
  } = useSelectedImages(filteredImages);

  // References are provided for the HideOnScrollHeader.
  const imageListRef = useRef<HTMLElement | null>(null);
  const topBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    clearSelection();
  }, [loadState]);

  useEffect(() => {
    if (!topBarRef.current) {
      return;
    }

    const updateTopBarHeight = () => {
      setTopBarHeight(topBarRef.current?.offsetHeight ?? 0);
    };
    updateTopBarHeight();

    const resizeObserver = new ResizeObserver(updateTopBarHeight);
    resizeObserver.observe(topBarRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const [isDownloading, runDownloadSelectedImages] = useAsyncLock(async () => {
    await downloadSelectedImages(
      loadState,
      loadState.images.filter((image) => selectedImages.has(image.src)),
    );
  }, [loadState, selectedImages]);

  const [isCopying, runCopySelectedImageUrls] = useAsyncLock(async () => {
    await copyImageURLs(loadState, Array.from(selectedImages));
  }, [loadState, selectedImages]);

  return (
    <main className="w-full h-screen overflow-hidden bg-slate-50 text-slate-950">
      <ToastProvider />
      <div
        className="fixed inset-x-0 top-0 z-40 bg-white shadow-sm"
        ref={topBarRef}
      >
        <HideOnScrollHeader scrollContainerRef={imageListRef}>
          <PopupHeader
            canSelectFilteredImages={filteredImages.length > 0}
            imageCount={filteredImages.length}
            isAllFilteredSelected={isAllFilteredSelected}
            selectedCount={selectedImages.size}
            state={loadState}
            onOpenControls={() => setIsPopupOpen(true)}
            onRefresh={() => void loadImages()}
            onToggleSelectFilteredImages={() => toggleAll()}
          />
        </HideOnScrollHeader>
        <section className="px-4 py-3 bg-white border-b grid grid-cols-2 gap-2 border-slate-200">
          <ActionButton
            disabled={selectedImages.size === 0 || isDownloading}
            icon={<LuDownload aria-hidden="true" className="w-4 h-4" />}
            label={isDownloading ? "Downloading..." : "Download ZIP"}
            onClick={() => void runDownloadSelectedImages()}
          />
          <ActionButton
            disabled={selectedImages.size === 0 || isCopying}
            icon={<LuCopy aria-hidden="true" className="w-4 h-4" />}
            label={isCopying ? "Copying..." : "Copy URLs"}
            onClick={() => void runCopySelectedImageUrls()}
          />
        </section>
      </div>
      <section
        className="h-full p-3 overflow-y-auto"
        ref={imageListRef}
        style={{ paddingTop: topBarHeight + 12 }}
      >
        {loadState.status === "loading" && (
          <StatusMessage title="loading" description="a moment please..." />
        )}

        {loadState.status === "empty" && (
          <StatusMessage
            title="Can't find images"
            description="there are no images on this page that can be displayed. Try refreshing."
          />
        )}

        {loadState.status === "error" && (
          <StatusMessage
            title={loadState.error}
            description="make sure the content script is properly injected and has permission to access the page"
          />
        )}

        {loadState.status === "success" && filteredImages.length === 0 && (
          <StatusMessage
            title="No matching images"
            description="adjust filters to show more results"
          />
        )}

        {loadState.status === "success" && filteredImages.length > 0 && (
          <ImageGrid
            images={filteredImages}
            selectedImages={selectedImages}
            onImageToggle={(image) => toggle(image.src)}
          />
        )}
      </section>
      <FilterView
        filters={filters}
        heightBounds={heightBounds}
        isOpen={isPopupOpen}
        resultCount={filteredImages.length}
        selectedCount={selectedImages.size}
        totalCount={loadState.images.length}
        widthBounds={widthBounds}
        onClearSelection={() => clearSelection()}
        onClose={() => setIsPopupOpen(false)}
        onFilterChange={setFilters}
        onSelectAll={() => selectAll()}
      />
    </main>
  );
}

function ActionButton({
  disabled,
  icon,
  label,
  onClick,
}: {
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex items-center justify-center px-3 text-sm font-semibold text-white min-h-11 gap-2 rounded-xl bg-slate-950 transition active:scale-95 active:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default App;
