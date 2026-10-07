# Writing a book design (`.parable-layout.json`)

A layout file is a complete book design in code: a cover page, a divider page (used for every week and the leader
guide opener), CSS that restyles any page, and the settings for colors and fonts. Justin imports it under
**Library → Book designs → Import design file**, or **Design → Design library** in a series. Importing saves it to the
library; it changes no book until he picks it and presses **Apply**. Importing a file with the same `id` replaces the
saved version.

Working examples are in `assets/layouts/`, and the scripts that generate them are in `scripts/make-*.mjs`. Generate
layouts with a script rather than by hand: you'll need loops for stars, grain, halftone and per-week variants.

## Contents
1. File shape
2. Placeholders and per-week styling
3. What survives the sanitizer
4. CSS hooks for inside pages
5. Techniques that work
6. Pitfalls we hit
7. Rendering samples

---

## 1. File shape

```json
{
  "id": "poster-club-v1",
  "name": "Poster Club",
  "description": "One line shown in the library.",
  "design": { "palette": {}, "type": {}, "page": {}, "components": {} },
  "cover": "<div style=\"position:relative;width:8.5in;height:11in;overflow:hidden;…\">…</div>",
  "divider": "<div class=\"pcdv {{title}}\" style=\"position:relative;width:8.5in;height:11in;overflow:hidden\">…</div>",
  "css": ".pr-sec-head h2 { … }"
}
```

**`design`** is a partial `BookDesign`. Only these fields matter for lesson pages:
- `palette`: `{ paper, ink, accent, secondary, muted, deep }`, as hex strings. `deep: ""` means derived from the accent.
- `type.display`: `jakarta` | `fraunces` | `dmserif` | `oswald` | `nunito` | `grotesk` | `inter` | `mono`
- `type.body`: `serif` | `sans` | `rounded`
- `type.label`: `sans` | `mono`
- `type.headingCase`: `normal` | `caps`
- `page.corners`: `round` | `soft` | `square`
- `page.headerRule`: `ink` | `accent` | `heavy`
- `page.mark`: `none` | `x` | `ring` | `arrow` | `crosshair` | `barcode` | `dot`
- `components.questions`: `numbers` | `boxed`
- `components.scripture`: `panel` | `rule`

**`cover` and `divider`** are each one root element, 8.5in × 11in. They're HTML with inline styles, plus inline SVG.

## 2. Placeholders and per-week styling

**Cover placeholders:**
- `{{title}}`, `{{subtitle}}` (big idea), `{{eyebrow}}`
- `{{dates}}`: empty when printing without a run, so design for it to be blank
- `{{weeks}}`: e.g. "05"
- `{{audience}}`, `{{verse}}`

**Divider placeholders:**
- `{{title}}`: "Week 3", or "Leader guide" for the opener
- `{{subtitle}}`: the lesson title
- `{{kicker}}`: the series title, plus " · date" when a run is printed, or the audience
- `{{idea}}`: the big idea

**Placeholders also work inside attributes.** Poster Club's divider root is `class="pcdv {{title}}"`, which becomes
`class="pcdv Week 3"`. Its CSS then uses `.pcdv[class~="3"] …` to give week 3 its own background, layout and badge.
The leader guide divider has no "Week" class, so it gets the base style. Parable's dividers still print "Week N"
because of this. Don't change that wording in the app without updating designs that depend on it.

**`data-fit`:** put it on a box with a fixed width and height, and Parable shrinks the text inside until it fits.
Use it on every title box, since series titles vary from "Hope" to "God's Quiet Friend: Prayer for Little Hands".

## 3. What survives the sanitizer

Parable cleans everything on import (`lib/customPage.ts`). Anything not listed below is silently removed.

- **HTML tags:** `div span p h1 h2 h3 b strong i em br small`
- **SVG tags:** `svg g rect circle ellipse line polyline polygon path text tspan defs linearGradient radialGradient
  stop clipPath mask pattern`
- **Attributes:**
  - `style class id viewBox preserveAspectRatio x y x1 y1 x2 y2 cx cy r rx ry width height d points transform`
  - `fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-dasharray`
  - `opacity font-family font-size font-weight letter-spacing text-anchor dominant-baseline offset stop-color stop-opacity`
  - `clip-path mask patternUnits gradientUnits gradientTransform dx dy rotate xmlns data-fit`
- **Not allowed** (stripped):
  - `patternTransform`: draw rotated hatching straight into the pattern tile instead
  - `clipPathUnits`, `maskUnits`
  - `<image>`, `<use>`, `<a>`, `<filter>`, `<foreignObject>`, `<style>` inside the page
  - event handlers
  - `url(...)` anywhere except same-page references like `url(#stripes)`
- **Fixed positioning:** `position:fixed` becomes `absolute`.
- **Size limit:** 40,000 characters per field. Keep SVG coordinates to one decimal place, and reuse patterns.
- **CSS** must be plain rules only:
  - no `@media`, `@import`, `@font-face`, `@keyframes` or any other at-rule
  - no outside `url()`
  - every selector is scoped to the book automatically
