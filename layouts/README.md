# Layout files

A layout file (`*.parable-layout.json`) is a complete book design in code. Import it in Parable under
**Series → Design → Layouts → Import layout file**. It's kept in that browser's layout library and can be
applied to any series. `spine.parable-layout.json` is the first one.

```json
{
  "id": "spine-v1",
  "name": "Spine",
  "description": "One line shown in the layout list.",
  "design": { "palette": {}, "type": {}, "page": {}, "components": {} },
  "cover": "<div style=\"position:relative;width:8.5in;height:11in;…\">…</div>",
  "divider": "<div style=\"position:relative;width:8.5in;height:11in;…\">…</div>",
  "css": ".pr-head { border-bottom: 4pt solid #111; }"
}
```

- **design**: the same settings the Design screen edits (see `BookDesign` in `types.ts`). Lesson pages follow them.
- **cover / divider**: one root element, 8.5in × 11in, using HTML with inline styles and inline SVG.
  Text goes in through placeholders:
  - cover: `{{title}}`, `{{subtitle}}`, `{{eyebrow}}`, `{{dates}}`, `{{weeks}}`, `{{audience}}`, `{{verse}}`
  - divider (each week, and the leader guide opener): `{{title}}`, `{{subtitle}}`, `{{kicker}}`, `{{idea}}`
  - Add `data-fit` to a box with a fixed width and height to shrink its text until it fits (long titles).
- **css**: extra rules for any page (page heads `.pr-head`, section heads `.pr-sec-head`, parts `.pr-p-head`,
  small group `.pr-sg-…`, family `.pr-family-…`). Parable scopes them to the book they're applied to.

Parable cleans everything on import: pages keep only layout and drawing elements and presentational
attributes (no scripts, images, links, outside files or event handlers); CSS keeps plain rules only
(no `@import`/`@font-face`, no outside `url()`). Fonts available: Oswald, Space Grotesk, Plus Jakarta Sans,
Inter, IBM Plex Mono, Fraunces, DM Serif Display, Nunito (use their family names, e.g. `'Oswald Variable'`).
