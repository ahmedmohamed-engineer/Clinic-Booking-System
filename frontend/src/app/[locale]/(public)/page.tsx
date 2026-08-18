import type { Metadata } from "next";
import { HeroSection } from "@/components/business/HeroSection";

export const metadata: Metadata = {
  title: "MediCare — Your  health journey, simplified",
  description:
    "Book appointments with top doctors, manage your schedule, and take control of your healthcare — all in one place.",
};

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroSection />
    </main>
  );
}
