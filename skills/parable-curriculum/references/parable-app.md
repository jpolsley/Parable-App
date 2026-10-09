# The Parable app

Parable is Justin's web app for building youth ministry series and printing them as leader books. It started from
Google AI Studio's "Parable Youth Curriculum" one-page generator. Claude rebuilt it into a series builder, using
Amazing Life's "service builder" as the starting point (sections → parts → tabs). It has since moved away from that
date-scheduled model to a "shelf of books" model.

## Contents
1. Where it lives and how changes ship
2. Stack and file map
3. Data model essentials
4. Printing
5. Diana (AI) and Justin's local setup
6. Testing
7. Roadmap: what was planned and not built

---

## 1. Where it lives and how changes ship

- **Repo:** `github.com/ministryAI/Parable-App`, moved from `jpolsley/Parable-App`, which redirects.
- **Live site:** https://ministryai.github.io/Parable-App/. It's GitHub Pages, deployed by
  `.github/workflows/deploy-pages.yml` on every push to `main`. (Settings → Pages → Source must be "GitHub Actions".)
- **Branches:** work happens on a dev branch (historically `claude/practical-cori-1svboi`). Justin merges to `main`
  through a pull request, using a compare link:
  `https://github.com/ministryAI/Parable-App/compare/main...<branch>`.
  - Give him that link after every change.
  - Don't open the PR unless he asks.
  - If the branch's previous PR is already merged, start the follow-up work fresh from `main`.
- **After a merge:** tell him to hard-refresh (Cmd+Shift+R), because GitHub Pages caches for about 10 minutes.
- **Never commit secrets.** The Steward key stays on his Mac.

## 2. Stack and file map

React 19, TypeScript, Vite 6 and Tailwind v4. No backend.
- **Storage:** all data is in the browser's localStorage (`parable.db.v1`).
- **Backups:** "Back up everything" exports a JSON file, and import restores it.
- **Built-in content:** samples and built-in designs are seeded once per browser (`parable.seeded` keys).

| File | What it is |
|---|---|
| `App.tsx` | Top bar (Shelf, Library, AI status), hash routes: `#/` shelf, `#/series/:id`, `#/s/:lessonId[/p/:partId]`, `#/library` |
| `types.ts` | Data model (Series, TeachingRun, Service = lesson, Section, Part, BookDesign, LayoutPack) |
| `store/StoreContext.tsx` | State, persistence, migrations (`migrateRuns`), seeding samples, toasts with undo, print trigger |
| `components/ShelfPage.tsx` | Home: series as book covers with status pills, "Pick up where you left off", stand-alone lessons |
| `components/SeriesPage.tsx` | Series page tabs: **Lessons** (sortable contents table with a colored "shape of the lesson" bar), **Book** (whole printed book on screen), **When I teach it** (runs) |
| `components/ServiceEditor.tsx` | Lesson editor: outline on the left (xl screens), sections and parts in the middle, live print preview or Details on the right |
| `components/SectionCard.tsx`, `PartCard.tsx` | Section and part editing (Script / Instructions / Supplies / Media / Resources / Inclusion tips / Leader notes tabs, plus AI assist) |
| `components/SidePanel.tsx` | Details, Family, Supplies, Media, Script read-through, **Review** (playbook check), Ask AI |
| `components/DesignDialog.tsx`, `DesignLibrary.tsx` | Design screen: design library thumbnails, built-in looks, manual controls, Ask Diana (text only) |
| `components/SettingsPanel.tsx` | AI settings: server presets, playbook editor |
| `components/print/PrintView.tsx`, `print.css` | Every printed page; `CoverThumb`, `BookPreview`, `PrintPreview` |
| `lib/printFit.ts` | Shrinks slightly-long sections to fit their pages (minimum 0.82) when printing |
| `lib/customPage.ts` | Layout-file sanitizer, placeholder fill, CSS scoping, `fitText` |
| `lib/series.ts` | `weeksOf`, runs (`planDates`, `forPrint`, `printRunOf`, `formatWhen`), `migrateRuns` |
| `lib/roles.ts` | What goes on the small group and family pages (`smallGroupGuide`, `familyCues`, `isChallenge`) |
| `lib/text.ts` | Cue, list and paragraph parsing for print |
| `lib/time.ts` | Minutes, `buildElapsed` (0:00-style times), clock schedules |
| `lib/playbook.ts` | Default Ministry Playbook, `playbookForDrafting`, `playbookChecklist` |
| `lib/samples/` | Built-in B.L.E.S.S. (`bless.json`) and built-in layouts. `withSamples` replaces an untouched older copy in place, or adds "(revised)" if Justin edited it |
| `services/aiService.ts` | Every Diana request (drafting, review, design patches) |
| `services/aiSettings.ts` | Saved AI settings (server, model, key, playbook on/off and text) |
| `layouts/*.parable-layout.json` | Built-in book designs (Spine, Poster Club) and the layout README |
| `portable-ai/` | Flash-drive Ollama setup and the Qwen3-VL test script |

## 3. Data model essentials

- **Shape:** a **Series** has lessons (`Service` with `seriesId` and `week`), and a lesson has **Sections**
  (role large / small / other), which have **Parts**.
- **Dates:** a series has **no dates**. `Series.runs: TeachingRun[]` lists each time it's taught:
  `{ id, name, time, dates: {lessonId: "YYYY-MM-DD" or a label like "Sat morning"}, labels }`.
  - `Series.printRun` picks which run's dates appear on printouts (`""` means no dates).
  - `forPrint()` maps the run onto the lessons at print time.
  - Old data with dates becomes a run called "First schedule".
