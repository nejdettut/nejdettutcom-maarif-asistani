"use client";

import { useState } from "react";
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  { value: "matematik", label: "Matematik" },
  { value: "fen-bilimleri", label: "Fen Bilimleri" },
  { value: "fizik", label: "Fizik" },
  { value: "kimya", label: "Kimya" },
  { value: "biyoloji", label: "Biyoloji" },
  { value: "turkce", label: "Türkçe" },
  { value: "edebiyat", label: "Edebiyat" },
  { value: "sosyal-bilgiler", label: "Sosyal Bilgiler" },
  { value: "tarih", label: "Tarih" },
  { value: "cografya", label: "Coğrafya" },
  { value: "ingilizce", label: "İngilizce" },
  { value: "bilisim", label: "Bilişim" },
  { value: "din-kultur", label: "Din Kültürü" },
  { value: "diger", label: "Diğer…" },
] as const;

const GRADES = [
  { value: "ilkokul-1", label: "1. Sınıf" },
  { value: "ilkokul-2", label: "2. Sınıf" },
  { value: "ilkokul-3", label: "3. Sınıf" },
  { value: "ilkokul-4", label: "4. Sınıf" },
  { value: "ortaokul-5", label: "5. Sınıf" },
  { value: "ortaokul-6", label: "6. Sınıf" },
  { value: "ortaokul-7", label: "7. Sınıf" },
  { value: "ortaokul-8", label: "8. Sınıf" },
  { value: "lise-9", label: "9. Sınıf (Lise)" },
  { value: "lise-10", label: "10. Sınıf (Lise)" },
  { value: "lise-11", label: "11. Sınıf (Lise)" },
  { value: "lise-12", label: "12. Sınıf (Lise)" },
] as const;

const DIFFICULTIES = [
  { value: "kolay", label: "Kolay" },
  { value: "orta", label: "Orta" },
  { value: "zor", label: "Zor" },
  { value: "karisik", label: "Karışık" },
] as const;

const QUESTION_TYPES = [
  { value: "coktan-secmeli", label: "Çoktan seçmeli" },
  { value: "acik-uclu", label: "Açık uçlu" },
  { value: "karisik", label: "Karışık" },
] as const;

type Subject = (typeof SUBJECTS)[number]["value"];
type Grade = (typeof GRADES)[number]["value"];
type Difficulty = (typeof DIFFICULTIES)[number]["value"];
type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

type Question = {
  kind: "coktan-secmeli" | "acik-uclu";
  stem: string;
  options?: string[];
  correctIndex?: number;
  expectedAnswer?: string;
  solution: string;
  difficulty: "kolay" | "orta" | "zor";
  bloomLevel:
    | "hatirla"
    | "anla"
    | "uygula"
    | "analiz"
    | "degerlendir"
    | "yarat";
};

type Exam = {
  title: string;
  instructions: string;
  questions: Question[];
  answerKey: string[];
  meta: {
    subject: Subject;
    subjectLabel: string;
    grade: Grade;
    gradeLabel: string;
    topic: string;
    difficulty: Difficulty;
    difficultyLabel: string;
  };
};

const OPTION_LETTERS = ["A", "B", "C", "D"];

const BLOOM_LABEL: Record<Question["bloomLevel"], string> = {
  hatirla: "Hatırla",
  anla: "Anla",
  uygula: "Uygula",
  analiz: "Analiz",
  degerlendir: "Değerlendir",
  yarat: "Yarat",
};

const DIFF_STYLE: Record<Question["difficulty"], string> = {
  kolay: "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
  orta: "border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-300",
  zor: "border-rose-400/40 bg-rose-400/10 text-rose-700 dark:text-rose-300",
};

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy/90 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-crimson focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-crimson dark:text-white";

const BTN_OUTLINE =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm backdrop-blur transition hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900";

const CARD =
  "rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60";

const MUTED_TEXT = "text-slate-500 dark:text-slate-400";

