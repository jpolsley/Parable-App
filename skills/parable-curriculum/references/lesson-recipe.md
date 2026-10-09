# The lesson recipe

How a Parable series is written, distilled from rewriting B.L.E.S.S. to follow the playbook. Justin approved the
result: "holy shit the book you made is amazing". The full series is `assets/bless.parable.json`, and the script that
builds it is `scripts/build-bless.mjs`. Read one complete week of that script before writing a new series. It shows
the voice better than any description.

## Contents
1. The series layer
2. One lesson, section by section
3. Timing
4. The other printed pages (small group, family, leader guide)
5. Voice
6. Checklist before you hand it over

---

## 1. The series layer

Decide these before writing any lesson. Plan them yourself and go straight on to writing; list your choices in the final report rather than stopping to ask (unless Justin asked for an outline):

- **Title, audience, description, big idea** (one sentence for the whole series), and **memory verse**. Tie the verse
  to the series name if you can. B.L.E.S.S. uses Genesis 12:2, "I will bless you… and you will be a blessing."
- **One practice that grows a little each week, in the same format every week.** This is the spine of the series.
  - B.L.E.S.S. has *The Three Names*. In week 1 each student writes three names on a "BLESS card." Every week the group
    holds the card and prays for those names for about 30 seconds.
  - Each week adds one step: pray, then listen, then share a meal, then serve alongside, then pray for a door to share
    your story.
  - The same short part appears in every lesson's Application ("Practice: The Three Names").
- **A lament passage** when the series' passages allow it. If they don't, the small group prays a lament from a psalm
  (B.L.E.S.S. week 4 uses Psalm 13).
- **A service challenge with real personal contact**, framed as "with, not for." Debrief it in next week's small
  group with the four questions: What did you see and feel? What's broken? What does our faith say? What is God
  calling you to do?
- **A clear, gentle invitation**, usually in the final lesson. In B.L.E.S.S. it's "An Open Door": a response card
  with four boxes:
  - I want to start following Jesus.
  - I want to take a next step.
  - I have questions.
  - Not right now, and that's okay.

  The leader collects every card, filled in or blank, so no one stands out. Leader notes cover one-on-one follow-up
  and the safety policy.
- **Per lesson**, plan:
  - title
  - passage (complete, not a lone verse)
  - key verse
  - big idea (one sentence)
  - 3 objectives
  - the **hard part** of the passage you'll name
  - the **real teen moment** it connects to
  - the **physical element**
  - the **student role** prepared ahead

## 2. One lesson, section by section

Every lesson uses the same five sections in this order. Sections 1–4 have role `large` and Small Groups has role
`small` (see `parable-format.md`). Each main section starts a new printed page.

### Opening (large)
- **Welcome** (script, 4 min). This is the same rhythm every week, word for word where possible.
  - Instructions (bullets):
    - At the door: greet every student by name.
    - Newcomers: introduce each one to a host student (chosen ahead) who sits with them and walks them to small group.
    - Check-in: one quick question answered with a word or thumbs up, sideways or down. Anyone can pass.
  - Script:
    - A warm welcome for first-timers, pointing out the host students.
    - "You don't have to leave anything at the door tonight. Bring your worries… God can handle every bit of it."
      Never "leave your worries at the door".
    - Then the check-in question with "[Take a few answers. Anyone can pass.]".
- **Illustration: …** (script, game or group-activity, 6–9 min). It must tie to a real teen moment and work for
  anyone without embarrassment.
  - Script: open with a question, take answers, then a short leader story.
  - Include the physical object and "[Hold up the charger.]" cues.
  - End with a line that sets up the lesson ("Tonight is about the power source.").
  - Supplies listed.
- **Transition** (2 min). A sentence connecting the illustration to the practice, then a short prayer cue.

### Scripture (large)
- **Background** (script, 3 min). Three short paragraphs:
  - genre and setting
  - the human story behind it
  - **one paragraph placing it in God's big story** (creation, fall, redemption, new creation), with a cross-reference
- **Read: Book ch:vv–vv** (type `bible-verse`, 3–5 min).
  - Title starts with "Read:" so it prints as a reading.
  - Put the passage text in `script` only if Justin supplied it. Otherwise leave `script` empty and write in
    `instructions`: "Have your student reader read … aloud from a Bible or a Bible app."
  - leaderNotes: "Student role: by midweek, ask a student to read the passage and send it to them so they can practice."
- **Read It · Sit In It · Live It** (discussion, 6 min). The study method, the same three moves every week, as a
  numbered list:
  1. Read it: what does it say? Point to repeated words or details.
  2. Sit in it: put students inside the story ("Imagine you're…").
  3. Live it: what would it look like to try this?

### Teaching (large)
- **Exactly 3 parts titled "Point 1: …", "Point 2: …", "Point 3: …"** (script, about 5 min each). The point title is a
  short claim ("Prayer asks for growth, not just gifts").
