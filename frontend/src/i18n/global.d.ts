import en from "../../messages/en.json";

/**
 * Global type augmentation for next-intl.
 *
 * Pins the app's message shape (the English catalog is the source of
 * truth) so every `t("...")` call, useTranslations namespace and
 * `useLocale()` is checked at compile time: a mistyped key or a locale
 * string that does not exist fails `tsc`, not the browser.
 */
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof en;
    Locale: "en" | "ar";
  }
}

export {};