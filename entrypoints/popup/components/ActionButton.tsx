import { type ReactNode } from "react";

type ActionButtonProps = {
  disabled: boolean;
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
};

export function ActionButton({
  disabled,
  icon,
  label,
  onClick,
  className = "",
}: ActionButtonProps) {
  return (
    <button
      className={`flex items-center justify-center px-3 text-sm font-semibold text-white min-h-11 gap-2 rounded-xl bg-slate-950 transition active:scale-95 active:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${className}`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
