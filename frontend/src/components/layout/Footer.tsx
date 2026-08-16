import { cn } from "@/lib/utils";
import { RxMark } from "./Logo";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-border px-6 py-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      <div className="mb-3 flex justify-center">
        <span className="letterhead-rule inline-flex items-center gap-2 px-6 pb-3">
          <RxMark className="size-5 text-xs" />
          <span className="heading-2">MediCare — Appointment prescription</span>
        </span>
      </div>
      &copy; {year} MediCare. All rights reserved.
    </footer>
  );
}