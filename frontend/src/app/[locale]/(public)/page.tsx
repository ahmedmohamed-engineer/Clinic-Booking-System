import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type Locale } from "@/i18n/config";
import { HeroSection } from "@/components/business/HeroSection";

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
    title: t("landingTitle"),
    description: t("landingDescription"),
  };
}

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroSection />
    </main>
  );
}