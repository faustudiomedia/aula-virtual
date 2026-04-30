interface Props {
  value: number; // 0-100
  color?: string;
  showLabel?: boolean;
}

export default function ProgressBar({
  value,
  color = "#1A56DB",
  showLabel = true,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#BAE6FD]/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-[#050F1F]/60 w-9 text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
}
