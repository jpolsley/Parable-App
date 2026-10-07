# How to use this skill (for Justin)

This folder teaches any Claude how we make Parable curriculum:
- your Ministry Playbook
- the lesson recipe behind B.L.E.S.S.
- how to shape lessons so Parable prints them beautifully
- your design taste (what you loved and what you hated)
- how book designs are built
- how the app works

It doesn't depend on any Claude account, chat or link.

## Three ways to use it

**1. On claude.ai (any account, including a new one)**
1. Download `parable-curriculum.zip` (it's in the repo at `skills/parable-curriculum.zip`).
2. Go to claude.ai → **Settings → Capabilities → Skills** → **Upload skill**, and pick the zip.
3. In any chat, ask for what you want ("Write a 4-week series on the Lord's Prayer for middle schoolers"). Claude
   picks up the skill on its own.

**2. Claude Code or the Claude desktop app on your Mac**
- Copy this whole `parable-curriculum` folder into `~/.claude/skills/`. It then works in every project.
- Or work inside the Parable repo, where it's already at `skills/parable-curriculum/`. Then say "use the
  parable-curriculum skill".

**3. Obsidian**
- Copy the folder into your vault. Everything is plain Markdown, so it reads as notes.
- `SKILL.md` is the starting point. The `references/` notes hold the details.
- If you use Claude with your vault, point it at this folder.

## No Claude at all?

The skill is also a written manual:
- **Playbook:** `references/playbook.md`
- **Writing lessons:** `references/lesson-recipe.md`
- **The file Parable imports:** `references/parable-format.md`

You could hand those to another AI, or follow them yourself.

## Keeping it current

When we change how we do things, update the skill:
- a new playbook version
- a new favorite design
- a new rule you learned the hard way

The easiest way is to tell Claude: "update the parable-curriculum skill with what we just decided." The repo copy is
the master; the zip and your Obsidian copy are snapshots.
