import type { Metadata } from "next";
import { DM_Sans, Newsreader, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SaludBot — Tus pacientes agendan por WhatsApp, a cualquier hora",
  description:
    "Asistente con IA para el WhatsApp de tu clínica: agenda citas, envía recordatorios y deja que el paciente confirme o reagende en el mismo chat. Piloto abierto para 10 clínicas fundadoras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${dmSans.variable} ${playfair.variable} ${newsreader.variable} ${jakarta.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
