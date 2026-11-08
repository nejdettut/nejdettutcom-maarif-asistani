# AI Maarif Asistanı — nejdettut.com (MVP)

Konu + sınıf + zorluk + soru tipi → Bloom taksonomili sınav soruları + Word.

- **MVP kapsam:** Modül 1 (soru üretici) + Modül 4 (Word export).
- **Sonraki sürümde:** Modül 2 (OCR sınav kâğıdı okuma) + Modül 3 (OMR optik okuma).
- **Model:** Groq `openai/gpt-oss-120b` tek `generateObject`.
- **Girdi:** 14 ders · 12 sınıf · 4 zorluk · 3 soru tipi · 3-25 soru · opsiyonel hedef kazanımlar.
- **Çıktı:** Başlık + yönerge + sorular (stem + 4 şık veya açık uçlu) + çözüm + Bloom seviye + cevap anahtarı.
- **Export:** `docx` library ile Word (ihtiyaca göre cevaplı/cevapsız + çözümlü/çözümsüz).
- **Rate limit:** 15 sınav/saat/IP.

## Geliştirme

```bash
npm install
cp .env.example .env.local   # GROQ_API_KEY ekleyin
npm run dev
```
