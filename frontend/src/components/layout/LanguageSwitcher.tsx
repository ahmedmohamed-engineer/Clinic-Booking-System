"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Bilingual switch: flips the whole document between the English sheet and
 *  the Arabic sheet without a full navigation, keeping the visitor on the
 *  same route. English reads "عربي" (the language you switch to), Arabic
 *  reads "EN". */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const pathname = usePathname();

  const nextLocale = locale === "ar" ? "en" : "ar";
  const label = nextLocale === "ar" ? t("arabic") : t("english");
  const ariaLabel =
    nextLocale === "ar" ? t("switchToArabic") : t("switchToEnglish");

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="text-sm font-semibold"
    >
      {label}
    </Button>
  );
}