// Check a .parable.json series file before handing it to Justin.
// Errors would break the import or the printed book. Warnings are departures from the lesson recipe, so read them.
//
//   node validate-series.mjs my-series.parable.json
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('Usage: node validate-series.mjs file.parable.json'); process.exit(1); }
const db = JSON.parse(readFileSync(file, 'utf8'));
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const TYPES = ['script', 'bible-story', 'bible-verse', 'worship', 'video', 'game', 'group-activity', 'discussion', 'prayer', 'craft', 'announcement', 'other'];
const COLORS = ['indigo', 'sky', 'emerald', 'amber', 'rose', 'violet', 'slate'];
const ROLES = ['large', 'small', 'other'];
const PER = ['total', 'person', 'group'];
const str = (v) => typeof v === 'string';
// Parable fills these in on import (lib/factory.ts), so a file may leave them out.
const PART_DEFAULTS = { hidden: false, pageBreak: false, optional: false, script: '', instructions: '', inclusionTips: '', leaderNotes: '', supplies: [], media: [], resources: [] };
const SECTION_DEFAULTS = { hidden: false, pageBreak: false, collapsed: false };
const fill = (obj, defaults) => { for (const [k, v] of Object.entries(defaults)) if (obj[k] === undefined) obj[k] = v; return obj; };
const ids = new Map();
const seeId = (id, where) => {
  if (!str(id) || !id) return err(`${where}: missing id`);
  if (ids.has(id)) err(`${where}: id "${id}" also used by ${ids.get(id)}`);
  ids.set(id, where);
};

if (db.version !== 1) err('version must be 1');
if (!Array.isArray(db.series) || !Array.isArray(db.services)) err('series and services must be arrays');

for (const s of db.series ?? []) {
  const w = `series "${s.title}"`;
  seeId(s.id, w);
  for (const k of ['title', 'description', 'audience', 'bigIdea', 'memoryVerse', 'leaderGuide']) if (!str(s[k])) err(`${w}: ${k} must be text`);
  if (!COLORS.includes(s.color)) err(`${w}: color must be one of ${COLORS.join(', ')}`);
  if (!Array.isArray(s.runs)) warn(`${w}: add "runs": [] and "printRun": ""`);
  if (!/safety policy/i.test(s.leaderGuide ?? '')) warn(`${w}: leader guide is missing the safety line`);
  if (!s.bigIdea?.trim()) warn(`${w}: no series big idea`);
  if (!s.memoryVerse?.trim()) warn(`${w}: no memory verse`);

  const lessons = (db.services ?? []).filter((x) => x.seriesId === s.id).sort((a, b) => a.week - b.week);
  if (!lessons.length) warn(`${w}: has no lessons`);
  lessons.forEach((l, i) => { if (l.week !== i + 1) warn(`${w}: lesson weeks should run 1..${lessons.length} (found ${l.week} at position ${i + 1})`); });
  const challengeTitles = lessons.map((l) => l.sections?.flatMap((x) => x.parts ?? []).find((p) => /challenge/i.test(p.title))?.title).filter(Boolean);
  if (challengeTitles.length && new Set(challengeTitles).size === 1 && lessons.length > 1) warn(`${w}: every weekly challenge has the same title; each week's step should grow`);
}

