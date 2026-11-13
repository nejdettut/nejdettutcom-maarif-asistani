// Modül 3 (OMR): doldurulmuş optik formu okur + cevap anahtarıyla puanlar.
// Canvas pixel analizi yerine Gemini Vision kullanıyoruz; öğretmen
// fotoğrafı eğri ya da hafif gölgeli olduğunda bile analiz yapabilir.
import "server-only";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const CHOICES = ["A", "B", "C", "D", "E"] as const;

const OmrResultSchema = z.object({
  detected: z.boolean(),
  confidence: z.enum(["dusuk", "orta", "yuksek"]),
  studentName: z.string().optional(),
  studentNumber: z.string().optional(),
  answers: z.array(
    z.object({
      number: z.number().int().min(1),
      marked: z.enum(["A", "B", "C", "D", "E", "BOS", "COKLU"]),
    }),
  ),
  pageNotes: z.array(z.string()).max(5).optional(),
});

type OmrResult = z.infer<typeof OmrResultSchema>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeModel() {
  const key =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;
  const provider = createGoogleGenerativeAI({ apiKey: key });
  return provider("gemini-flash-latest");
}

function extractJson(text: string): string | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}

type ScoreCell = {
  number: number;
  student: OmrResult["answers"][number]["marked"];
  correct: (typeof CHOICES)[number];
  status: "dogru" | "yanlis" | "bos" | "coklu";
};

function parseAnswerKey(raw: string, questionCount: number): string[] | null {
  // Formats accepted:
  //   "A B C D A B C D ..." (space separated, 1..N)
  //   "ABCDA BCDE..." (contiguous)
  //   "1:A, 2:B, 3:C ..." (explicit)
  const normalized = raw
    .toLocaleUpperCase("tr")
    .replace(/[^A-E0-9:,\s]/g, " ")
    .trim();
  if (!normalized) return null;
  // Try explicit "N:LETTER" form first
  const explicit = Array.from(normalized.matchAll(/(\d+)\s*[:.-]\s*([A-E])/g));
  if (explicit.length >= questionCount) {
    const out: string[] = Array(questionCount).fill("");
    for (const m of explicit) {
      const n = Number(m[1]);
      if (n >= 1 && n <= questionCount) out[n - 1] = m[2];
    }
    if (out.every((v) => v !== "")) return out;
  }
  // Fallback: extract contiguous letter sequence
  const letters = normalized.replace(/[^A-E]/g, "");
  if (letters.length >= questionCount) {
    return letters.slice(0, questionCount).split("");
  }
  return null;
}

