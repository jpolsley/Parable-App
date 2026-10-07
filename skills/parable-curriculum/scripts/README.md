# Scripts

All are Node scripts (Node 18+). Each layout generator writes one `.parable-layout.json`:
`node make-poster.mjs out.parable-layout.json`.

| Script | What it does |
|---|---|
| `validate-series.mjs` | Checks a `.parable.json` series against the format and the lesson recipe. Run it before handing over any curriculum. |
| `render-book-pdf.mjs` | Prints a series book to PDF from a locally running Parable, optionally importing a design or a series first. Needs Playwright and Chromium. |
| `build-bless.mjs` | Builds the playbook edition of B.L.E.S.S. (`../assets/bless.parable.json`). **Copy this to write a new series**; its helpers handle ids and formatting. |
| `make-poster.mjs` | Poster Club. The cover and dividers are identical to the built-in design. Its inside-page CSS is the later "calm" variant. The shipped round-3 CSS (Justin's pick) is in `../assets/layouts/poster-club.parable-layout.json`, so to rebuild the built-in design exactly, copy the `css` field from that file. |
| `make-poster-loud.mjs` | The "loud interiors" Poster Club pass Justin rejected ("Actually I hate that"). Kept as a record. |
| `make-halftone.mjs` | Sticker Shop: neon cut-paper stickers with real halftone dots. Not chosen (stickers too central), but its sticker and halftone code is reused by Poster Club. |
| `hulls.mjs` + `icons.json` → `hulls.json` | Computes the cut-paper backing outline around each sticker icon. Rerun it when adding icons: `node make-halftone.mjs --icons > icons.json && node hulls.mjs`. |
| `make-spine.mjs` | Spine (built in): dark board, blue spine stripe, huge vertical title. |
| `make-proof.mjs` | Proof Sheet sample: rejected, because it copied the reference's layout. |
| `make-spec.mjs` | Spec Sheet cover sample: "I don't love it." |
| `make-liquid.mjs` | Liquid Frame cover sample: a strict frame around melting type. No verdict yet. |

Patterns worth reusing:
- a seeded `rnd()` so every build is identical
- `f()` to round coordinates and keep files small
- `star()`, `sparkle()`, `ribbons()` and `grainTile()` from `make-poster.mjs`
- the halftone `<pattern>` and clip regions, and the per-week CSS keyed off `.pcdv[class~="N"]`
