# Helper

A voice helper for people who aren't confident with smartphones. Ask it about a message, email, letter or screen and it tells you, in plain words, what it is, whether it's safe, and what to do.

- **App** (`app/`, `src/`): Expo + TypeScript, runs in **Expo Go** on iPhone.
- **Server** (`server/`): Node + TypeScript. Calls Claude with the question and the image, and serves the iOS Shortcut.

## Run it

You need two terminals, and the iPhone on the **same network** as the laptop.

```bash
# 1. Server (first time: npm --prefix server install, then add your key)
cp server/.env.example server/.env    # put ANTHROPIC_API_KEY=... in it
npm run server                        # listens on port 3001

# 2. App
npm start                             # scan the QR code with the iPhone camera → opens in Expo Go
```

The app finds the server automatically: it uses the same laptop address as Expo on port 3001. To check it, open Settings → Test connection in the app.

**If the phone can't reach the laptop** (school or venue Wi-Fi often blocks this): run `npx expo start --tunnel` for the app, expose the server with a tunnel (e.g. `npx cloudflared tunnel --url http://localhost:3001`), and paste the tunnel URL into the app under Settings → Server address.

### Voice input

- With `OPENAI_API_KEY` in `server/.env`, the big microphone button records you and the server transcribes it. Claude doesn't take audio input.
- Without it, the microphone button opens the keyboard. Use the iOS keyboard's own dictation microphone.
- Spoken answers use the iPhone's built-in voices (`expo-speech`). Nothing to set up.

## Features

| | |
|---|---|
| 🎤 Ask Helper | Speak or type any question, then ask follow-ups |
| 🛡️ Check a screenshot | Scam and safety check with a 🟢🟡🔴 verdict |
| 🔗 Check copied message or link | Reads the clipboard and checks it |
| 📷 Read a letter or sign | Photograph paper mail, bills or another screen |
| 📱 Explain a screenshot | "What is this and what do I do?" |
| 💬 Write a reply | Ask "reply saying I'll be there at 5". Opens Messages with the text ready, or copies or shares it |
| 👪 Tell family / Call family | Shown when something looks risky. Texts or calls the trusted contact |
| 🕘 Past questions | Saved on the phone |
| ⚙️ Settings | Speak / write / both, speaking speed, text size, English / Greek, trusted contact |
| ✨ Helper in any app | Guide for the iOS Shortcut + AssistiveTouch floating button (below) |

## Helper in any app (AssistiveTouch + Shortcut)

iOS doesn't let apps float a button over other apps. AssistiveTouch (iOS's own floating button) can run a Shortcut:

1. **Shortcuts app** → new shortcut "Helper":
   `Take Screenshot` → `Dictate Text` → `Get Contents of URL` (POST, Form body: file `image` = Screenshot, text `question` = Dictated Text, URL = `http://<laptop-ip>:3001/api/shortcut`) → `Speak Text` (Contents of URL).
2. **Settings → Accessibility → Touch → AssistiveTouch** → on → Custom Actions → Single-Tap → Helper.

The in-app "Use Helper in any app" screen shows the same steps with a button to copy the URL.

## Server API

| Endpoint | |
|---|---|
| `GET /api/health` | `{ ok, model, stt }` |
| `POST /api/ask` | JSON `{ question, image?: {data, mediaType}, contextText?, history?, name?, language? }` → `{ verdict, headline, explanation, steps, draftReply, tellFamily }` |
| `POST /api/transcribe` | multipart `audio` → `{ text }` (needs `OPENAI_API_KEY`) |
| `POST /api/shortcut` | multipart `image` + `question` → plain text to speak |

Model: `claude-opus-5` at low effort (for fast voice replies), with Claude's server-side fallback enabled. Change it with `HELPER_MODEL` / `HELPER_EFFORT` in `server/.env`.

## Safety design

- Everything in a screenshot or copied text is treated as **untrusted**. The system prompt tells Claude never to follow instructions written inside it, to guard against prompt injection from scam messages.
- Helper never asks for or suggests sharing passwords, PINs, codes or card numbers. When in doubt, it says to be careful.
- Helper never sends anything itself. Messages always open in the iPhone's own compose screen, and the user presses Send.