const EXAMPLES: Array<{
  label: string;
  subject: Subject;
  grade: Grade;
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  count: number;
}> = [
  {
    label: "Matematik · 6",
    subject: "matematik",
    grade: "ortaokul-6",
    topic: "Kesirlerle toplama ve çıkarma",
    difficulty: "orta",
    questionType: "coktan-secmeli",
    count: 10,
  },
  {
    label: "Fen · 8",
    subject: "fen-bilimleri",
    grade: "ortaokul-8",
    topic: "Basınç ve basınç kuvveti",
    difficulty: "orta",
    questionType: "karisik",
    count: 8,
  },
  {
    label: "Türkçe · 7",
    subject: "turkce",
    grade: "ortaokul-7",
    topic: "Metin türleri ve anlatım biçimleri",
    difficulty: "kolay",
    questionType: "coktan-secmeli",
    count: 10,
  },
];

export function MaarifApp() {
  const [subject, setSubject] = useState<Subject>("matematik");
  const [customSubject, setCustomSubject] = useState("");
  const [grade, setGrade] = useState<Grade>("ortaokul-6");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("orta");
  const [questionType, setQuestionType] = useState<QuestionType>("coktan-secmeli");
  const [count, setCount] = useState<number>(10);
  const [learningObjectives, setLearningObjectives] = useState("");
  const [showAnswers, setShowAnswers] = useState(true);
  const [showSolutions, setShowSolutions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);

  async function run() {
    if (topic.trim().length < 3) {
      setError("Konu en az 3 karakter olmalı.");
      return;
    }
    setLoading(true);
    setError(null);
    setExam(null);
    try {
      const r = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          customSubject: subject === "diger" ? customSubject : undefined,
          grade,
          topic,
          difficulty,
          questionType,
          count,
          learningObjectives: learningObjectives || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) setError(data.error ?? "Bilinmeyen hata.");
      else setExam(data as Exam);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ağ hatası.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocx() {
    if (!exam) return;
    setExporting(true);
    setError(null);
    try {
      const r = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: {
            title: exam.title,
            instructions: exam.instructions,
            questions: exam.questions,
            answerKey: exam.answerKey,
          },
          meta: exam.meta,
          withAnswerKey: showAnswers,
          withSolutions: showSolutions,
        }),
      });
      if (!r.ok) {
        setError("Word belgesi üretilemedi.");
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = exam.meta.topic
        .replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ _-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .slice(0, 40) || "sinav";
      a.download = `${slug}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "İndirme hatası.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Input column */}
      <div className="space-y-4 lg:col-span-2">
        <div className={CARD}>
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <ScrollText className="size-4 text-brand-crimson" />
              Sınav bilgisi
            </h2>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <p className={cn("mb-2 text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                Hazır örnekler
              </p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => {
                      setSubject(ex.subject);
                      setGrade(ex.grade);
                      setTopic(ex.topic);
                      setDifficulty(ex.difficulty);
                      setQuestionType(ex.questionType);
                      setCount(ex.count);
                    }}
                    className="rounded-full border border-slate-300 bg-white/70 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                  Ders
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                  Sınıf
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as Grade)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {GRADES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {subject === "diger" ? (
              <div>
                <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                  Ders adını yaz
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="örn: Görsel Sanatlar"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            ) : null}

            <div>
              <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                Konu
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="örn: Kesirlerle toplama ve çıkarma"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                  Zorluk
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                  Soru tipi
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {QUESTION_TYPES.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                Soru sayısı ({count})
              </label>
              <input
                type="range"
                min={3}
                max={25}
                step={1}
                value={count}
                onChange={(e) => setCount(Number.parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>

            <div>
              <label className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                Hedef kazanımlar (opsiyonel)
              </label>
              <textarea
                value={learningObjectives}
                onChange={(e) => setLearningObjectives(e.target.value)}
                placeholder="örn: Kesirleri ortak paydaya getirir, farklı paydalı kesirleri toplar"
                className="block h-20 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={run}
              disabled={loading || topic.length < 3}
              className={BTN_PRIMARY}
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Sorular üretiliyor…
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  Sınavı üret
                </>
              )}
            </button>

            <p className={cn("text-[11px]", MUTED_TEXT)}>
              Saatte 15 sınav sınırı. MVP: soru üretici + Word export.
              OCR ve OMR modülleri sonraki sürümde.
            </p>
          </div>
        </div>
      </div>

      {/* Output column */}
      <div className="space-y-4 lg:col-span-3">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {!exam && !loading && !error ? (
          <div
            className={cn(
              CARD,
              "flex flex-col items-center gap-3 border-dashed py-14 text-center",
            )}
          >
            <ScrollText className="size-10 text-brand-crimson" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Ders ve konu bilgisini doldur, sorular üret
            </h3>
            <p className={cn("max-w-sm text-sm", MUTED_TEXT)}>
              Bloom taksonomisine göre dağılmış sorular + cevap anahtarı +
              çözüm bu sütunda belirir. Word (.docx) olarak indir.
            </p>
          </div>
        ) : null}

        {loading ? (
          <div
            className={cn(
              CARD,
              "flex flex-col items-center gap-3 py-14 text-center",
            )}
          >
            <Loader2 className="size-10 animate-spin text-brand-crimson" />
            <p className={cn("text-sm", MUTED_TEXT)}>
              Sorular hazırlanıyor… 20-40 saniye.
            </p>
          </div>
        ) : null}

        {exam ? (
          <>
            <div className={cn(CARD, "px-5 py-5")}>
              <p className={cn("text-[11px] font-semibold uppercase tracking-wider", MUTED_TEXT)}>
                {exam.meta.subjectLabel} · {exam.meta.gradeLabel} · {exam.meta.difficultyLabel}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {exam.title}
              </h2>
              {exam.instructions ? (
                <p className={cn("mt-2 text-sm italic", MUTED_TEXT)}>
                  {exam.instructions}
                </p>
              ) : null}
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={showAnswers}
                      onChange={(e) => setShowAnswers(e.target.checked)}
                    />
                    <span className="text-slate-700 dark:text-slate-200">
                      Cevap anahtarı
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={showSolutions}
                      onChange={(e) => setShowSolutions(e.target.checked)}
                    />
                    <span className="text-slate-700 dark:text-slate-200">
                      Çözümler
                    </span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={downloadDocx}
                    disabled={exporting}
                    className={BTN_PRIMARY}
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Word hazırlanıyor…
                      </>
                    ) : (
                      <>
                        <Download className="size-3.5" />
                        Word (.docx) olarak indir
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={BTN_OUTLINE}
                  >
                    <FileText className="size-3.5" />
                    Yazdır / PDF
                  </button>
                </div>
              </div>
            </div>

            {exam.questions.map((q, i) => (
              <div key={i} className={cn(CARD, "px-5 py-5")}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-crimson">
                    Soru {i + 1}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      DIFF_STYLE[q.difficulty],
                    )}
                  >
                    {q.difficulty === "kolay" ? "Kolay" : q.difficulty === "orta" ? "Orta" : "Zor"}
                  </span>
                  <span className="rounded-full border border-slate-300 bg-slate-100/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                    Bloom: {BLOOM_LABEL[q.bloomLevel]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {q.stem}
                </p>
                {q.kind === "coktan-secmeli" && q.options ? (
                  <ul className="mt-3 space-y-1.5">
                    {q.options.map((opt, j) => (
                      <li
                        key={j}
                        className={cn(
                          "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                          showAnswers && q.correctIndex === j
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-900 dark:text-emerald-200"
                            : "border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200",
                        )}
                      >
                        <span className="font-semibold">{OPTION_LETTERS[j] ?? j + 1})</span>
                        <span>{opt}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs italic text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {showAnswers && q.expectedAnswer ? `Beklenen cevap: ${q.expectedAnswer}` : "Cevap: ______________________"}
                  </div>
                )}
                {showSolutions ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-crimson">
                      Çözüm
                    </p>
                    <p className={cn("text-xs leading-relaxed italic", MUTED_TEXT)}>
                      {q.solution}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}

            {showAnswers ? (
              <div className={cn(CARD, "px-5 py-5")}>
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Cevap Anahtarı
                </h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                  {exam.answerKey.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
