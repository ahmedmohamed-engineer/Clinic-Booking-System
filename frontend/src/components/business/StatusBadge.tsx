import { cn } from "@/lib/utils";

type StatusTone = "success" | "info" | "warning" | "danger" | "neutral";

const toneMap: Record<StatusTone, string> = {
  success: "border-status-success/25 bg-status-success/10 text-status-success",
  info: "border-status-info/25 bg-status-info/10 text-status-info",
  warning: "border-status-warning/25 bg-status-warning/10 text-status-warning",
  danger: "border-status-danger/25 bg-status-danger/10 text-status-danger",
  neutral: "border-status-neutral/25 bg-status-neutral/10 text-status-neutral",
};

const statusToneMap: Record<string, StatusTone> = {
  scheduled: "info",
  confirmed: "info",
  booked: "info",
  available: "success",
  completed: "success",
  paid: "success",
  pending: "warning",
  cancelled: "danger",
  failed: "danger",
  no_show: "neutral",
  refunded: "neutral",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = statusToneMap[status] ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        toneMap[tone],
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}