import type { Metadata } from "next";
import {
  Archivo,
  Kalam,
  IBM_Plex_Sans_Arabic,
  Aref_Ruqaa,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { isRtlLocale, type Locale } from "@/i18n/config";
import "../globals.css";
import { Providers } from "./providers";
import { TooltipProvider } from "@/components/ui/tooltip";

/* English letterhead: Archivo everywhere, Kalam for the handwritten ink. */
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

const kalam = Kalam({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-kalam",
});

/* Arabic letterhead: IBM Plex Sans Arabic carries the print roles; Aref
   Ruqaa is the hand that writes on the sheet — the Arabic sibling of
   Kalam, a ruqaa script for the inked annotations. The globals.css rules
   swap the Archivo/Kalam variables for these on html[lang="ar"], so every
   component keeps its font role without knowing about locales. */
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-ibm-plex-sans-arabic",
});

const arefRuqaa = Aref_Ruqaa({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-aref-ruqaa",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "meta",
  });

  return {
    title: t("baseTitle"),
    description: t("baseDescription"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${archivo.variable} ${kalam.variable} ${ibmPlexSansArabic.variable} ${arefRuqaa.variable} h-full antialiased dark`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        {/* Day/Night: the Prescription Pad opens on the night desk by default.
            The dark class is baked into the server-rendered <html>, so the
            first paint is always the dark desk and no inline script is needed
            before hydration. The client ThemeProvider then applies the stored
            theme (hf_theme) the moment it hydrates. This keeps the default
            paint flash-free and avoids rendering an executable inline script
            in React's client tree. */}
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        {/* THESIS: Booking is a prescription — an explicit, trustworthy document that converts care into action; the familiar doctor-list-grid-and-blue SaaS register is refused for a sheet you watch being written and stamped.
             OWN-WORLD: cream paper ground with hairline ink rules, white sheets, ink-blue print (#16325c), one red rubber-stamp action (#d9553d), pharmacy green for availability, carbon-copy confirmation; Archivo letterhead type, Kalam for inked annotations.
             STORY: The patient steps up to the desk; the prescription is written line by line (clinic, specialty, doctor, time) and the red stamp falls — care, converted into an appointment.
             FIRST VIEWPORT: A prescription sheet fills the hero — MediCare as the letterhead, the booking steps as ruled lines being written, a rubber-stamp primary action, and the mock day sheet floating with its carbon copy.
             FORM: The Prescription Pad (Roshita) — the assigned direction (roll #1 of the new-world deal, seed "assigned"); challengers weighed: Appointment Ledger (familiar), Film Cutting Bench (competitive), Orienteering Course (competitive), Hall Catalog (declined; pen-circle kept).
             FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.
             I18N: the same pad is written twice — English with as-needed prefixes (/, /login) and Arabic under /ar with the document flipped to RTL; IBM Plex Sans Arabic is the Arabic Archivo, Aref Ruqaa the Arabic Kalam. */}
        <TooltipProvider>
          <NextIntlClientProvider messages={messages}>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}