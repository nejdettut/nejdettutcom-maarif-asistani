"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  Loader2,
  ScanLine,
  Upload,
} from "lucide-react";

type Marked = "A" | "B" | "C" | "D" | "E" | "BOS" | "COKLU";

type ScoreCell = {
  number: number;
  student: Marked;
  correct: "A" | "B" | "C" | "D" | "E";
  status: "dogru" | "yanlis" | "bos" | "coklu";
};

type Summary = {
  dogru: number;
  yanlis: number;
  bos: number;
  coklu: number;
  yuzde: number;
};

type OmrResult = {
  detected: boolean;
  confidence: "dusuk" | "orta" | "yuksek";
  studentName?: string;
  studentNumber?: string;
  answers: Array<{ number: number; marked: Marked }>;
  pageNotes?: string[];
  scored: ScoreCell[] | null;
  summary: Summary | null;
  questionCount: number;
};

const MAX_BYTES = 10 * 1024 * 1024;

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy/90 disabled:opacity-50";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900";
const CARD =
  "rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60";

const CONFIDENCE_LABEL: Record<OmrResult["confidence"], string> = {
  dusuk: "Düşük",
  orta: "Orta",
  yuksek: "Yüksek",
};

const STATUS_STYLES: Record<ScoreCell["status"], string> = {
  dogru: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  yanlis: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  bos: "bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400",
  coklu: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export function OmrApp() {
  const [count, setCount] = useState(20);
  const [title, setTitle] = useState("Sınav Formu");
  const [sinif, setSinif] = useState("");
  const [answerKey, setAnswerKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OmrResult | null>(null);
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

  function downloadForm() {
    const params = new URLSearchParams({
      count: String(count),
      title: title || "Sınav Formu",
      ...(sinif ? { sinif } : {}),
    });
    window.open(`/api/omr/form?${params.toString()}`, "_blank");
  }

  async function run() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.set("image", file, file.name);
      form.set("count", String(count));
      if (answerKey.trim()) form.set("answerKey", answerKey.trim());
      const res = await fetch("/api/omr/okut", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as
        | OmrResult
        | { error: string };
      if (!res.ok || "error" in data) {
        setError(("error" in data && data.error) || "OMR işlemi başarısız oldu.");
        setLoading(false);
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Beklenmeyen hata.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 1: form settings */}
      <section className={CARD + " p-5"}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          1. Form ayarları
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">
              Soru sayısı (5–50)
            </span>
            <input
              type="number"
              min={5}
              max={50}
              value={count}
              onChange={(e) =>
                setCount(Math.min(50, Math.max(5, Number(e.target.value) || 20)))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">
              Form başlığı
            </span>
            <input
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">
              Sınıf / şube (opsiyonel)
            </span>
            <input
              value={sinif}
              maxLength={40}
              onChange={(e) => setSinif(e.target.value)}
              placeholder="ör. 7-A"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
        </div>
        <div className="mt-4">
          <button type="button" onClick={downloadForm} className={BTN_PRIMARY}>
            <FileDown className="size-4" />
            OMR formunu PDF indir
          </button>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Yazıcıdan A4 kâğıda çıktı alın. Öğrenciler kurşun kalemle tek
            yuvarlağı doldurur.
          </p>
        </div>
      </section>

      {/* Step 2: upload + answer key */}
      <section className={CARD + " p-5"}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
          2. Cevap anahtarı + doldurulmuş form fotoğrafı
        </h2>
        <label className="block text-xs">
          <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">
            Cevap anahtarı
          </span>
          <input
            value={answerKey}
            onChange={(e) => setAnswerKey(e.target.value)}
            placeholder="ör. A B C D A B C D A B (sıra ile) ya da 1:A, 2:B, 3:C ..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-crimson focus:outline-none focus:ring-2 focus:ring-brand-crimson/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <span className="mt-1 block text-slate-500 dark:text-slate-400">
            Boş bırakılırsa sadece hangi şıkların işaretlendiği tespit edilir,
            puan hesaplanmaz.
          </span>
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />
          <button type="button" onClick={pickFile} className={BTN_SECONDARY}>
            <Upload className="size-4" />
            {file ? "Fotoğrafı değiştir" : "Form fotoğrafı seç"}
          </button>
          <button
            type="button"
            onClick={run}
            disabled={!file || loading}
            className={BTN_PRIMARY}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Okunuyor…
              </>
            ) : (
              <>
                <ScanLine className="size-4" />
                Formu okut
              </>
            )}
          </button>
          {file ? (
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          ) : null}
        </div>

        {preview ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Form önizlemesi"
              className="mx-auto max-h-80 w-auto"
            />
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {result ? (
        <section className={CARD + " p-5"}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Okuma tamamlandı · Güven: {CONFIDENCE_LABEL[result.confidence]}
            </h2>
            {result.studentName || result.studentNumber ? (
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {result.studentName ?? ""}
                {result.studentNumber ? ` · No ${result.studentNumber}` : ""}
              </span>
            ) : null}
          </div>

          {result.summary ? (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <SummaryTile label="Doğru" value={result.summary.dogru} tone="emerald" />
              <SummaryTile label="Yanlış" value={result.summary.yanlis} tone="rose" />
              <SummaryTile label="Boş" value={result.summary.bos} tone="slate" />
              <SummaryTile label="Çoklu" value={result.summary.coklu} tone="amber" />
              <SummaryTile
                label="Yüzde"
                value={`%${result.summary.yuzde}`}
                tone="navy"
              />
            </div>
          ) : null}

          {result.scored ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Öğrenci</th>
                    <th className="px-3 py-2 font-medium">Doğru</th>
                    <th className="px-3 py-2 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {result.scored.map((c) => (
                    <tr
                      key={c.number}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">
                        {c.number}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-slate-900 dark:text-slate-100">
                        {c.student}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-slate-500 dark:text-slate-400">
                        {c.correct}
                      </td>
                      <td className="px-3 py-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[c.status]}`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">İşaretlenen</th>
                  </tr>
                </thead>
                <tbody>
                  {result.answers.map((a) => (
                    <tr
                      key={a.number}
                      className="border-t border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">
                        {a.number}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-slate-900 dark:text-slate-100">
                        {a.marked}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.pageNotes && result.pageNotes.length ? (
            <ul className="mt-4 list-disc pl-5 text-xs text-slate-500 dark:text-slate-400">
              {result.pageNotes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

type Tone = "emerald" | "rose" | "slate" | "amber" | "navy";
const TONE_STYLES: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  navy: "bg-slate-900 text-white dark:bg-slate-700",
};

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: Tone;
}) {
  return (
    <div className={`rounded-xl px-3 py-2 text-center ${TONE_STYLES[tone]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-bold tabular-nums">{value}</div>
    </div>
  );
}
