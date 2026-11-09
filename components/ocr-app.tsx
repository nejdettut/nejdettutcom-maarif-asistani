"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload } from "lucide-react";

type Question = {
  number: string;
  stem: string;
  options?: string[];
  answerKeyHint?: string;
};

type OcrResult = {
  detected: boolean;
  confidence: "dusuk" | "orta" | "yuksek";
  rawText: string;
  questions: Question[];
  pageNotes: string[];
};

const MAX_BYTES = 10 * 1024 * 1024;

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy/90 disabled:opacity-50";
const CARD =
  "rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60";

const CONFIDENCE_LABEL: Record<OcrResult["confidence"], string> = {
  dusuk: "Düşük",
  orta: "Orta",
  yuksek: "Yüksek",
};

export function OcrApp() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function pickFile() {
    fileInputRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size === 0) {
      setError("Boş dosya.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Dosya 10 MB'tan büyük olamaz.");
      return;
    }
    setFile(f);
    setResult(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  async function run() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.set("image", file, file.name);
      const res = await fetch("/api/ocr", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as
        | OcrResult
        | { error: string };
      if (!res.ok || "error" in data) {
        setError(("error" in data && data.error) || "OCR işlemi başarısız oldu.");
        setLoading(false);
        return;
      }
      setResult(data as OcrResult);
    } catch {
      setError("Sunucuya ulaşılamadı. Tekrar dene.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className={`${CARD} p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Sınav kağıdı fotoğrafı yükle
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          jpg / png / webp · maks. 10 MB · saatte 10 OCR çağrısı. Gemini Vision
          sayfayı okur, soruları yapılandırır.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={pickFile} className={BTN_PRIMARY}>
            <Upload className="size-3.5" /> Dosya seç
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
          {file ? (
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {file.name} · {Math.round(file.size / 1024)} KB
            </span>
          ) : null}
          {file ? (
            <button
              type="button"
              onClick={run}
              disabled={loading}
              className={BTN_PRIMARY}
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Okunuyor…
                </>
              ) : (
                <>
                  <FileText className="size-3.5" /> OCR yap
                </>
              )}
            </button>
          ) : null}
        </div>
        {preview ? (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Yüklenen sınav"
              className="max-h-80 rounded-lg border border-slate-200 dark:border-slate-800"
            />
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:text-red-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {result ? (
        <div className={`${CARD} p-5 space-y-5`}>
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span className="text-sm font-semibold">
              {result.questions.length} soru algılandı
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Güven: {CONFIDENCE_LABEL[result.confidence]}
            </span>
          </div>

          {result.pageNotes.length > 0 ? (
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              <p className="font-semibold">Sayfa notları</p>
              <ul className="mt-1 list-disc pl-4">
                {result.pageNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <ol className="space-y-4">
            {result.questions.map((q, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="text-xs font-semibold text-brand-crimson">
                  Soru {q.number}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{q.stem}</p>
                {q.options && q.options.length > 0 ? (
                  <ul className="mt-2 space-y-0.5 text-xs text-slate-700 dark:text-slate-300">
                    {q.options.map((o, oi) => (
                      <li key={oi}>{o}</li>
                    ))}
                  </ul>
                ) : null}
                {q.answerKeyHint ? (
                  <p className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400">
                    Cevap anahtarı: {q.answerKeyHint}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>

          <details>
            <summary className="cursor-pointer text-xs font-semibold text-slate-500 dark:text-slate-400">
              Ham metin (OCR çıktısı)
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {result.rawText}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
