import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type BottomSheetProps = {
  children: ReactNode;
  description?: string;
  doneLabel?: string;
  isOpen: boolean;
  title: string;
  onClose: () => void;
};

export function BottomSheet({
  children,
  description,
  doneLabel = "Done",
  isOpen,
  title,
  onClose,
}: BottomSheetProps) {
  const backdropRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousDocumentOverflow = documentElement.style.overflow;

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !backdropRef.current) {
      return;
    }

    const backdrop = backdropRef.current;
    const preventBackgroundScroll = (event: Event) => {
      event.preventDefault();
    };

    backdrop.addEventListener("touchmove", preventBackgroundScroll, {
      passive: false,
    });
    backdrop.addEventListener("wheel", preventBackgroundScroll, {
      passive: false,
    });

    return () => {
      backdrop.removeEventListener("touchmove", preventBackgroundScroll);
      backdrop.removeEventListener("wheel", preventBackgroundScroll);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end overflow-hidden overscroll-none bg-slate-950/35">
      <button
        aria-label={`Close ${title}`}
        className="absolute inset-0 h-full w-full cursor-default touch-none"
        ref={backdropRef}
        type="button"
        onClick={onClose}
      />

      <section className="relative max-h-[calc(100vh-24px)] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-slate-200 bg-white px-4 pb-4 pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold leading-6 text-slate-950">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>
          <button
            className="min-h-11 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
            type="button"
            onClick={onClose}
          >
            {doneLabel}
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}