- Across the three points, include:
  - **[Ask first:]** a question before the answer, at least in Point 1
  - one point tied to school, friends, home or the news, with a *specific* moment ("'I'm fine' in the group chat")
  - one physical or sensory element ("[Hold up the gift card in one hand and the plant in the other.]")
  - a clear "Christians believe…" statement, framed as relationship with Jesus
  - **the hard part, named**, usually in Point 3 ("let's be honest about the hard part…"), never skipped
  - a cue for the leader's own story: "[Leader: in a minute or less, share about…]"
  - **the last line of Point 3**: "Jesus welcomes you exactly as you are…" in that week's words
- Quote the passage with verse numbers in parentheses ("(v. 9)").

### Application (large)
- An optional activity (group-activity, 8–10 min), for example the FRANCS people map or the five-finger Story Tool,
  practiced in pairs.
- **Practice: The Three Names** (or the series' practice; prayer, 3 min). The same format every week, plus this week's
  added step.
- **Weekly Challenge: …** (script, 2–4 min).
  - The title must contain "Challenge" so Parable finds it for the small group and family pages.
  - It's a small form of the practice the group just did.
  - Frame it as an experiment: "Try this and notice what happens."
  - Each week's step is a little bigger than the last.

### Small Groups (small)
- **Icebreaker** (discussion, 3 min). Low-risk, and anyone can answer ("What's one thing that recharges you…?").
- **Discussion** (discussion, 12–14 min). 5–6 numbered questions in this order:
  1. personal experience
  2. what the passage says, including one "I wonder…" question
  3. what's hard to believe or understand
  4. "Where did you see God this week? Where did God feel far away?"
  5. a response question, with the option to keep it private

  `leaderNotes` holds two bullet lines, and Parable prints them as the "Leading well" box:
  - "• Affirm before adding your view, don't correct the first answer, never require anyone to talk, and bring the
    group back to the passage."
  - "• " plus one tip specific to this week, for example how to respond if someone says prayer feels pointless.
- **Prayer** (prayer, 5 min). "30 seconds of silence." Then teach one simple prayer students can use alone, and name
  pain honestly without promising a fix.
  - Use "(name)", not "[name]". Square brackets are stage directions and get stripped on some pages.

## 3. Timing

Aim for 65–75 minutes. B.L.E.S.S. runs 67–72, plus 86 for the finale with the invitation.

| Section | Minutes |
|---|---|
| Opening | 12–14 |
| Scripture | 12–14 |
| Teaching | 15–16 |
| Application | 5–18 |
| Small Groups | 20–22 |

Parable shows times as minutes from the start (0:00, 0:04…). Clock times only come from a teaching run.

## 4. The other printed pages

- **Small group page:** Parable builds this from the Small Groups section:
  - icebreaker
  - numbered questions
  - prayer
  - "Leading well" notes
  - the weekly challenge
  - big idea and key verse

  Keep the whole small group section to one printed page (about 6 questions maximum).
- **Family page:** four fields on each lesson (`family`):
  - `morning`: a short prayer or one line from the passage
  - `onTheGo`: connect to the family's week, plus **one thing to do together**
  - `meal`: an open dinner question, ending "Parents answer too."
  - `bedtime`: "Ask, 'Where did you see God today?'" plus a short prayer, plus "A note for parents: …" (hard
    questions often mean faith is becoming their own; listen first)
- **Leader guide** (`series.leaderGuide`): a welcome letter of 3–4 paragraphs, following the playbook's leader posture:
  - being known matters more than being impressive
  - pray for each student by name
  - "I don't know, I wonder too"
  - sit with the student who isn't included
  - stay close in doubt
  - behavior can come from something hard

  It always ends with the **safety line**: "If a student shares abuse, self-harm, or that they are not safe, follow the
  church's safety policy and tell the youth pastor the same day. Never promise to keep it secret."

## 5. Voice

- Write the leader's words as they'd actually say them to teenagers: short sentences, warm, a little funny, never
  preachy.
- Use the playbook's word list:
  - "I wonder…"
  - "Try this and notice what happens"
  - "Who wants to…?"
- Avoid:
  - "you should"
  - "the right answer is"
  - "the less fortunate"
  - calling on anyone who hasn't volunteered
- Make the examples specific and current:
  - group chats and phone batteries
  - the cafeteria table
  - a story online about a hangout you weren't invited to
  - the custodian
  - a grandparent in a care home
- Middle school: shorter and more concrete, with more movement. High school: more tension and more student leadership.
- Stage directions go in brackets inside the script: "[Take answers.]", "[Pause.]", "[Hold up …]". A short bracket at
  the very start of a paragraph prints as a highlighted cue.

## 6. Checklist before you hand it over

- Every lesson passes the 12 playbook checklist questions. Go through them one by one, and fix misses before
  delivering.
- The practice appears in every lesson with its new step, and the challenge grows each week.
- The lament, the service challenge (plus next week's debrief) and the invitation each appear once in the series.
- No Scripture typed from memory, and no unverified statistics.
- `scripts/validate-series.mjs` passes.
- List what you assumed or changed, for Justin to check.
