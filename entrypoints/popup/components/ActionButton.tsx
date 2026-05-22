import { type ReactNode } from "react";

type ActionButtonProps = {
  disabled: boolean;
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  className?: string;
};

export function ActionButton({
  disabled,
  icon,
  label,
  onClick,
  variant = "primary",
  className = "",
}: ActionButtonProps) {
  const baseClasses =
    "flex items-center justify-center px-3 text-sm font-medium min-h-11 gap-2 rounded-xl transition-colors duration-150 disabled:cursor-not-allowed";

  const variantClasses =
    variant === "primary"
      ? "bg-slate-950 text-white active:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
      : "bg-slate-100 text-slate-700 active:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-300";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}