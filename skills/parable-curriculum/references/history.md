# Decision log

The Parable work from September to October 2026, in order. Each entry gives what Justin asked for or reacted to, and
what was decided. Use it to avoid re-proposing something he already turned down, and to understand why things are the
way they are.

## Building the app
- **Hosting:** make the AI Studio generator usable on GitHub Pages, and remove Gemini. → Self-hosted AI through any
  OpenAI-compatible server. The site deploys from GitHub Actions.
- **Builder, not generator:** AI is an accessory, like Amazing Life's service builder but "100% better". → Sections,
  parts and tabs, supplies that scale, a parts library, templates and undo.
- **No AI dependency:** → AI is off by default, and a dashboard was added (later replaced by the Shelf).
- **Series first and no beige:** "less service focused, more series focused". → Series pages; a cool white, slate and
  indigo look; Plus Jakarta Sans and Inter.
- **"The printed version must be absolutely beautiful"**, similar to his example camp curriculum and the 10:10
  Leader's Guide, but its own. Then: "this does not match… different format for small group, etc."
  → The book was reorganized by who uses each page:
  - leader guide
  - week dividers
  - session plan and overview
  - large group lesson
  - one-page small group guide
  - family page with four moments

  Section roles, the Family tab and the leader guide letter were added to the app.
- **Local AI:** Ollama + Qwen 3 8B, with a flash-drive install option. Later Qwen3-VL 8B Instruct, through his Steward
  app or Ollama directly.

## B.L.E.S.S. and the print design
- **B.L.E.S.S. built in:** prefill his B.L.E.S.S. lesson PDF, but "the design in this lesson is NOT what I want quality
  wise" and "I wanted the bless to already be in there in a better more professional layout". → It's built in as a
  sample series, with a new print layout: margin labels, serif scripts and readings with verse numbers.
- **"Holy shit the book you made is amazing."** Then:
  - Each main section starts on a new page. → Done.
  - A live preview while editing. → Done.
- **"These are odd… the header like teaching feels off":**
  - Section headers were redone.
  - The small group page uses the full width.
  - Short parts are kept together.
- **"Really awkward spacing… I don't want bottom lines at top":**
  - The Bottom line banner was removed.
  - Text flows to fill pages, and slightly long sections shrink to fit.
- **"It's missing the welcome leader pages… in the app itself":** → The Book view on the series page and the
  whole-week preview.

## Designing books
- **Designs with Diana:** "Can Diana change the theme from an image?" A ChatGPT design-spec proposal followed.
  - Built: a data-driven `BookDesign`, then Diana in small steps, then Diana writing page code from an image.
  - Result: Diana changed only colors. "No I did not want the AI to toggle between title types but to take the image
    and make it with web code like you did."
  - Then the code-writing approach failed too. "Perhaps a temporary solution is to go back… with a space to upload
    new layout… I generate it with you."
  - **Settled:** Claude writes layout files and Justin imports them. Diana stays text-only for small design tweaks.
- **Books that shaped his ministry:** → They were distilled into the **Ministry Playbook** in a separate chat.
- **Playbook review:** "Is this a good playbook?" Suggested changes, which he accepted:
  - 5 firm non-negotiables, with the rest "aim for"
  - rules written for the leader ("Tell the leader to…")
  - the safety line
  - a looser lament rule
  - the family page back to 4 moments
  - audience taken from the series

  Built into Parable as AI settings → Playbook, plus the Review tab.
- **Design library:** an imported design goes into a library, "not added as a temp design". → Built.
- **"Redesign the lessons for the BLESS"** with the playbook. → The full rewrite in `assets/bless.parable.json`. He
  asked for a detailed map of playbook-driven changes, and it's in `lesson-recipe.md`.
- **Stickers and posters:**
  - Apple sticker aesthetic → "Sticker Shop" sample.
  - "Stickers TOO central," and he shared the FUNDAMENTAL poster → "Poster Club" round 2, type-led.
  - "The symbols have an 'ai' feel. Each week doesn't need the same title page" → round 3: stock icons removed,
    a different divider each week.
  - He asked to extend the motifs onto the inside pages (tint, chips, swoops) → "Actually I hate that."
  - "Idk what do you think is best" → recommended: loud covers and dividers, calm interiors.
  - He sent back the round-3 file and its PDF: "No I like this" and "No this was the best." → Round 3 is built in as
    Poster Club.
- **Other covers:**
  - Proof Sheet reference → a literal copy → "I wanted it in the aesthetic." → Spec Sheet cover → "I don't love it."
  - FORMLESS reference → Liquid Frame cover, with no verdict before the session ended.

## The app redesign
- **"I don't like… it schedules the curriculum to dates."** → Four mockups:
  - A: Bookshelf
  - B: Storyboard
  - C: Writer
  - D: Dates only when you teach it

  Recommended A + C + D, with B optional. "Sure let's do it." → Built:
  - the Shelf
  - the series Lessons, Book and "When I teach it" tabs
  - teaching runs
  - the writer's outline
  - times from 0:00
- **"Ok add it":** the remaining mockup pieces (storyboard, inline Diana suggestions, "/" blocks). → Not built yet;
  see `parable-app.md` §7.
- **Preserving the work:** "If I lost access to Claude… I could give the skill and it would understand." → This skill.
