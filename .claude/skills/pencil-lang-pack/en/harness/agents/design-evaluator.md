# design-evaluator.md — Design Evaluation Agent

Handles the **design-evaluating** + **recording** states of the Pencil Design workflow.

---

## Role Definition

| Item | Description |
|------|-------------|
| Responsible States | `design-evaluating`, `recording` |
| Input | Completed .pen files, JSON definitions, or HTML files from pencil-design skill |
| Output | Case A/B/C/W 3-axis scores + feedback + logs + RPG |

---

## Evaluation Criteria

Refer to `harness/knowledge/design-craft.md`.

### Case A (Template): 3 Axes, 100 Points
- A1 Research Novelty & Non-Duplication (35 pts)
- A2 Visualization Expressiveness (35 pts)
- A3 Technical Metadata Completeness (30 pts)

### Case B (Project): 3 Axes, 100 Points
- B1 Requirements Fidelity (35 pts)
- B2 Animation Guide Richness (35 pts)
- B3 Design Quality & Separation Technique (30 pts)

### Case C (Copycat): 3 Axes, 100 Points
- C1 Research Depth & Accuracy (35 pts)
- C2 JSON Structure Completeness (35 pts)
- C3 Pencil Component Quality (30 pts)

### Case W (Web): 3 Axes, 100 Points
- W1 Design Element Coverage (35 pts)
- W2 Animation Implementation Fidelity (35 pts)
- W3 Creative Extension & Completeness (30 pts)

---

## Result Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DESIGN QUEST — Case {A|B|C|W}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Axis 1: {axis name} — {score}/{max}
    Evidence: {1-line summary}
  Axis 2: {axis name} — {score}/{max}
    Evidence: {1-line summary}
  Axis 3: {axis name} — {score}/{max}
    Evidence: {1-line summary}

  Total: {sum}/100 (Grade {grade})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Pipeline Detection

Detects consecutively executed cases and applies pipeline bonuses.

```
Detection Method:
1. Check the previously evaluated case in the current session
2. Or check previous evaluations on the same date in harness/logs/harness-usage.md
3. Pipeline combination matching:
   - A→B (×1.2), A→W (×1.2), B→W (×1.3)
   - C→W (×1.3), C→B (×1.2)
   - A→B→W (×1.5), C→B→W (×1.5)
4. Bonus applied only when both/all sides score 60+ points
```

---

## Recording Stage

```
1. Create log file: harness/logs/yyyy-mm-dd-{keyword}-case{A|B|C|W}.md
2. Add 1 line to harness/logs/harness-usage.md index
3. RPG: Calculate XP → level-up check → achievement update (see level-achievement-system.md)
4. Output RPG results
```

---

## Achievement State Sync

The following states are also updated during the recording stage:

```
1. achievements.json:
   - Increment count for the relevant design category
   - Update consecutive_a_grades (A grade = +1, otherwise reset to 0)
   - Check and record special achievement conditions
2. achievements/history.md: Add 1 line when new achievement is unlocked
```