export async function POST(req: Request) {
  const limited = await rateLimit({
    action: "omr-okut",
    windowMs: 60 * 60 * 1000,
    max: 10,
  });
  if (!limited.ok) {
    return json(
      { error: "Saatte en fazla 10 OMR işlemi yapılabilir. Lütfen biraz sonra tekrar dene." },
      429,
    );
  }

  const model = makeModel();
  if (!model) {
    return json(
      { error: "OMR servisi şu an kullanılamıyor (GEMINI_API_KEY eksik)." },
      503,
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Geçersiz form. multipart/form-data gerekli." }, 400);
  }

  const file = form.get("image");
  if (!file || !(file instanceof Blob)) {
    return json({ error: "Görsel bulunamadı ('image' alanı)." }, 400);
  }
  if (file.size === 0) return json({ error: "Boş görsel." }, 400);
  if (file.size > MAX_IMAGE_BYTES) {
    return json({ error: "Görsel 10 MB'tan büyük olamaz." }, 413);
  }
  if (file.type && !ALLOWED_MIME.has(file.type.toLowerCase())) {
    return json(
      { error: `Desteklenmeyen görsel türü: ${file.type}.` },
      415,
    );
  }

  const countStr = String(form.get("count") ?? "20");
  const count = Math.min(50, Math.max(5, parseInt(countStr, 10)));
  if (Number.isNaN(count)) {
    return json({ error: "count 5–50 arası tam sayı olmalı." }, 400);
  }

  const answerKeyRaw = String(form.get("answerKey") ?? "");
  const answerKey = answerKeyRaw ? parseAnswerKey(answerKeyRaw, count) : null;
  if (answerKeyRaw && !answerKey) {
    return json(
      {
        error:
          "Cevap anahtarı çözümlenemedi. Örnek: 'A B C D A ...' ya da '1:A, 2:B, 3:C ...'.",
      },
      400,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";

  const system = [
    "Sen Türkçe eğitim bağlamında optik okuma (OMR) uzmanısın.",
    "Verilen görsel bir OMR cevap formu fotoğrafıdır: 1'den başlayan satırlar, her satırda A B C D E yuvarlakları.",
    "Her satır için hangi yuvarlağın doldurulmuş olduğunu tespit et:",
    "- Tam doldurulmuş tek yuvarlak → o harf (A/B/C/D/E).",
    "- Hiçbir yuvarlak doldurulmamış → BOS.",
    "- Birden fazla yuvarlak doldurulmuş → COKLU.",
    "Varsa öğrencinin adı ve numarasını da oku. Confidence hafif eğik/gölge/kalem izi varsa 'orta', net ise 'yuksek'.",
    "Görsel OMR formu DEĞİLSE detected=false döndür.",
  ].join(" ");

  const expectedRows = Array.from({ length: count }, (_, i) =>
    `{ "number": ${i + 1}, "marked": "A|B|C|D|E|BOS|COKLU" }`,
  ).join(",\n    ");

  const prompt = `
Görseldeki ${count} soruluk OMR formunu analiz et. SADECE aşağıdaki JSON yapısıyla yanıt ver; başka metin ekleme.

{
  "detected": true,
  "confidence": "yuksek",
  "studentName": "<varsa>",
  "studentNumber": "<varsa>",
  "answers": [
    ${expectedRows}
  ],
  "pageNotes": ["<opsiyonel notlar>"]
}
`.trim();

  let parsedResult: OmrResult;
  try {
    const { text } = await generateText({
      model,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", image: bytes, mediaType: mime },
          ],
        },
      ],
      temperature: 0.1,
      maxOutputTokens: 4000,
    });
    const jsonText = extractJson(text);
    if (!jsonText) {
      console.error("[omr] no JSON in output:", text.slice(0, 400));
      return json({ error: "OMR sonucu formatı beklenmedik." }, 422);
    }
    const parsed = JSON.parse(jsonText);
    const result = OmrResultSchema.safeParse(parsed);
    if (!result.success) {
      console.error("[omr] schema mismatch:", result.error.issues.slice(0, 3));
      return json({ error: "OMR sonucu şemaya uymadı." }, 422);
    }
    parsedResult = result.data;
  } catch (err) {
    console.error("[omr] generateText failed:", err);
    return json({ error: "OMR işlemi başarısız. Lütfen tekrar dene." }, 502);
  }

  if (!parsedResult.detected) {
    return json(
      { error: "Görsel OMR formu olarak tanınamadı.", ...parsedResult },
      422,
    );
  }

  // Score if answer key supplied
  let scored: ScoreCell[] | null = null;
  let summary: { dogru: number; yanlis: number; bos: number; coklu: number; yuzde: number } | null = null;
  if (answerKey) {
    scored = [];
    const seenNumbers = new Map(parsedResult.answers.map((a) => [a.number, a.marked]));
    for (let i = 0; i < count; i++) {
      const n = i + 1;
      const student = (seenNumbers.get(n) ?? "BOS") as OmrResult["answers"][number]["marked"];
      const correct = answerKey[i] as (typeof CHOICES)[number];
      let status: ScoreCell["status"];
      if (student === "BOS") status = "bos";
      else if (student === "COKLU") status = "coklu";
      else status = student === correct ? "dogru" : "yanlis";
      scored.push({ number: n, student, correct, status });
    }
    const dogru = scored.filter((c) => c.status === "dogru").length;
    const yanlis = scored.filter((c) => c.status === "yanlis").length;
    const bos = scored.filter((c) => c.status === "bos").length;
    const coklu = scored.filter((c) => c.status === "coklu").length;
    summary = {
      dogru,
      yanlis,
      bos,
      coklu,
      yuzde: Math.round((dogru / count) * 1000) / 10,
    };
  }

  return json({
    ...parsedResult,
    scored,
    summary,
    questionCount: count,
  });
}
