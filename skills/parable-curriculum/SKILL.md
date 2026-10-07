---
name: parable-curriculum
description: Write, review and design youth ministry curriculum the way Justin (a youth pastor) and Claude built it for Parable, his series-builder app. It covers series and lesson writing that follows his Ministry Playbook, printable leader books, book designs (.parable-layout.json covers and week dividers), the .parable.json files Parable imports, and work on the Parable app itself (its Diana assistant, the shelf, teaching runs). Use this skill whenever the request involves Parable, Diana, B.L.E.S.S., the Ministry Playbook, a youth or kids series, a lesson, a small group guide, a family page, a leader guide, a book cover or design for a curriculum, or Justin's ministry work, even when Parable isn't named. That includes "write me a 4-week series on…", "make this lesson better", "check this against my playbook", "make a cover like this picture" and "add a feature to Parable".
---

# Parable curriculum

This skill carries everything Justin and Claude worked out while building **Parable**. It's meant to let a fresh
Claude, on any account, pick up the work without the original conversation. It holds:
- how to write a series that follows Justin's Ministry Playbook
- how to shape it so Parable prints it as a beautiful leader book
- how to design books the way Justin likes them
- how the app itself works

## Who you're working with

- **Justin** is a youth pastor (middle school and high school students). He's not a programmer, so use plain language.
  - Explain what a file or command does before asking him to run it.
  - Give exact steps when he has to do something (merge, import, paste a key).
- **How Justin works:**
  - He often asks a question just to understand ("just a question, don't change anything"). Answer only, and change nothing.
  - For visual work he wants **sample pages first** (PDF or PNG) before anything is built into the app.
  - He reacts to what he sees: "I hate that" means drop the direction, not polish it. When he says "idk, what do you think is best", give one clear recommendation with the reason, then build it.
- **His machine:** a work-issued MacBook Pro (M1 Pro, 16 GB). Keep his data local and don't send his curriculum or files to third-party services.
- **Diana** is the AI assistant inside Parable. She runs on a small local model (Qwen3-VL 8B Instruct through Ollama, or through his "Steward" app). She is not you.
  - Diana handles small, focused requests reliably.
  - Big creative jobs (whole designs, page code from an image) fail on her model. Those are done by you, in conversation, and imported into Parable as files.

## The three kinds of work

Work out which one the request is, then read the matching references. Read only what you need.

| Request | Read | Produce |
|---|---|---|
| Write or revise a series, lesson, small group guide, family page or leader letter | `references/playbook.md`, `references/lesson-recipe.md`, `references/parable-format.md` | A `.parable.json` file Justin imports, plus a short plain-language summary |
| Review a lesson against the playbook | `references/playbook.md` (checklist in section 5) | Each checklist question answered yes or no, with one concrete fix per "no" |
| Design a book (cover, week dividers, page styling), often from a reference picture | `references/design-taste.md`, `references/layout-files.md` | A `.parable-layout.json` plus sample pages rendered to PDF or PNG |
| Change the Parable app (features, bugs, UI) | `references/parable-app.md` | Code changes on the dev branch, tested in a browser, plus a merge link |

`references/history.md` has the decision log: what was tried, what Justin rejected, and why. Read it before
proposing anything that sounds like a past direction.

`assets/` holds working examples:
- `assets/bless.parable.json`: the full B.L.E.S.S. series, the reference for lesson quality and structure.
- `assets/layouts/`: the built-in designs, plus rejected or unused samples, each marked in `assets/layouts/README.md`.

`scripts/` holds the generators that made them. Copy their patterns rather than starting from scratch.

## Writing curriculum: the workflow

1. **Get the essentials.** Ask only for what you can't sensibly assume:
   - audience (students by default)
   - number of lessons
   - topic or passages
   - the series practice, if Justin has one in mind
2. **Outline first.** Write the series outline and share it before writing every lesson:
   - title and big idea
   - memory verse
   - the one practice that grows each week
   - for each lesson: title, passage, big idea, the hard part to name, the real-life connection
   - where the lament, the service challenge and the invitation fall

   An outline is cheap to change and a full series isn't.
3. **Write each lesson with the recipe** in `lesson-recipe.md`: the same five sections every week, the same welcome
   rhythm, the same study method and the same practice moment. Make the week-specific parts strong: the illustration,
   the three points, the challenge and the questions.
4. **Shape it for print.** Use the conventions in `parable-format.md`:
   - "Point 1: …" titles
   - "Read: Passage" parts
   - numbered discussion questions
   - `[stage cues]` in brackets
   - section roles

   Parable's print engine reads these to lay out the book. Content that ignores them prints as plain blocks.
5. **Self-review against the checklist** (playbook section 5) before handing it over. Fix the misses.
6. **Deliver:**
   - **The `.parable.json` file.** Run `scripts/validate-series.mjs` on it first.
   - **A summary:** what's in each lesson, what you assumed, and anything Justin should check.
   - **The import step:** Shelf → More → Import a file.

**Accuracy rules** (from experience):
- **Scripture:** don't type out passages from memory. A wrong verse in a printed book is worse than none. Either:
  - use text Justin supplies, or
  - tell the leader which passage to read aloud from a Bible (leave the `script` empty on the "Read:" part, and put the instruction in `instructions`).
- **Facts and statistics:** don't invent them. If you can't verify one, say it softly ("surveys keep finding…") or leave it out.
- **Copyright:** with published books or curricula, keep ideas and practices in your own words. Use only short, credited quotes.
- **Reworking Justin's material:** list what you changed, fixed, or added so he can check it. He appreciated this every time.

## Designing a book: the workflow

1. **Read the reference for its feel, not its layout.** Justin said: "I didn't want the actual look. I wanted it in
   the aesthetic." Name the qualities, then translate them into an original composition:
   - palette
   - type personality
   - density
   - the one loud element
   - texture
   - motifs

   Never trace the reference's arrangement or copy its artwork.
2. **Loud covers and dividers, calm interiors.** Leaders read inside pages mid-sentence while teaching. All the
   poster energy goes on the cover and week dividers. Inside pages carry only a few quiet links to the cover: the
   display font on section titles, flat label tags, and the black big-idea box. See `design-taste.md`.
3. **Write the layout file** following `layout-files.md`. It's HTML and inline SVG with `{{placeholders}}`, plus scoped CSS.
   Parable's sanitizer strips anything outside its allow-list, so check that list before using a feature.
4. **Render real sample pages.** Print B.L.E.S.S. with the layout applied (`scripts/render-book-pdf.mjs`), look at
   every page yourself, and fix anything that overlaps, overflows, or leaves blank pages before showing Justin.
5. **Show samples and ask what to change.** Only add a design to Parable's built-in library once he's chosen it.

## Changing the app

Read `references/parable-app.md` for:
- the repo and branch rules
- the file map and data model
- how Diana is wired
- how to test

**The non-negotiables:**
- **Steward key:** never commit it. It lives in `~/Steward/server/steward.env` on his Mac and he pastes it into the app.
- **AI is optional:** Parable must work fully with AI off.
- **Diana's requests stay small:** one focused request, temperature 0 for structured output, and lenient JSON parsing.
- **Test before handing over:** test in a real browser, check the console for errors, and print the B.L.E.S.S. book to PDF to check that pages still fit.
- **Report in plain language:** what changed, how you checked it, and the merge link.

## Writing for Justin

- Lead with the result.
- Short sections, bullets for anything list-shaped, no jargon. When a term is unavoidable, explain it in a few words.
- Say plainly what you didn't test (for example, "tested against a stand-in for Diana, not your real model").