for (const l of db.services ?? []) {
  const w = `lesson ${l.week ?? ''} "${l.title}"`;
  seeId(l.id, w);
  if (l.seriesId && !(db.series ?? []).some((s) => s.id === l.seriesId)) err(`${w}: seriesId "${l.seriesId}" is not in this file`);
  for (const k of ['title', 'audience', 'bigIdea', 'objectives', 'keyVerse', 'scripture']) if (!str(l[k])) err(`${w}: ${k} must be text`);
  if (typeof l.classSize !== 'number' || typeof l.groupCount !== 'number') err(`${w}: classSize and groupCount must be numbers`);
  if (!l.family || ['morning', 'onTheGo', 'meal', 'bedtime'].some((k) => !str(l.family[k]))) err(`${w}: family needs morning, onTheGo, meal, bedtime`);
  else {
    if (['morning', 'onTheGo', 'meal', 'bedtime'].some((k) => !l.family[k].trim())) warn(`${w}: a family moment is empty (Parable fills it with something generic)`);
    if (l.family.meal && !/parents/i.test(l.family.meal)) warn(`${w}: dinner question should say "Parents answer too."`);
    if (l.family.bedtime && !/where did you see god/i.test(l.family.bedtime)) warn(`${w}: bedtime should ask "Where did you see God today?"`);
  }
  if (!Array.isArray(l.sections)) { err(`${w}: sections must be an array`); continue; }

  const parts = [];
  for (const sec of l.sections) {
    fill(sec, SECTION_DEFAULTS);
    for (const p of sec.parts ?? []) fill(p, PART_DEFAULTS);
    seeId(sec.id, `${w} section "${sec.title}"`);
    if (!ROLES.includes(sec.role)) err(`${w} section "${sec.title}": role must be large, small or other`);
    for (const k of ['hidden', 'pageBreak', 'collapsed']) if (typeof sec[k] !== 'boolean') err(`${w} section "${sec.title}": ${k} must be true/false`);
    for (const p of sec.parts ?? []) {
      const pw = `${w} › "${p.title}"`;
      seeId(p.id, pw);
      parts.push({ ...p, section: sec });
      if (!TYPES.includes(p.type)) err(`${pw}: type must be one of ${TYPES.join(', ')}`);
      if (typeof p.minutes !== 'number') err(`${pw}: minutes must be a number`);
      for (const k of ['script', 'instructions', 'inclusionTips', 'leaderNotes']) if (!str(p[k])) err(`${pw}: ${k} must be text`);
      for (const k of ['hidden', 'pageBreak', 'optional']) if (typeof p[k] !== 'boolean') err(`${pw}: ${k} must be true/false`);
      for (const k of ['supplies', 'media', 'resources']) if (!Array.isArray(p[k])) err(`${pw}: ${k} must be an array`);
      for (const x of p.supplies ?? []) { seeId(x.id, `${pw} supply`); if (!PER.includes(x.per)) err(`${pw}: supply "${x.name}" per must be total, person or group`); }
      for (const x of [...(p.media ?? []), ...(p.resources ?? [])]) seeId(x.id, `${pw} link`);
      if (sec.role === 'small' && /\[(name|student|friend)[^\]]*\]/i.test(p.script)) warn(`${pw}: "[name]" is a stage direction and gets stripped on the small group page; write "(name)"`);
      if (/\byou should\b|less fortunate|the right answer is/i.test(p.script)) warn(`${pw}: uses a phrase the playbook avoids ("you should", "less fortunate", "the right answer is"); fine only if the script names it to reject it`);
      if (/leave (your|those|all your) worries at the door/i.test(p.script)) warn(`${pw}: never tell students to leave their worries at the door`);
    }
  }
  if (!l.seriesId) continue; // stand-alone lessons can be shaped differently

  const titles = l.sections.map((s) => s.title.toLowerCase());
  for (const want of ['opening', 'scripture', 'teaching', 'application', 'small group']) {
    if (!titles.some((t) => t.includes(want))) warn(`${w}: no "${want}" section`);
  }
  if (!l.sections.some((s) => s.role === 'small')) warn(`${w}: no section with role "small", so no small group page`);
  const points = parts.filter((p) => /^point\s+\d+\s*[:.–—-]/i.test(p.title));
  if (points.length !== 3) warn(`${w}: ${points.length} "Point N:" parts (the recipe uses exactly 3)`);
  if (!parts.some((p) => p.type === 'bible-verse' || /^read\b/i.test(p.title))) warn(`${w}: no "Read: …" scripture part`);
  const discussion = parts.filter((p) => p.type === 'discussion' && p.section.role === 'small' && !/ice.?breaker/i.test(p.title));
  const qs = discussion.flatMap((p) => p.script.split('\n').filter((x) => /^\s*\d+[.)]\s/.test(x)));
  if (!qs.length) warn(`${w}: small group discussion has no numbered questions`);
  if (qs.length > 7) warn(`${w}: ${qs.length} discussion questions may not fit on one small group page`);
  const qText = qs.join(' ');
  if (!/i wonder/i.test(qText)) warn(`${w}: no "I wonder…" question`);
  if (!/where did you see god/i.test(qText)) warn(`${w}: no "Where did you see God this week? Where did God feel far away?" question`);
  if (!discussion.some((p) => p.leaderNotes.trim())) warn(`${w}: discussion has no leaderNotes (prints as "Leading well")`);
  if (!parts.some((p) => /ice.?breaker|warm.?up/i.test(p.title))) warn(`${w}: no Icebreaker part`);
  if (!parts.some((p) => p.type === 'prayer' && p.section.role === 'small')) warn(`${w}: small group has no prayer part`);
  if (!parts.some((p) => !['game', 'group-activity', 'craft'].includes(p.type) && /challenge|this week|take.?home|try it|apply/i.test(p.title) && (p.script.trim() || p.instructions.trim()))) warn(`${w}: no weekly challenge part (title containing "Challenge")`);
  const total = parts.filter((p) => !p.hidden && !p.optional).reduce((a, p) => a + p.minutes, 0);
  if (total < 50 || total > 95) warn(`${w}: runs ${total} minutes (aim for 65–75)`);
  const reading = parts.find((p) => p.type === 'bible-verse' || /^read\b/i.test(p.title));
  if (reading && !reading.script.trim() && !reading.instructions.trim()) warn(`${w}: the reading part is empty; either paste supplied text or tell the leader to read from a Bible`);
}

for (const m of errors) console.log(`ERROR    ${m}`);
for (const m of warnings) console.log(`warning  ${m}`);
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s) in ${(db.series ?? []).length} series and ${(db.services ?? []).length} lessons.`);
process.exit(errors.length ? 1 : 0);
