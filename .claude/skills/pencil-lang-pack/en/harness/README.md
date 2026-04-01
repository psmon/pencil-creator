# Pencil Design — English Language Pack (v2.5.1)

English translation of the Pencil Design Harness & Skills.
The Korean version is the **actively developed original**; this pack is a translated snapshot.

> **Warning**: This pack is based on Korean v2.5.1. The Korean version is actively developed
> and may have been updated beyond this version. Check `harness/harness.config.json` to compare.

---

## Quick Start — Install via Skill Command

The easiest way to install the English pack is using the slash command:

```
/pencil-lang-pack
```

This will guide you through language selection, backup, and installation.

---

## Skill Commands (English)

After installing the English pack, the following skill commands are available:

| Command | Description |
|---------|-------------|
| `/harness-usage` | Execute design workflows (Case A/B/C/W) with 3-axis evaluation |
| `/harness-creator` | Upgrade the evaluation framework, add axes, bump versions |
| `/pencil-design` | Create architecture diagrams, flowcharts, ERD in .pen files |
| `/pencil-deploy` | Deploy demo site to GitHub Pages (prepare + publish) |
| `/pencil-lang-pack` | Switch harness language / reinstall language pack |

### Example Prompts (English)

```
Case A: "Research WPF animations and add to Pencil template"
Case B: "Reference wpf-animation effects to design a dashboard"
Case C: "Analyze animations on this URL and create JSON definitions"
Case W: "Convert the Pencil design to HTML"
Deploy: "Prepare deployment" / "Publish the demo site"
```

---

## What's Included

### Harness (`en/harness/`)

| Path | Description |
|------|-------------|
| `harness.config.json` | Main config — paths point to `harness/` by default |
| `knowledge/design-craft.md` | Evaluation criteria for Case A/B/C/W (3-axis, 100 pts each) |
| `agents/design-evaluator.md` | Evaluation agent role definition and output format |
| `engine/design-journey.md` | State machine for design workflows |
| `engine/level-achievement-system.md` | RPG level (Lv.1~100), XP formula, achievements |
| `logs/level-up/status.json` | Level state — **initialized to Lv.1** |
| `logs/achievements/achievements.json` | Achievement state — **all categories reset to 0** |

### Skills (`en/skills/`)

| Skill | Description |
|-------|-------------|
| `harness-creator/SKILL.md` | Harness upgrade & improvement |
| `harness-usage/SKILL.md` | Design workflow execution (Case A/B/C/W) |
| `pencil-deploy/SKILL.md` | GitHub Pages deployment |
| `pencil-design/SKILL.md` | Technical diagramming & WPF animation design |

---

## What's NOT Included

- **`docs/`** — Version history documents (Korean-only, refer to `harness/docs/` if needed)
- **Evaluation log files** (`logs/yyyy-mm-dd-*.md`) — These are runtime artifacts, not part of the harness pack

---

## Differences from Korean Version

| Aspect | Korean (`harness/`) | English (`harness/`) |
|--------|--------------------|-----------------------|
| Language | Korean | English |
| Level | Current progress (Lv.45) | Reset to Lv.1 |
| Achievements | Accumulated history | Empty / initialized |
| Achievement names | Korean parody titles | English parody titles |
| Category names | Korean (`UI컴포넌트`, `애니메이션`...) | English (`UI Components`, `Animation`...) |
| RPG titles | Korean (`펜슬을 잡은 모험가`...) | English (`Adventurer Who Picked Up a Pencil`...) |

---

## Standalone Usage (Without Overwriting)

If you want to run the English harness **alongside** the Korean one without overwriting, update the skill files to reference `harness/` paths instead of `harness/`. The `harness.config.json` in this pack already uses `harness/` prefixed paths.

---

## Version

Based on Pencil Design Harness **v2.5.1** (2026-03-31).
