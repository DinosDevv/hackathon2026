import express from "express";
import multer from "multer";
import sharp from "sharp";
import { networkInterfaces } from "node:os";
import { z } from "zod";
import { askHelper, MODEL, toSpokenText } from "./helper.js";
import { sttEnabled, transcribe } from "./transcribe.js";
import { synthesize, ttsEnabled } from "./tts.js";

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(express.json({ limit: "20mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// When the "Helper, look" shortcut last reached us, so the app's setup guide can show "It works".
let lastLookAt: string | null = null;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, stt: sttEnabled(), tts: ttsEnabled(), lastLookAt });
});

// Helper's voice. A GET with the text in the query, so the phone's audio player can stream it directly:
// /api/speak?text=Hi%20Yiayia&language=Greek
app.get("/api/speak", async (req, res) => {
  const text = typeof req.query.text === "string" ? req.query.text.trim().slice(0, 2000) : "";
  if (!ttsEnabled()) {
    res.status(501).json({ error: "Η φωνή του HelpNona δεν έχει ρυθμιστεί στον server." });
    return;
  }
  if (!text) {
    res.status(400).json({ error: "Δεν υπάρχει κείμενο." });
    return;
  }
  try {
    const audio = await synthesize(text, typeof req.query.language === "string" ? req.query.language : undefined);
    res.type("audio/mpeg").send(Buffer.from(audio));
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Η φωνή του HelpNona δεν είναι διαθέσιμη τώρα." });
  }
});

const AskBody = z.object({
  question: z.string().min(1),
  image: z.object({ data: z.string(), mediaType: z.enum(["image/jpeg", "image/png"]) }).optional(),
  contextText: z.string().max(20000).optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).max(20).optional(),
  name: z.string().max(100).optional(),
  nickname: z.string().max(40).optional(),
  guardianName: z.string().max(60).optional(),
  language: z.string().max(40).optional(),
  detail: z.enum(["short", "full"]).optional(),
});

app.post("/api/ask", async (req, res) => {
  const parsed = AskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Κάτι πήγε στραβά με το αίτημα.", details: parsed.error.issues });
    return;
  }
  try {
    res.json(await askHelper(parsed.data));
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Ο HelpNona δεν είναι διαθέσιμος αυτή τη στιγμή. Δοκίμασε ξανά σε λίγο." });
  }
});

app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  if (!sttEnabled()) {
    res.status(501).json({ error: "Η αναγνώριση φωνής δεν έχει ρυθμιστεί στον server." });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "Δεν ήρθε ηχογράφηση." });
    return;
  }
  try {
    const text = await transcribe(req.file.buffer, req.file.originalname || "audio.m4a", req.file.mimetype, req.body.language);
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Δεν κατάλαβα την ηχογράφηση. Δοκίμασε ξανά;" });
  }
});

const param = (req: express.Request, key: string) => {
  const value = req.body?.[key] ?? req.query[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

// "Helper, look": an iOS Shortcut (Back Tap / Action button) posts a screenshot of whatever is on screen,
// optionally with a question, and reads our plain-text reply out loud. Language and name can come from
// the link itself (…/api/look?language=Greek&name=Eleni) so the shortcut needs just one form field.
app.post(["/api/look", "/api/shortcut"], upload.any(), async (req, res) => {
  lastLookAt = new Date().toISOString();
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const imageFile = files.find((f) => f.mimetype.startsWith("image/")) ?? files[0];
  const question = param(req, "question") ?? "What is on my screen? Is it safe, and what should I do?";
  try {
    const image = imageFile
      ? {
          // Shrink full-resolution PNG screenshots to what Claude actually uses.
          data: (
            await sharp(imageFile.buffer)
              .resize({ width: 1568, height: 1568, fit: "inside", withoutEnlargement: true })
              .jpeg({ quality: 75 })
              .toBuffer()
          ).toString("base64"),
          mediaType: "image/jpeg" as const,
        }
      : undefined;
    const answer = await askHelper({
      question,
      image,
      language: param(req, "language"),
      name: param(req, "name"),
      nickname: param(req, "nickname"),
      guardianName: param(req, "guardian"),
      oneShot: true,
    });
    res.type("text/plain").send(toSpokenText(answer, param(req, "language")));
  } catch (err) {
    console.error(err);
    res.type("text/plain").status(502).send("Συγγνώμη, ο HelpNona δεν είναι διαθέσιμος αυτή τη στιγμή.");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i!.address);
  console.log(`Helper server on port ${PORT} (model ${MODEL}, speech-to-text ${sttEnabled() ? "on" : "off"})`);
  for (const ip of ips) console.log(`  http://${ip}:${PORT}`);
});
