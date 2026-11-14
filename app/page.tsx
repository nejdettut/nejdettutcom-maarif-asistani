import Link from "next/link";
import { MaarifApp } from "@/components/maarif-app";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-crimson">
            Yapay Zekâ Projesi · MVP
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
            <span aria-hidden="true" className="text-3xl">
              🎓
            </span>
            AI Maarif Asistanı
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            Konu, sınıf seviyesi, zorluk ve soru tipini seç — yapay zekâ Bloom
            taksonomisine göre sınav soruları üretir. Cevap anahtarı + çözüm +
            Word belgesi dahil.
          </p>
        </div>
        <a
          href="https://www.nejdettut.com/projeler/maarif-suite"
          className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100"
        >
          ← nejdettut.com&apos;a dön
        </a>
      </header>

      <section className="mb-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/ocr"
          className="group flex flex-col justify-between rounded-2xl border border-brand-crimson/30 bg-gradient-to-br from-brand-crimson/10 via-white to-white p-5 shadow-sm backdrop-blur transition hover:border-brand-crimson/60 hover:shadow-md dark:border-brand-crimson/40 dark:from-brand-crimson/15 dark:via-slate-900/60 dark:to-slate-900/60"
        >
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span aria-hidden="true" className="text-3xl">📄</span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-crimson">
                  Modül 2
                </p>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Kağıt Sınav OCR
                </h2>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Elindeki yazılı sınavı fotoğrafla, yapay zeka soru listesini, şıkları
              ve işaretli doğru cevapları çıkarsın. Türkçe karakterler korunur.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-crimson transition group-hover:translate-x-0.5">
            OCR'a geç →
          </span>
        </Link>

        <Link
          href="/omr"
          className="group flex flex-col justify-between rounded-2xl border border-brand-crimson/30 bg-gradient-to-br from-brand-crimson/10 via-white to-white p-5 shadow-sm backdrop-blur transition hover:border-brand-crimson/60 hover:shadow-md dark:border-brand-crimson/40 dark:from-brand-crimson/15 dark:via-slate-900/60 dark:to-slate-900/60"
        >
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span aria-hidden="true" className="text-3xl">🔘</span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-crimson">
                  Modül 3 · Yeni
                </p>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Optik Okuma (OMR)
                </h2>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Standart cevap formu PDF&apos;ini üret, çıktısını al, doldurulmuş
              formu fotoğrafla okut; cevap anahtarıyla saniyeler içinde puanla.
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-crimson transition group-hover:translate-x-0.5">
            OMR&apos;a geç →
          </span>
        </Link>
      </section>

      <MaarifApp />

      <footer className="mt-20 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Bir{" "}
        <a
          href="https://www.nejdettut.com"
          className="font-medium underline-offset-2 hover:underline"
        >
          nejdettut.com
        </a>{" "}
        yapay zekâ projesi · Groq · Next.js · Eğitim amaçlıdır.
      </footer>
    </main>
  );
}
