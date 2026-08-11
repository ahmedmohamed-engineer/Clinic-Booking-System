import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Logo } from "./Logo";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center border-b border-border px-6">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
