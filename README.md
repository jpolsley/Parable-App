# Parable — Youth Curriculum Generator

Create thoughtful, biblically rich youth ministry curriculum series using **your own self-hosted AI**.

The app is a static site hosted on GitHub Pages. It sends requests straight from your browser to any
OpenAI-compatible server you run (Ollama, LM Studio, llama.cpp, vLLM, LocalAI, …). No data goes to a
third-party AI provider.

## Use it

1. Open the GitHub Pages site (`https://<your-user>.github.io/Parable-App/`).
2. Click **AI Server** in the top-right and enter:
   - **Base URL** — e.g. `http://localhost:11434/v1` (Ollama) or `http://localhost:1234/v1` (LM Studio)
   - **Model** — e.g. `llama3.1`, `qwen2.5:14b`, `mistral-nemo`
   - **API Key** — only if your server requires one
3. Pick a topic and generate.

Settings are saved in your browser only.

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
