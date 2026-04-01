---
name: pencil-lang-pack
description: >
  Language pack installer for Pencil Design Harness.
  Copies a translated harness pack (evaluation rules, RPG system, achievements) into the project's harness/ directory.
  Use this skill when the user wants to switch the harness language, install an English harness,
  or set up a localized version of the evaluation framework.
  Triggers on: "change harness language", "install English harness", "switch to English pack",
  "언어팩 설치", "영문 하네스", "lang pack", "/pencil-lang-pack".
---

# Pencil Language Pack Installer

Copies a localized harness pack from `.claude/skills/pencil-lang-pack/{lang}/` into the project,
replacing the Korean-original `harness/` directory with a translated version.

## Available Languages

| Code | Language | Pack Path |
|------|----------|-----------|
| `en` | English  | `.claude/skills/pencil-lang-pack/en/harness/` |

> To add a new language, create a `{lang-code}/harness/` directory under `.claude/skills/pencil-lang-pack/`
> following the same structure as `en/harness/`.

## Workflow

### Step 1: Show available languages

List the language directories under `.claude/skills/pencil-lang-pack/` (excluding SKILL.md).
Present them to the user and ask which language to install.

```
Available language packs:
  - en (English)

Which language pack would you like to install?
```

If only one language exists, confirm with the user rather than auto-selecting.

### Step 2: Confirm before overwriting

Before copying, warn the user about what will be overwritten:

```
This will copy the "{lang}" harness pack into your project:

  Source: .claude/skills/pencil-lang-pack/{lang}/harness/
  Target: harness/

  - Knowledge, agents, engine rules will be replaced with {lang} translations
  - Level will be reset to Lv.1
  - Achievements will be initialized to empty
  - Existing evaluation logs (harness/logs/yyyy-mm-dd-*.md) will NOT be touched
    (the pack does not include log files)

  Your current harness/ will be backed up to harness-backup-{date}/

Proceed? (y/n)
```

Wait for explicit user confirmation before proceeding.

### Step 3: Backup current harness

```bash
cp -r harness harness-backup-{YYYY-MM-DD}
```

### Step 4: Copy the language pack

Copy the translated pack files over the existing harness directory.
Use relative paths from the project root.

```bash
cp -r .claude/skills/pencil-lang-pack/{lang}/harness/* harness/
```

This overwrites:
- `harness/harness.config.json`
- `harness/knowledge/design-craft.md`
- `harness/agents/design-evaluator.md`
- `harness/engine/design-journey.md`
- `harness/engine/level-achievement-system.md`
- `harness/logs/level-up/status.json` (reset to Lv.1)
- `harness/logs/achievements/achievements.json` (reset to empty)
- `harness/logs/level-up/history.md` (empty)
- `harness/logs/achievements/history.md` (empty)
- `harness/logs/harness-usage.md` (empty)

Existing date-stamped log files (`harness/logs/yyyy-mm-dd-*.md`) are preserved
because the language pack does not include them.

### Step 5: Verify and report

After copying, verify the key files exist and report:

```
Language pack "{lang}" installed successfully!

  - Harness language: {lang}
  - Level: Lv.1 (reset)
  - Achievements: 0 (reset)
  - Backup: harness-backup-{date}/

  The original Korean harness has been backed up.
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
