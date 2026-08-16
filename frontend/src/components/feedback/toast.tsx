import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import type { Toast as ToastData, ToastType } from "@/lib/toast-store";
import { dismissToast } from "@/lib/toast-store";
import { cn } from "@/lib/utils";

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap: Record<ToastType, string> = {
  success: "border-status-success/25 bg-status-success/10 text-status-success",
  error: "border-status-danger/25 bg-status-danger/10 text-status-danger",
  info: "border-status-info/25 bg-status-info/10 text-status-info",
  warning: "border-status-warning/25 bg-status-warning/10 text-status-warning",
};

export function Toast({ toast }: { toast: ToastData }) {
  const Icon = iconMap[toast.type];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg",
        colorMap[toast.type],
      )}
      role={toast.type === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm text-on-surface">{toast.message}</p>
      <button
        onClick={() => dismissToast(toast.id)}
        className="shrink-0 rounded p-0.5 text-on-surface-variant outline-none transition-colors hover:text-on-surface focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