- **Designs:** `Series.design` is a `BookDesign`. `custom` holds an applied layout's sanitized cover, divider and CSS.
  The design library (`db.layouts`) holds `LayoutPack`s. Applying copies one into the series, so deleting a library
  entry never changes a book.
- **Readiness:** a part counts as "ready" when it has script or instructions. Drives the progress pills.

## 4. Printing

The series book contains:
1. cover
2. "Start here" divider and leader guide page (welcome letter, inside-each-week key, series at a glance)
3. for each week:
   - divider
   - session plan
   - session overview table (times as 0:00 or run clock times)
   - large group lesson (each main section on a new page)
   - one-page small group guide
   - family page

Separate print options exist for a week, a section, a part, a run sheet, supplies, and take-home cards (two per page).

Fonts are bundled through @fontsource, so printing works offline. Print from Chrome with **Background graphics** on.
The B.L.E.S.S. book in the default design is 53 pages, so use it as a regression check.

## 5. Diana (AI) and Justin's local setup

**AI basics:**
- AI is **off by default**, and everything works without it.
- Diana's buttons only propose; nothing changes until Justin clicks "Use this" or "Add".

**The model:**
- **Qwen3-VL 8B Instruct** (`qwen3-vl:8b-instruct`) on Ollama, on a 16 GB M1 Pro. Earlier he used `qwen3:8b`.
- It's reliable at small, focused requests and weak at long structured output.
- **Rules for requests:**
  - one job per request
  - temperature 0 for JSON
  - parse leniently (strip code fences and `<think>` blocks, find the first `{…}` or `[…]`, allow trailing commas)
  - keep context around 12k
  - send the playbook trimmed (`playbookForDrafting` drops the checklist and sources, about 1,900 tokens)

**Two ways to connect** (presets in AI settings):
- **Steward on this laptop** (recommended): Justin's own local server at `http://localhost:8787`.
  - It uses a Bearer key from `~/Steward/server/steward.env`. He pastes it into the app; it's stored only in that
    browser. Never commit it, log it, or ask him to send it.
  - Steward can optionally add passages from documents in `~/Steward/docs` (off by default).
- **Ollama directly:** `http://localhost:11434`, using `/api/chat` with `think: false`, `keep_alive: "24h"` and
  `num_ctx: 12288`.
  - It needs `OLLAMA_ORIGINS` to include `https://ministryai.github.io`, otherwise the browser blocks it (CORS).

**What Diana does in Parable:**
- drafts series, lessons, parts, family cues and objectives, all following the playbook
- suggests supplies and parts
- answers questions about a lesson
- **Review**: answers the playbook checklist yes or no per question, with one fix per miss
- small text-based design changes (colors, fonts, caps), as validated patches

**What Diana should not do** (tried and abandoned): write whole cover or divider pages as code from a reference image.
An 8B model couldn't do it reliably. Those designs are made by Claude as layout files and imported.

**Justin's other setup:**
- **AIRDRIVE:** an exFAT flash drive holding an `AIKit.sparsebundle` (APFS, mounts as AIKIT). It contains ComfyUI for
  image generation, and `portable-ai/setup.sh` can install Ollama and Qwen onto it.
- **Memory:** don't run ComfyUI and the language model at the same time on 16 GB.
- **Work Mac:** keep data local.

## 6. Testing

```bash
npm install
npm run typecheck && npm run build
npx vite preview --port 8123      # then drive it with Playwright + Chromium
```

- Test in a fresh browser profile (seeded B.L.E.S.S. appears) and check the console for errors.
- For print changes, print the B.L.E.S.S. series book to PDF and look at the pages
  (`scripts/render-book-pdf.mjs --url http://localhost:8123` does this against your running build).
- **The bundled app copy:** `assets/parable-app/` is a snapshot of `dist/`, used by the PDF script. After app changes
  that affect printing, refresh it: `npm run build`, then replace the skill's `assets/parable-app/` with `dist/`.
- For AI features, use a small stand-in server that returns canned replies, and tell Justin the real model is
  untested until he tries it.

## 7. Roadmap: what was planned and not built

The UI redesign Justin approved (October 2026): **A** Shelf home + **C** Writer + **D** runs for dates are built.
These pieces from the mockups were requested ("ok add it") but not built yet:
- **Storyboard view (mockup B):** a "Board" tab on the series page.
  - A column per lesson, with part blocks whose height is proportional to minutes, colored by section.
  - Drag parts between lessons.
  - Per-lesson totals and playbook score.
  - The series practice shown as a thread across the top ("Pray → + Listen → + Share a meal…").
  - An "Ask Diana to review all" button.
- **Diana's suggestions inline in the writer (mockup C):** show Review results as a card next to the part they're
  about ("This part never names what the battery stands for… Add one line?"), with **Add it** / **Not now**.
  - Needs `reviewLesson` to return the part title exactly, plus a suggested line and which field to add it to.
  - Results shared between the Review tab and the part cards.
- **Typing "/" in a script to add a block:**
  - **Say:** a new paragraph
  - **Do:** `[ ]` with the cursor inside, which prints as a cue
  - **Ask:** `Ask: `, which prints as a bold lead-in
  - **Read:** `Read: `
  - **Cue:** `[Cue: ]`
- **Printed dividers still say "Week N":** Poster Club's per-week styling depends on that word (see `layout-files.md`).
- **Covers:** Liquid Frame and Spec Sheet exist only as sample layout files, not built in.
- **Sticker sets:** Poster Club's stickers are B.L.E.S.S.-specific, and a new series needs its own set.
