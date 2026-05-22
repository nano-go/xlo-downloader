import { useEffect, useRef, type ReactNode } from "react";

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
    <div
      role="dialog"
      className="fixed inset-0 z-50 flex items-end overflow-hidden overscroll-none bg-black/40 backdrop-blur-sm"
    >
      <button
        aria-label={`Close ${title}`}
        className="absolute inset-0 w-full h-full cursor-default touch-none"
        ref={backdropRef}
        type="button"
        onClick={onClose}
      />

      <section className="relative max-h-[calc(100vh-24px)] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-slate-200/80 bg-white px-4 pb-4 pt-3 shadow-2xl">
        <div className="w-10 h-1 mx-auto mb-2 rounded-full bg-slate-300" />

        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <h2 className="text-base font-semibold leading-6 text-slate-950">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>
          <button
            className="px-3 text-sm font-medium min-h-11 rounded-xl text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
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
