// Modül 2 (MVP): kağıt sınav OCR'ı. Öğretmen sınav fotoğrafı yükler,
// Gemini Vision sayfayı okur ve yapılandırılmış soru listesi döner.
import "server-only";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 90;

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB (sınav kağıtları büyük olabilir)
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const OcrResultSchema = z.object({
  detected: z.boolean(),
  confidence: z.enum(["dusuk", "orta", "yuksek"]),
  rawText: z.string(),
  questions: z
    .array(
      z.object({
        number: z.string(),
        stem: z.string(),
        options: z.array(z.string()).max(6).optional(),
        answerKeyHint: z.string().optional(),
      }),
    )
    .max(50),
  pageNotes: z.array(z.string()).max(5),
});

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
  // 2.5-flash-lite is closed to new users; use the 3.5-lite successor.
  return provider("gemini-3.5-flash-lite");
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

export async function POST(req: Request) {
  const limited = await rateLimit({
    action: "ocr",
    windowMs: 60 * 60 * 1000,
    max: 10,
  });
  if (!limited.ok) {
    return json(
      { error: "Saatte en fazla 10 OCR işlemi yapılabilir. Lütfen biraz sonra tekrar dene." },
      429,
    );
  }

  const model = makeModel();
  if (!model) {
    return json(
      { error: "OCR servisi şu an kullanılamıyor (GEMINI_API_KEY eksik)." },
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
      { error: `Desteklenmeyen görsel türü: ${file.type}. jpg/png/webp kullan.` },
      415,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";

  const system = [
    "Sen Türkçe sınav kağıdı okumada uzman bir OCR asistanısın.",
    "Verilen görseldeki tüm metni dikkatlice oku; bir sınav kağıdı ise sorulara ayır.",
    "Her soru için: soru numarası, soru metni (stem), varsa şıklar (A/B/C/D/E), varsa cevap anahtarı işareti.",
    "Yanlış okuma olabilirse 'confidence' alanını 'dusuk' veya 'orta' tut.",
    "Görsel sınav kağıdı DEĞİLSE (ör. boş sayfa, farklı doküman), detected=false ve açıklama yaz.",
    "Türkçe karakterleri doğru koru (ş, ç, ğ, ı, ö, ü).",
  ].join(" ");

  const examplePrompt = `
Görseldeki sınav kağıdını oku ve aşağıdaki JSON yapısıyla birebir aynı alanlı tek bir nesne döndür. Başka hiçbir metin ekleme.

Örnek şablon:
{
  "detected": true,
  "confidence": "yuksek",
  "rawText": "SORU 1: 24 + 17 = ?\\nA) 31  B) 41  C) 51  D) 61\\nSORU 2: ...",
  "questions": [
    {
      "number": "1",
      "stem": "24 + 17 işleminin sonucu kaçtır?",
      "options": ["A) 31", "B) 41", "C) 51", "D) 61"],
      "answerKeyHint": "B işaretli"
    }
  ],
  "pageNotes": ["Sayfa başında sınıf/ad yeri var", "6 sorudan oluşuyor"]
}
`.trim();

  try {
    const { text } = await generateText({
      model,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: examplePrompt },
            { type: "image", image: bytes, mediaType: mime },
          ],
        },
      ],
      temperature: 0.1,
      maxOutputTokens: 6000,
      // Disable Gemini 2.5 Flash thinking; OCR is a direct vision pass.
      providerOptions: {
        google: { thinkingConfig: { thinkingBudget: 0 } },
      },
    });
    const jsonText = extractJson(text);
    if (!jsonText) {
      console.error("[ocr] no JSON in output:", text.slice(0, 400));
      return json({ error: "OCR sonucu formatı beklenmedik." }, 422);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error("[ocr] JSON parse failed:", err);
      return json({ error: "OCR sonucu formatı beklenmedik." }, 422);
    }
    const result = OcrResultSchema.safeParse(parsed);
    if (!result.success) {
      console.error("[ocr] schema mismatch:", result.error.issues.slice(0, 3));
      return json({ error: "OCR sonucu şemaya uymadı." }, 422);
    }
    if (!result.data.detected) {
      return json(
        { error: "Görsel sınav kağıdı olarak tanınamadı.", ...result.data },
        422,
      );
    }
    return json(result.data);
  } catch (err) {
    console.error("[ocr] generateText failed:", err);
    return json(
      { error: "OCR işlemi başarısız. Lütfen tekrar dene." },
      502,
    );
  }
}
