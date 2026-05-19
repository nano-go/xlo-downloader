import { useEffect, useState } from "react";
import {
  LuCircleCheck,
  LuCircleAlert,
  LuInfo,
  LuTriangleAlert,
} from "react-icons/lu";

export type ToastType = "success" | "error" | "warning" | "info";
export type ToastPosition = "top" | "center" | "bottom";

export type ToastOptions = {
  duration?: number;
  position?: ToastPosition;
};

export type ToastItem = {
  duration: number;
  id: string;
  message: string;
  position: ToastPosition;
  type: ToastType;
};

type ToastListener = (toast: ToastItem) => void;

export const DEFAULT_TOAST_DURATION = 2500;

const listeners = new Set<ToastListener>();

export const Toast = {
  success(message: string, options?: ToastOptions) {
    return showToast("success", message, options);
  },
  error(message: string, options?: ToastOptions) {
    return showToast("error", message, options);
  },
  warning(message: string, options?: ToastOptions) {
    return showToast("warning", message, options);
  },
  info(message: string, options?: ToastOptions) {
    return showToast("info", message, options);
  },
};

export function subscribeToToasts(listener: ToastListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToToasts((toast) => {
      setToasts((current) => [...current, toast]);

      if (toast.duration > 0) {
        window.setTimeout(() => {
          setToasts((current) =>
            current.filter((currentToast) => currentToast.id !== toast.id),
          );
        }, toast.duration);
      }
    });
  }, []);

  return (
    <>
      {(["top", "center", "bottom"] as const).map((position) => {
        const positionedToasts = toasts.filter(
          (toast) => toast.position === position,
        );

        if (positionedToasts.length === 0) {
          return null;
        }

        return (
          <div
            className={`pointer-events-none fixed inset-x-3 z-60 flex flex-col gap-2 ${getPositionClass(
              position,
            )}`}
            key={position}
          >
            {positionedToasts.map((toast) => (
              <ToastMessage key={toast.id} toast={toast} />
            ))}
          </div>
        );
      })}
    </>
  );
}

function showToast(type: ToastType, message: string, options?: ToastOptions) {
  const toast: ToastItem = {
    duration: options?.duration ?? DEFAULT_TOAST_DURATION,
    id: crypto.randomUUID(),
    message,
    position: options?.position ?? "bottom",
    type,
  };

  for (const listener of listeners) {
    listener(toast);
  }

  return toast.id;
}

function ToastMessage({ toast }: { toast: ToastItem }) {
  const Icon = toastIcons[toast.type];

  return (
    <div
      className={`pointer-events-auto flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium shadow-lg ${toastStyles[toast.type]}`}
      role="status"
    >
      <Icon aria-hidden="true" className="w-5 h-5 shrink-0" />
      <span>{toast.message}</span>
    </div>
  );
}

function getPositionClass(position: ToastPosition) {
  if (position === "top") {
    return "top-3";
  }

  if (position === "center") {
    return "top-1/2 -translate-y-1/2";
  }

  return "bottom-3";
}

const toastIcons = {
  success: LuCircleCheck,
  error: LuCircleAlert,
  warning: LuTriangleAlert,
  info: LuInfo,
};

const toastStyles = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};
