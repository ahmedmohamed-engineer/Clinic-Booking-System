"use client";

import { useEffect, useState } from "react";
import { subscribe, type Toast } from "@/lib/toast-store";
import { Toast as ToastItem } from "./toast";

const EXIT_DURATION_MS = 150;

interface ToastItemState {
  toast: Toast;
  leaving: boolean;
}

export function Toaster() {
  const [items, setItems] = useState<ToastItemState[]>([]);

  useEffect(() => {
    let ordered: Toast[] = [];
    const timers = new Map<string, number>();

    const unsubscribe = subscribe((newToasts) => {
      const nextIds = new Set(newToasts.map((t) => t.id));
      const leaving = ordered.filter((t) => !nextIds.has(t.id));

      ordered = [...newToasts, ...leaving];

      for (const t of leaving) {
        if (timers.has(t.id)) continue;
        const timerId = window.setTimeout(() => {
          timers.delete(t.id);
          ordered = ordered.filter((x) => x.id !== t.id);
          setItems(ordered.map((x) => ({ toast: x, leaving: timers.has(x.id) })));
        }, EXIT_DURATION_MS);
        timers.set(t.id, timerId);
      }

      setItems(ordered.map((t) => ({ toast: t, leaving: timers.has(t.id) })));
    });

    return () => {
      unsubscribe();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {items.map(({ toast, leaving }) => (
        <div
          key={toast.id}
          className={
            leaving
              ? "pointer-events-none animate-out fade-out slide-out-to-right duration-150 ease-in motion-reduce:animate-none"
              : "pointer-events-auto animate-in slide-in-from-right duration-150 ease-out motion-reduce:animate-none"
          }
        >
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
