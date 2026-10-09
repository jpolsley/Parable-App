# Parable's file format, and the conventions its print engine reads

Parable imports a `.parable.json` file:
- **Shelf → More → Import a file** (older builds: Series page → Import)
- or **Library → Import**, for parts and designs

Importing a file whose ids already exist replaces those items.

## Contents
1. File shape
2. Series
3. Lesson (service)
4. Section and part
5. Conventions the printed book depends on
6. A minimal example
7. Validating

---

## 1. File shape

```json
{ "version": 1, "series": [ Series ], "services": [ Service ], "library": [], "layouts": [] }
```

Lessons are called `services` in the data (a leftover from the app's origin). A lesson belongs to a series through
`seriesId` and is ordered by `week` (1, 2, 3…). Ids are any unique strings. Use a readable prefix per series, like
`prayer-week-1` and `prayer-p-12`.

## 2. Series

| Field | Notes |
|---|---|
| `id`, `title`, `description`, `audience` | `audience` like "Students", "Middle school", "Kids" |
| `color` | `indigo` \| `sky` \| `emerald` \| `amber` \| `rose` \| `violet` \| `slate` |
| `bigIdea` | One sentence for the whole series |
| `memoryVerse` | "Text (Reference)" |
| `leaderGuide` | The welcome letter. Paragraphs separated by a blank line |
| `startDate` | Legacy. Set to `""` |
| `runs` | `[]`. Teaching runs (dates) are added in the app, not in curriculum files |
| `printRun` | `""` |
| `design` | Optional. Omit it; designs come from the design library |
| `createdAt`, `updatedAt` | Milliseconds since 1970 |

A series has **no dates**. Each time it's taught, Justin adds a *run* in the app under "When I teach it", and a run's
dates appear only on printouts for that run.

## 3. Lesson (service)

| Field | Notes |
|---|---|
| `id`, `title`, `audience` | |
| `seriesId`, `week` | `null` and `null` for a stand-alone lesson |
| `date`, `startTime` | Legacy. Set to `""` |
| `classSize`, `groupCount` | For supply math. For example 20 and 3 |
| `bigIdea` | One sentence |
| `objectives` | One per line |
| `keyVerse` | "Text (Reference)" |
| `scripture` | The passage reference, for example "Acts 8:26–38" |
| `checkedSupplies` | `[]` |
| `family` | `{ "morning": "", "onTheGo": "", "meal": "", "bedtime": "" }` |
| `sections` | See below |
| `createdAt`, `updatedAt` | Numbers |

## 4. Section and part

**Section:**

```json
{ "id": "", "title": "Opening", "role": "large", "hidden": false, "pageBreak": false, "collapsed": false, "parts": [] }
```

`role`: `large` prints in the large group lesson, `small` prints on the small group page, and `other` covers arrival,
games and announcements.

**Part:**

```json
{ "id": "", "title": "", "type": "script", "minutes": 5, "hidden": false, "pageBreak": false, "optional": false,
  "script": "", "instructions": "", "supplies": [], "media": [], "resources": [], "inclusionTips": "", "leaderNotes": "" }
```

- **`type`:** one of `script`, `bible-story`, `bible-verse`, `worship`, `video`, `game`, `group-activity`,
  `discussion`, `prayer`, `craft`, `announcement`, `other`.
- **`script`:** what the leader says, word for word. Prints in serif with a SAY label.
- **`instructions`:** what the leader does. Prints with a DO label.
- **`supplies`:** `{ "id", "name", "qty": 1, "per": "total" | "person" | "group" }`. Parable multiplies by class size
  or group count. Prints with a NEED label.
- **`media` and `resources`:** `{ "id", "label", "url" }`. Links print as QR codes.
- **`optional: true`:** prints in a "Going deeper" box and doesn't count toward the run time.

Parable fills in defaults on import (`lib/factory.ts`), so a file can leave out empty fields:
- parts: `hidden`, `pageBreak`, `optional`, empty text fields and empty lists
- sections: `hidden`, `pageBreak` and `collapsed`

`assets/bless.parable.json` does this. Always include `id`, `title`, `type`, `minutes` and any text you wrote.

## 5. Conventions the printed book depends on

These are what make Parable's book look designed instead of dumped. Follow them exactly.

**Part titles and types:**
- **Teaching points:** a part titled `Point 1: The claim` (also `Point 2 –`, `Point 3.`) prints with a big "01" and the
  claim as its heading.
- **Readings:** a part whose type is `bible-verse` or whose title starts with `Read` prints as a Scripture reading:
  - The reference is taken from the title ("Read: Acts 8:26–38" → "Acts 8:26–38").
  - Verse numbers in the text become superscripts.
  - Long passages switch to two columns.
  - A `bible-verse` part with a short script (under 400 characters) prints as a big centered verse instead.
- **Discussion questions:** a `discussion` part whose script is a numbered list (`1. …\n2. …`) prints as big numbered
  questions with an ASK label.

**Text inside a part:**
- **Stage directions:** `[Hold up the jar]` inside script text prints highlighted as a cue. A short one opening a
  paragraph becomes a tag-like cue.
  - Brackets are **stripped** on the small group page, family page and take-home cards.
  - So never put real content in brackets, such as a name placeholder. Use "(name)".
- **Lead-ins:** a paragraph starting with a short capitalized phrase and a colon ("At the door: …", "Read it: …")
  prints the phrase in bold.
- **Lists:** lines starting with `• `, `- ` or `1. ` print as real lists.
- **Paragraphs:** separate them with a blank line (`\n\n`).

**What Parable pulls into other pages:**
- **Icebreaker:** a part whose title matches "Icebreaker" or "Warm-up" goes in the small group page's "Open with" box.
- **Weekly challenge:** the challenge is the first non-game part whose title contains "Challenge", "This week",
  "Take home", "Try it" or "Apply", and that has text. It's shown on the small group page and the take-home cards.
- **Prayer:** the first `prayer` part in the Small Groups section becomes "Pray together".
- **Leading well:** the `leaderNotes` of the small group discussion part print as the "Leading well" box.

**Family page:** empty `family` fields are filled from the lesson. Write them yourself; the fallbacks are generic.

**Page fitting:**
- Each main section starts a new page.
- Sections a little too long are shrunk to fit, down to 82%.
- A section much longer than a page flows onto the next page, so trim rather than pad.

## 6. A minimal example

```json
{
  "version": 1,
  "series": [{
    "id": "pray-series", "title": "Pray Anyway", "description": "A 3-week series on honest prayer.", "audience": "Students",
    "color": "indigo", "startDate": "", "bigIdea": "God wants to hear from you, especially when it's hard.",
    "memoryVerse": "Cast all your anxiety on him because he cares for you. (1 Peter 5:7)",
    "leaderGuide": "Thank you for leading…\n\nIf a student shares abuse, self-harm, or that they are not safe, follow the church's safety policy and tell the youth pastor the same day. Never promise to keep it secret.",
    "runs": [], "printRun": "", "createdAt": 1790000000000, "updatedAt": 1790000000000
  }],
  "services": [{
    "id": "pray-week-1", "title": "Honest Prayers", "audience": "Students", "seriesId": "pray-series", "week": 1,
    "date": "", "startTime": "", "classSize": 20, "groupCount": 3,
    "bigIdea": "You can bring God the real version of you.", "objectives": "Name…\nPractice…\nDescribe…",
    "keyVerse": "…", "scripture": "Psalm 13", "checkedSupplies": [],
    "family": { "morning": "…", "onTheGo": "…", "meal": "… Parents answer too.", "bedtime": "Ask, \"Where did you see God today?\" …" },
    "sections": [
      { "id": "pray-s-1", "title": "Teaching", "role": "large", "hidden": false, "pageBreak": false, "collapsed": false, "parts": [
        { "id": "pray-p-1", "title": "Point 1: God can handle your honesty", "type": "script", "minutes": 5, "hidden": false,
          "pageBreak": false, "optional": false, "script": "[Ask first:] …", "instructions": "", "supplies": [], "media": [],
          "resources": [], "inclusionTips": "", "leaderNotes": "" }
      ]}
    ],
    "createdAt": 1790000000000, "updatedAt": 1790000000000
  }],
  "library": []
}
```

The fastest way to build a full series is to copy `scripts/build-bless.mjs` and replace its content. Its helpers
(`part`, `section`, `supply`, `paras`, `q`, `bullets`, `welcome`, `study`) handle ids and formatting. Run it with
`node build-my-series.mjs out.parable.json`.

## 7. Validating

Run `node scripts/validate-series.mjs my-series.parable.json`. It checks:
- required fields and types
- ids are unique
- week numbers
- that each lesson has the expected sections and roles, 3 "Point N:" parts, a "Read" part, numbered discussion
  questions, a "Challenge" part, family fields filled, and the leader guide's safety line
- "[name]"-style brackets in small group text

It prints warnings, not just errors. Read them.
