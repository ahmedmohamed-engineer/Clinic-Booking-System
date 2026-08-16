import { cn } from "@/lib/utils";

interface SkeletonProps {
  variant?: "card" | "table" | "form" | "text" | "calendar";
  className?: string;
}

const variantClasses: Record<string, string> = {
  card: "h-44 w-full rounded-xl",
  table: "h-10 w-full rounded-lg",
  form: "h-9 w-full rounded-lg",
  text: "h-4 w-3/4 rounded",
  calendar: "h-64 w-full rounded-xl",
};

export function Skeleton({ variant = "text", className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "shimmer",
        variantClasses[variant] ?? variantClasses.text,
        className,
      )}
      aria-hidden="true"
    />
  );
}
