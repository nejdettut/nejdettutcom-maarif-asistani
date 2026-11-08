import "server-only";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { rateLimit } from "@/lib/rate-limit";
import {
  DIFFICULTY_LABELS,
  ExamRequestSchema,
  ExamSchema,
  GRADE_LABELS,
  QUESTION_TYPE_LABELS,
  SUBJECT_LABELS,
} from "@/lib/exam-schema";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  const limited = await rateLimit({
    action: "maarif-soru",
    windowMs: 60 * 60 * 1000,
    max: 15,
  });
  if (!limited.ok) {
    return json(
      { error: "Saatte en fazla 15 sınav üretebilirsin. Lütfen biraz sonra tekrar dene." },
      429,
    );
  }

  let body;
  try {
    body = ExamRequestSchema.parse(await req.json());
  } catch {
    return json({ error: "Geçersiz istek gövdesi." }, 400);
  }

  const subjectLabel =
    body.subject === "diger"
      ? body.customSubject || "Diğer"
      : SUBJECT_LABELS[body.subject];

  const system = [
    "Sen Türk Milli Eğitim Bakanlığı müfredatına ve Bloom taksonomisine hakim deneyimli bir sınav tasarımcısısın.",
    "Verilen ders, sınıf ve konuda, istenen tipte ve zorlukta sınav soruları üret.",
    "Her çoktan seçmeli soruda tam 4 şık, tam 1 doğru cevap olsun; çeldiriciler makul olsun.",
    "Her soru için 'solution' alanında kısa bir çözüm + açıklama yaz (öğrenci ve öğretmen için).",
    "Bloom seviyeleri: hatırla, anla, uygula, analiz, değerlendir, yarat. Zorluğa göre dağıt (kolay: hatırla/anla; orta: uygula; zor: analiz/değerlendir/yarat).",
    "Türkçe. Yaş grubuna uygun dil. Kesin, net, tek doğru cevabı olan sorular.",
    "answerKey alanında her soru için kısa cevap satırı (ör: 'Soru 1: B', 'Soru 2: 42', 'Soru 3: Yüklemdir çünkü...').",
    `Ders: ${subjectLabel}.`,
    `Sınıf seviyesi: ${GRADE_LABELS[body.grade]}.`,
    `Zorluk: ${DIFFICULTY_LABELS[body.difficulty]}.`,
    `Soru tipi: ${QUESTION_TYPE_LABELS[body.questionType]}.`,
    `Üretilecek soru sayısı: ${body.count}.`,
    body.learningObjectives ? `Hedef kazanımlar: ${body.learningObjectives}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const prompt = `Konu: ${body.topic}\n\nSınav JSON şemasına uygun döndür. questions dizisinde ${body.count} soru olsun. Soru tipi '${body.questionType}' ise kind alanı uygun şekilde ayarlansın (karisik olabilir).`;

  try {
    const { object } = await generateObject({
      model: groq("openai/gpt-oss-120b"),
      schema: ExamSchema,
      system,
      prompt,
      temperature: 0.5,
    });
    return json({
      ...object,
      meta: {
        subject: body.subject,
        subjectLabel,
        grade: body.grade,
        gradeLabel: GRADE_LABELS[body.grade],
        topic: body.topic,
        difficulty: body.difficulty,
        difficultyLabel: DIFFICULTY_LABELS[body.difficulty],
      },
    });
  } catch (err) {
    console.error("[maarif] failed:", err);
    return json(
      { error: "Sorular üretilemedi. Lütfen biraz sonra tekrar dene." },
      502,
    );
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
