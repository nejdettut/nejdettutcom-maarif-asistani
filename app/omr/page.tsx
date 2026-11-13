import Link from "next/link";
import { OmrApp } from "@/components/omr-app";

export const metadata = {
  title: "OMR — AI Maarif Asistanı",
  description:
    "Optik cevap formu üret, öğrencilerin işaretlediği formu fotoğrafla okut; cevap anahtarıyla otomatik puanla. (MVP)",
};

export default function OmrPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-crimson">
            Modül 3 · MVP
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
            <span aria-hidden="true" className="text-3xl">🔘</span>
            OMR — Optik Okuma
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            A4 cevap formu PDF&apos;i üret, çıktısını al, öğrencilerin
            doldurduğu formları fotoğrafla okut. Cevap anahtarı verirsen
            otomatik puanlar.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
        >
          ← Soru Üretici&apos;ye dön
        </Link>
      </header>

      <OmrApp />

      <footer className="mt-20 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Modül 3 (MVP) · pdf-lib ile form üretimi · Gemini Vision ile okuma
      </footer>
    </main>
  );
}
