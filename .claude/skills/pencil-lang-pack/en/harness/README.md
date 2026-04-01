# Pencil Design Harness — English Version

English translation of the Pencil Design Quality Harness (v2.5.1).
The Korean version in `harness/` is the **original**; this is a translated pack for English-speaking users.

---

## Quick Start

To use the English version, copy the `harness/` pack to replace `harness/`:

```bash
# 1. Backup the original Korean harness (optional but recommended)
cp -r harness harness-ko-backup

# 2. Copy the English pack over
cp -r harness/* harness/
```

> **Note:** The `logs/` directory in `harness/` contains only initialized templates (level 1, empty achievements). Your existing evaluation logs in `harness/logs/` will be overwritten. If you want to preserve your progress, back up `harness/logs/` before copying.

---

## What's Included

| Path | Description |
|------|-------------|
| `harness.config.json` | Main config — paths point to `harness/` by default |
| `knowledge/design-craft.md` | Evaluation criteria for Case A/B/C/W (3-axis, 100 pts each) |
| `agents/design-evaluator.md` | Evaluation agent role definition and output format |
| `engine/design-journey.md` | State machine for design workflows |
| `engine/level-achievement-system.md` | RPG level (Lv.1~100), XP formula, achievements |
| `logs/level-up/status.json` | Level state — **initialized to Lv.1** |
| `logs/level-up/history.md` | Level-up history log (empty) |
| `logs/achievements/achievements.json` | Achievement state — **all categories reset to 0** |
| `logs/achievements/history.md` | Achievement unlock history (empty) |
| `logs/harness-usage.md` | Evaluation usage log (empty) |

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
