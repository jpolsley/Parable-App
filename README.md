# Parable — Service Builder

Plan kids and youth ministry services section by section and part by part: scripts, instructions,
supplies, media, inclusion tips, and leader notes. Print a polished leader guide when you're done.
AI is an optional assistant powered by **your own self-hosted model**.

## What you can do

- **Build services** from templates (Kids Service, Youth Night, Preschool) or from scratch.
- **Drag to reorder** sections and parts, move parts between sections, hide parts without deleting them.
- **Live run times.** Set a start time and every section and part shows its clock time; totals update as you edit.
- **Supplies that scale.** Enter quantities "per kid" or "per group" and the supply list totals them for your class size, with a checklist.
- **Parts library.** Save a part (weekly welcome, favorite game) and insert it into any service.
- **Print** a full leader guide, a one-page run sheet, a supply list, or a single section or part. Page breaks are yours to set.
- **Series.** Group services by series and week. Duplicate a service to start next week's.
- **Your data stays yours.** Everything saves automatically in your browser. Export a file or back up everything, then import it on another device.

### AI assistant (optional)

When it's turned on, AI adds small buttons. It never changes anything until you click **Use this**:

- Draft or improve a part's script, instructions, inclusion tips, or leader notes
- Suggest supplies for a part
- Suggest new parts for a section
- Write a first draft of a whole service from a template
- Draft a multi-week series, one service per week
- Ask questions about the service you're building

## Use it

1. Open the GitHub Pages site (`https://<your-user>.github.io/Parable-App/`).
2. Click **AI** in the top-right, turn on the helpers, and enter:
   - **Base URL** — e.g. `http://localhost:11434/v1` (Ollama) or `http://localhost:1234/v1` (LM Studio)
   - **Model** — e.g. `llama3.1`, `qwen2.5:14b`, `mistral-nemo`
   - **API Key** — only if your server requires one
3. Click **Test connection**, then **Save**.

AI settings and all your services are saved in your browser only. Use **Back up everything** on the home page to keep a copy.

### Allowing the site to talk to your server (CORS)

Because the page runs on `github.io`, your AI server must allow requests from that origin.

- **Ollama:** start it with
  `OLLAMA_ORIGINS="https://<your-user>.github.io" ollama serve`
  (or `OLLAMA_ORIGINS="*"` while testing).
- **LM Studio:** Developer tab → Server settings → enable **CORS**.
- **llama.cpp server / vLLM:** CORS is enabled by default.

`http://localhost` works from the HTTPS page in Chrome, Edge, and Firefox. If your server is on another
machine, put it behind **HTTPS** (e.g. Caddy, Tailscale Serve, or a Cloudflare Tunnel) — browsers block
HTTPS pages from calling plain-HTTP remote addresses.

Larger models (8B+) give noticeably better structured output. Longer series take longer to generate.

## Deploy to GitHub Pages

1. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. The `Deploy to GitHub Pages` workflow builds the app and publishes it.

Optional: set repository variables `VITE_AI_BASE_URL` and `VITE_AI_MODEL`
(**Settings → Secrets and variables → Actions → Variables**) to change the defaults shown in the app.
Don't put a secret API key in the build — anything baked into a static site is public.

## Run locally

Prerequisites: Node.js 20+

```bash
npm install
npm run dev
```

Optionally create `.env.local` with `VITE_AI_BASE_URL` / `VITE_AI_MODEL` to set default server settings.
