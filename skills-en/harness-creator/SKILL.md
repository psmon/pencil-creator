---
name: harness-creator
description: |
  A skill for improving and upgrading the Pencil Design Harness structure.
  Use this skill in the following situations:
  - "Upgrade the harness", "Improve skills", "harness-creator", "Improve harness"
  - When design evaluation scores are low and improvement guidance is needed
  - When adding new evaluation axes or changing workflows
  - "What is the harness?", "How do I use the harness?" — usage guide questions
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, WebSearch
---

# Harness Creator — Pencil Design Harness Upgrade

Analyze and continuously improve the `harness/` 3-layer structure.

---

## 1. Harness 3-Layer Structure

```
harness/
├── knowledge/      ← Layer 1: Design evaluation criteria (design-craft.md)
├── agents/         ← Layer 2: Evaluation agents (design-evaluator.md)
└── engine/         ← Layer 3: Workflow (design-journey.md, level-achievement-system.md)
```

---

## 2. Upgrade Agentic Loop

### Gather Context
```
1. Collect observations from harness/logs/*.md
2. Check current version in harness.config.json
3. Identify target layer for changes (knowledge → agents → engine order)
```

### Take Action
```
1. Apply changes starting from the highest layer
2. Bump version in harness.config.json
3. Write change documentation at harness/docs/vX.Y.Z.md
```

### Verify
```
1. Verify cross-layer reference integrity
2. Check skill upgrade_history records
```

---

## 3. Version Management

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| Patch (0.0.x) | Doc edits, example additions | Adjust design-craft.md criteria |
| Minor (0.x.0) | New evaluation axis, workflow change | Add accessibility axis to Case W |
| Major (x.0.0) | Full structure redesign | 3-axis → 5-axis change |

---

## 4. Harness Usage Guide

When users ask about the harness, provide the following information:

```
The Harness is a system for measuring and improving the quality of Pencil design work.

Key Features:
  1. Case A Evaluation: Measure quality of WPF animation research → wpf-animation.pen template enrichment
  2. Case B Evaluation: Measure quality of template-referenced project design (static + animation guide)
  3. Case C Evaluation: Measure quality of website animation analysis → JSON technique definitions → Pencil components
  4. Case W Evaluation: Measure quality of Pencil design → HTML implementation
  5. RPG System: Gamification where you earn XP and level up with each task
  6. Self-improvement: Accumulate evaluation observations to upgrade skills

Usage:
  - "Research WPF animations and draw them in Pencil" → Start Case A workflow
  - "Design OO referencing wpf-animation" → Start Case B workflow
  - "Analyze OO site animations and strengthen templates" → Start Case C workflow
  - "Create HTML referencing the Pencil design" → Start Case W workflow
  - "Upgrade the harness" → Run this skill (harness-creator)
```
