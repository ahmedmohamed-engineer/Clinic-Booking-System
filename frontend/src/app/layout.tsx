import type { Metadata } from "next";
import { Archivo, Kalam } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { TooltipProvider } from "@/components/ui/tooltip";

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

export const metadata: Metadata = {
  title: "MediCare - Clinic Booking System",
  description: "Book appointments with healthcare professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${kalam.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        {/* THESIS: Booking is a prescription — an explicit, trustworthy document that converts care into action; the familiar doctor-list-grid-and-blue SaaS register is refused for a sheet you watch being written and stamped.
             OWN-WORLD: cream paper ground with hairline ink rules, white sheets, ink-blue print (#16325c), one red rubber-stamp action (#d9553d), pharmacy green for availability, carbon-copy confirmation; Archivo letterhead type, Kalam for inked annotations.
             STORY: The patient steps up to the desk; the prescription is written line by line (clinic, specialty, doctor, time) and the red stamp falls — care, converted into an appointment.
             FIRST VIEWPORT: A prescription sheet fills the hero — MediCare as the letterhead, the booking steps as ruled lines being written, a rubber-stamp primary action, and the mock day sheet floating with its carbon copy.
             FORM: The Prescription Pad (Roshita) — the assigned direction (roll #1 of the new-world deal, seed "assigned"); challengers weighed: Appointment Ledger (familiar), Film Cutting Bench (competitive), Orienteering Course (competitive), Hall Catalog (declined; pen-circle kept).
             FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md. */}
        <TooltipProvider>
          <Providers>{children}</Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
