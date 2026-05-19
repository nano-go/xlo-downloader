type StatusMessageProps = {
  title: string;
  description: string;
};

export function StatusMessage({ title, description }: StatusMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center bg-white border border-dashed rounded-lg min-h-55 border-slate-300">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}
