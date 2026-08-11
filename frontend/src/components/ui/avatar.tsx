"use client";

import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  className?: string;
  width?: number;
  height?: number;
}

export function Avatar({
  src,
  alt,
  fallback,
  className,
  width = 32,
  height = 32,
}: AvatarProps) {
  const resolvedSrc = mediaUrl(src);
  const sizeClass = className && /\bsize-\d+\b/.test(className) ? "" : "size-8";

  if (resolvedSrc) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt ?? fallback}
        width={width}
        height={height}
        unoptimized
        className={cn("rounded-full object-cover", sizeClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground select-none",
        sizeClass,
        className,
      )}
      aria-label={alt ?? fallback}
    >
      {getInitials(fallback)}
    </div>
  );
}