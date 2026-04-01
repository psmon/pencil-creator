# design-journey.md — Pencil Design Journey State Model

Defines the complete state transition model for Pencil Design workflows.

---

## State Diagram

```
idle
  ↓ (request received)
prompted
  ↓ (type determination: Case A/B/C/W)
researching     ← WPF research (A) / template review (B) / web animation analysis (C)
  ↓
designing       ← card addition (A) / project design (B) / JSON→Pencil (C) / HTML generation (W)
  ↓
design-evaluating  ← design-evaluator 3-axis evaluation
  ↓
recording       ← log creation + RPG processing
  ↓
idle
```

---

## Workflow Paths by Case Type

### Case A: WPF Research → Template Enrichment
```
idle → prompted → researching(WPF) → designing(.pen card addition) → design-evaluating(Case A) → recording → idle
```

### Case B: Template Reference → Project Design
```
idle → prompted → researching(wpf-animation.pen) → designing(static + animation guide) → design-evaluating(Case B) → recording → idle
```

### Case C: Web Animation → JSON → Pencil Component (Copycat)
```
idle → prompted → researching(WebFetch analysis) → designing(JSON definition + Pencil component) → design-evaluating(Case C) → recording → idle
```

### Case W: Pencil → HTML/Web Implementation
```
idle → prompted → designing(HTML, referencing .pen/.json) → design-evaluating(Case W) → recording → idle
```

### Pipeline A→B→W: WPF Complete Loop
```
idle → prompted → researching(WPF) → designing(.pen) → design-evaluating(Case A)
  → designing(project) → design-evaluating(Case B)
  → designing(HTML) → design-evaluating(Case W, pipeline bonus)
  → recording → idle
```

### Pipeline C→B→W: Copycat Complete Loop
```
idle → prompted → researching(web analysis) → designing(JSON + Pencil) → design-evaluating(Case C)
  → designing(project) → design-evaluating(Case B)
  → designing(HTML) → design-evaluating(Case W, pipeline bonus)
  → recording → idle
```

### Pipeline C→W: Copycat Direct
```
idle → prompted → researching(web analysis) → designing(JSON + Pencil) → design-evaluating(Case C)
  → designing(HTML) → design-evaluating(Case W, pipeline bonus)
  → recording → idle
```

---

## Responsibilities by State

| State | Owner | Key Action |
|-------|-------|------------|
| prompted | - | Case A/B/C/W determination, existing file state check |
| researching | pencil-design | WPF research (A) / template review (B) / web animation analysis (C) |
| designing | pencil-design | Card addition (A) / project design (B) / JSON→Pencil (C) / HTML (W) |
| design-evaluating | design-evaluator | 3-axis scoring + mapping table |
| recording | design-evaluator | Log + XP + achievements |
