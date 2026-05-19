import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type HideOnScrollHeaderProps = {
  children: ReactNode;
  scrollContainerRef: RefObject<HTMLElement | null>;
};

const SCROLL_DIRECTION_THRESHOLD = 8;
const BOTTOM_BOUNCE_THRESHOLD = 16;

type HeaderVisibilityInput = {
  currentScrollTop: number;
  isNearBottom: boolean;
  isVisible: boolean;
  previousScrollTop: number;
};

export function getNextHeaderVisibility({
  currentScrollTop,
  isNearBottom,
  isVisible,
  previousScrollTop,
}: HeaderVisibilityInput) {
  if (currentScrollTop <= 0) {
    return true;
  }

  const delta = currentScrollTop - previousScrollTop;
  const absDelta = Math.abs(delta);

  if (isNearBottom && absDelta < BOTTOM_BOUNCE_THRESHOLD) {
    return isVisible;
  }

  if (absDelta < SCROLL_DIRECTION_THRESHOLD) {
    return isVisible;
  }

  return delta < 0;
}

export function HideOnScrollHeader({
  children,
  scrollContainerRef,
}: HideOnScrollHeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [contentHeight, setContentHeight] = useState<number>();
  const contentRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    const updateHeight = () => setContentHeight(content.offsetHeight);
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(content);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    lastScrollTopRef.current = scrollContainer.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop;
      const previousScrollTop = lastScrollTopRef.current;
      const maxScrollTop =
        scrollContainer.scrollHeight - scrollContainer.clientHeight;
      const isNearBottom =
        maxScrollTop > 0 &&
        maxScrollTop - currentScrollTop <= BOTTOM_BOUNCE_THRESHOLD;
      const nextVisible = getNextHeaderVisibility({
        currentScrollTop,
        isNearBottom,
        isVisible: isVisibleRef.current,
        previousScrollTop,
      });

      if (nextVisible !== isVisibleRef.current) {
        isVisibleRef.current = nextVisible;
        setIsVisible(nextVisible);
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef]);

  return (
    <div
      className={`overflow-hidden transition-[max-height,transform] duration-200 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{ maxHeight: isVisible ? contentHeight : 0 }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
