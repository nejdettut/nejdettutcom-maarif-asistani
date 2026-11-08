import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Maarif Asistanı — nejdettut.com",
  description:
    "Konu + sınıf + zorluk seçimiyle Bloom seviyeli sınav soruları üret; cevap anahtarı + çözüm + Word (.docx) olarak dışa aktar.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
