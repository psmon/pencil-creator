---
name: pencil-lang-pack
description: >
  Language pack installer for Pencil Design Harness & Skills.
  Copies a translated harness pack (evaluation rules, RPG system, achievements) and skill files
  into the project's harness/ and .Codex/skills/ directories.
  Use this skill when the user wants to switch the harness language, install an English harness,
  or set up a localized version of the evaluation framework.
  Triggers on: "change harness language", "install English harness", "switch to English pack",
  "언어팩 설치", "영문 하네스", "lang pack", "/pencil-lang-pack".
---

# Pencil Language Pack Installer

Copies a localized harness pack and skill files from `.Codex/skills/pencil-lang-pack/{lang}/`
into the project, replacing the Korean-original directories with translated versions.

## Version

| Lang Pack | Based On | Harness Version |
|-----------|----------|-----------------|
| `en`      | Korean original (v2.5.1) | **v2.5.1** |

> **Warning**: The Korean version (`harness/`) is the **actively developed original**.
> Language packs are snapshots translated at a specific version and may lag behind
> the latest Korean version. After installing a language pack, check `harness.config.json`
> in the Korean original to compare versions. If the Korean version has been bumped
> beyond the language pack version, some evaluation rules or RPG features may differ.

## Available Languages

| Code | Language | Harness Pack | Skills Pack |
|------|----------|-------------|-------------|
| `en` | English  | `.Codex/skills/pencil-lang-pack/en/harness/` | `.Codex/skills/pencil-lang-pack/en/skills/` |

> To add a new language, create a `{lang-code}/` directory under `.Codex/skills/pencil-lang-pack/`
> with `harness/` and `skills/` subdirectories following the same structure as `en/`.

## Pack Contents

### Harness (`en/harness/`)
- `harness.config.json` — Main config (v2.5.1)
- `knowledge/design-craft.md` — Evaluation criteria (Case A/B/C/W)
- `agents/design-evaluator.md` — Evaluation agent
- `engine/design-journey.md` — State machine
- `engine/level-achievement-system.md` — RPG level & achievements
- `logs/` — Initialized templates (Lv.1, empty achievements)

### Skills (`en/skills/`)
- `harness-creator/SKILL.md` — Harness upgrade skill
- `harness-usage/SKILL.md` — Design workflow execution skill
- `pencil-deploy/SKILL.md` — GitHub Pages deployment skill
- `pencil-design/SKILL.md` — Technical diagramming skill

## Workflow

### Step 1: Show available languages and version info

```
Available language packs:
  - en (English) — based on v2.5.1

⚠️  The Korean version is the actively developed original.
    This language pack is a translated snapshot and may not
    reflect the latest changes in the Korean version.

Which language pack would you like to install?
```

If only one language exists, confirm with the user rather than auto-selecting.

### Step 2: Confirm before overwriting

Before copying, warn the user about what will be overwritten:

```
This will install the "{lang}" language pack (v2.5.1):

  Harness:
    Source: .Codex/skills/pencil-lang-pack/{lang}/harness/
    Target: harness/

  Skills:
    Source: .Codex/skills/pencil-lang-pack/{lang}/skills/
    Target: .Codex/skills/ (harness-creator, harness-usage, pencil-deploy, pencil-design)

  Changes:
    - Harness rules, agents, engine will be replaced with {lang} translations
    - Skills (4 files) will be replaced with {lang} versions
    - RPG level will be reset to Lv.1
    - Achievements will be initialized to empty
    - Existing evaluation logs (harness/logs/yyyy-mm-dd-*.md) will NOT be touched

  ⚠️  The Korean version (harness/) is the actively developed original.
      This pack is based on v2.5.1 and may not include recent updates.

  Backups will be created:
    harness → harness-backup-{date}/
    skills  → .Codex/skills/{name}-backup-{date}/

Proceed? (y/n)
```

Wait for explicit user confirmation before proceeding.

### Step 3: Backup current files

```bash
cp -r harness harness-backup-{YYYY-MM-DD}
```

For skills, back up only the 4 affected skill directories:

```bash
for skill in harness-creator harness-usage pencil-deploy pencil-design; do
  cp -r .Codex/skills/$skill .Codex/skills/${skill}-backup-{YYYY-MM-DD}
done
```

### Step 4: Copy the language pack

Copy harness files:

```bash
cp -r .Codex/skills/pencil-lang-pack/{lang}/harness/* harness/
```

Copy skill files:

```bash
for skill in harness-creator harness-usage pencil-deploy pencil-design; do
  cp .Codex/skills/pencil-lang-pack/{lang}/skills/$skill/SKILL.md .Codex/skills/$skill/SKILL.md
done
```

### Step 5: Verify and report

After copying, verify the key files exist and report:

```
Language pack "{lang}" (v2.5.1) installed successfully!

  Harness:
    - Language: {lang}
    - Version: v2.5.1
    - Level: Lv.1 (reset)
    - Achievements: 0 (reset)

  Skills updated:
    - harness-creator
    - harness-usage
    - pencil-deploy
    - pencil-design

  Backups:
    - harness-backup-{date}/
    - .Codex/skills/{name}-backup-{date}/ (×4)

  ⚠️  This pack is based on Korean v2.5.1.
      To check for newer Korean versions: cat harness-backup-{date}/harness.config.json | grep version

  To restore: cp -r harness-backup-{date}/* harness/
```

### Step 6: Update config paths

The copied `harness.config.json` may reference `harness/` paths.
Verify that all paths in the config point to `harness/` (not `harness-en/` or other prefixes).
If any paths are incorrect, fix them in place.

## Important Notes

- Always use **relative paths** from the project root for all copy operations
- The language pack resets RPG progress (Lv.1, empty achievements) — this is intentional
  so each language starts fresh
- The `docs/` directory (version history) is not included in language packs;
  those remain Korean-only in the original harness
- Existing evaluation log files are preserved since the pack doesn't overwrite them
- **Version drift**: If the Korean harness has been updated beyond v2.5.1,
  the language pack will be outdated. Users should check the Korean version periodically
  and request an updated language pack translation when needed
