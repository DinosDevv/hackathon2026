import express from "express";
import multer from "multer";
import sharp from "sharp";
import { networkInterfaces } from "node:os";
import { z } from "zod";
import { askHelper, MODEL, toSpokenText } from "./helper.js";
import { sttEnabled, transcribe } from "./transcribe.js";

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(express.json({ limit: "20mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, stt: sttEnabled() });
});

const AskBody = z.object({
  question: z.string().min(1),
  image: z.object({ data: z.string(), mediaType: z.enum(["image/jpeg", "image/png"]) }).optional(),
  contextText: z.string().max(20000).optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).max(20).optional(),
  name: z.string().max(100).optional(),
  language: z.string().max(40).optional(),
});

app.post("/api/ask", async (req, res) => {
  const parsed = AskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  try {
    res.json(await askHelper(parsed.data));
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "The helper is not available right now." });
  }
});

app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  if (!sttEnabled()) {
    res.status(501).json({ error: "Speech-to-text is not configured on the server." });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No audio file" });
    return;
  }
  try {
    const text = await transcribe(req.file.buffer, req.file.originalname || "audio.m4a", req.file.mimetype, req.body.language);
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not understand the recording." });
  }
});

// Endpoint for the iOS Shortcut (AssistiveTouch → Shortcut → "Get Contents of URL").
// Accepts a form with an image file + question and replies with plain text for "Speak Text".
app.post("/api/shortcut", upload.any(), async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const imageFile = files.find((f) => f.mimetype.startsWith("image/")) ?? files[0];
  const question = (req.body?.question as string | undefined)?.trim() || "What is on my screen? Is it safe?";
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
    const answer = await askHelper({ question, image, language: req.body?.language || undefined });
    res.type("text/plain").send(toSpokenText(answer));
  } catch (err) {
    console.error(err);
    res.type("text/plain").status(502).send("Sorry, the helper is not available right now.");
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
