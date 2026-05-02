interface Props {
  value: number; // 0-100
  color?: string;
  showLabel?: boolean;
}

export default function ProgressBar({
  value,
  color = "var(--ag-navy)",
  showLabel = true,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "var(--ag-border-light)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium w-9 text-right"
          