- **Fonts** (use these family names):
  - `'Plus Jakarta Sans Variable'`
  - `'Oswald Variable'`
  - `'Space Grotesk Variable'`
  - `'Inter Variable'`
  - `'IBM Plex Mono'`
  - `'Fraunces Variable'`
  - `'DM Serif Display'`
  - `'Nunito Variable'`
  - `'Source Serif 4 Variable'`

  Check `index.css` or `index.tsx` in the repo for the exact current list if a font doesn't render.
- **No photos.** Images aren't allowed. Halftone people or objects have to be drawn as SVG.

## 4. CSS hooks for inside pages

Inspect the rendered book in a browser for the full list. The common ones:

| Area | Classes |
|---|---|
| Page head and title | `.pr-head`, `.pr-head h1` |
| Section head | `.pr-sec-head` (with `.pr-eyebrow` and `h2`) |
| Part head | `.pr-p-head`, `.pr-p-num` (the 01/02/03 point numbers), `.pr-p-kind` |
| Margin labels and bodies | `.pr-m-label` (SAY/DO/ASK…), `.pr-m-body` |
| Spoken text and stage cues | `.pr-say`, `.pr-serif`, `.pr-cue`, `.pr-direction` |
| Lead-ins and lists | `.pr-lead` (bold lead-ins), `.pr-questions`, `.pr-list` |
| Readings | `.pr-reading`, `.pr-bigverse` |
| Session plan and overview | `.pr-plan`, `.pr-overview` |
| Small group page | `.pr-sg`, `.pr-sg-…`, `.pr-sg-notes` ("Leading well") |
| Family page | `.pr-family`, `.pr-family-…` |
| Leader guide extras | `.pr-legend` (the "symbols in use" key; Poster Club hides it) |

Keep inside-page CSS restrained (see `design-taste.md`). Changing type sizes or padding changes how pages fit, so
re-render and check page counts.

## 5. Techniques that work

- **Layers:** in a `position:relative` root, stack absolutely-positioned layers from back to front:
  1. background
  2. ribbons
  3. ghost word
  4. stars
  5. crisp title
  6. badges
  7. grain
- **Giant ghost type:** an SVG `<text>`, or a huge div, in a darker tone of the background, bleeding off the page
  behind the title.
- **Halftone:** two or three `<pattern>`s of dots at different radii, applied to the same shape clipped into regions
  (light, mid, shadow). The dots really change size.
- **Paper grain:** a 64×64 pattern tile of random small dark and light specks at low opacity, laid over the whole
  page. Add soft fold lines and slightly worn corners for a printed-poster finish.
- **Stickers:** a cut-paper backing traced around the icon (a convex hull with padding, see `scripts/hulls.mjs`),
  outlined in ink, with halftone icon art on top.
- **Spiky stars and sparkles:** generated polygons with a little randomness, using a seeded random function so builds
  are repeatable.
- **Per-week variety:** base styles on `.pcdv`, then `.pcdv[class~="2"] .title { top: …; text-align: right }` and so
  on. Put each week's optional pieces in the markup with a class, and show or hide them per week.

## 6. Pitfalls we hit

- **Shapes leaking past the page:** rotated elements or pseudo-elements poking past the page edges either shrank the
  printed page or printed onto the previous page. Keep everything inside the 8.5 × 11in box, with `overflow:hidden`
  on the root. Move stickers inward, and give headers some top padding.
- **Inline styles vs. CSS:** an inline `style` beats your CSS `display:none`. Put anything that per-week CSS needs to
  toggle into the CSS, not inline.
- **`data-fit` and transforms:** combining `data-fit` with a `transform: scaleY(...)` on the same title made it
  shrink wrongly. Don't transform fitted boxes.
- **Blank pages:** card-style session plans or small group pages that grow by a few lines leave a blank page. Parable
  shrinks `.pr-plan`, `.pr-family`, `.pr-sg` and sections to fit (down to 82%), but big padding still breaks it.
- **Colors on office printers:** neon and hot pink print dull and use a lot of ink. Keep inside pages white.

## 7. Rendering samples

Always look at real pages before showing Justin. You need Node and Playwright with Chromium. No repo is needed, because the
script serves the copy of Parable bundled in `assets/parable-app/`.

```bash
node scripts/render-book-pdf.mjs out.pdf --layout path/to/design.parable-layout.json
```

The script imports the design, applies it to B.L.E.S.S., prints the whole series book to PDF, and reports console
errors. Add `--series file.parable.json` to print another series. Add `--url http://localhost:8123` to use a running
dev copy of Parable instead, for example when you've changed the app itself. Convert pages to PNG (for example with PyMuPDF: `page.get_pixmap(dpi=60).save(...)`, or `pdftoppm -png -r 60 out.pdf page`) and look at every page: covers,
every divider, a full week of inside pages, and the small group and family pages. Check that the page count stays
about the same as before (B.L.E.S.S. is 53 pages in the default design).

Without a repo checkout, you can still preview a cover or divider:
1. Replace the placeholders with B.L.E.S.S. text.
2. Wrap it in an HTML page with an 8.5in × 11in body.
3. Print it with Chromium.

That shows the art, but not the inside pages.
