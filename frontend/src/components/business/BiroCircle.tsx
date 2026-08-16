import { cn } from "@/lib/utils";

interface BiroCircleProps {
  className?: string;
}

/**
 * The pen-circle: a hand-drawn biro loop used to mark the selected option.
 * The path deliberately doesn't close cleanly — the pen stops where it
 * started, with a slight overrun — so it reads as drawn, not printed.
 */
export function BiroCircle({ className }: BiroCircleProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      aria-hidden="true"
      className={cn("size-6 shrink-0", className)}
    >
      <path
        d="M14 2.8 C 21 2.8 25.4 7.4 25.4 14 C 25.4 20.6 20.9 25.2 14 25.2 C 7.3 25.2 2.6 20.7 2.6 14.1 C 2.6 8.4 6.4 4.4 11.8 3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}