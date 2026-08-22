"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Bilingual switch: flips the whole document between the English sheet and
 *  the Arabic sheet without a full navigation, keeping the visitor on the
 *  same route. English reads "عربي" (the language you switch to), Arabic
 *  reads "EN".
 *
 *  The flip is optimized for the visitor's place: search params and hash
 *  survive it (`/login?redirect=…` keeps its redirect), the alternate-locale
 *  document is prefetched on hover/focus so the switch is instant, the click
 *  runs inside a transition that disables the button until the new document
 *  is ready (no double-toggle flicker), and the button declares the label's
 *  own `lang` so screen readers pronounce "عربي" with the Arabic voice. */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale = locale === "ar" ? "en" : "ar";
  const label = nextLocale === "ar" ? t("arabic") : t("english");
  const ariaLabel =
    nextLocale === "ar" ? t("switchToArabic") : t("switchToEnglish");

  /** The full current URL minus its locale prefix. `usePathname` drops
   *  search and hash, so they are read from the address bar — at
   *  interaction time, never during render, to keep SSR safe. */
  function currentHref() {
    return `${pathname}${window.location.search}${window.location.hash}`;
  }

  function switchToNextLocale() {
    startTransition(() => {
      router.replace(currentHref(), { locale: nextLocale });
    });
  }

  function prefetchNextLocale() {
    router.prefetch(currentHref(), { locale: nextLocale });
  }

  return (
    <Button
      variant="ghost"
      size="default"
      className="px-2 text-sm font-semibold max-sm:px-1 max-sm:text-xs"
      onClick={switchToNextLocale}
      onMouseEnter={prefetchNextLocale}
      onFocus={prefetchNextLocale}
      disabled={isPending}
      aria-busy={isPending}
      lang={nextLocale}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {label}
    </Button>
  );
}