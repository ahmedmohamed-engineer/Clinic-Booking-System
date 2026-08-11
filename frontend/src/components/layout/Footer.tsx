import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-border px-6 py-4 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      &copy; {year} MediCare. All rights reserved.
    </footer>
  );
}
