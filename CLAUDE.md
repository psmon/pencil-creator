# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pencil Creator is an **animation-first design project** driven by Claude Code + Pencil MCP. The core workflow: research WPF animations → visualize in Pencil (.pen) → implement as HTML/CSS/JS. There is no traditional build system — all work is orchestrated through MCP servers, custom skills, and a gamified evaluation harness.

## MCP Servers

- **Pencil MCP**: Read/write .pen files via `batch_get`, `batch_design`, `get_screenshot`, etc. `.pen` files are encrypted — **never use Read/Grep on .pen files**, always use Pencil MCP tools.
- **Playwright MCP**: Browser automation for HTML screenshot capture (optional).
- **Blender MCP** (`uvx blender-mcp`): Live 3D modeling/render control over TCP for Case M. Requires the Blender addon listening on `:9876`.
- **Unity MCP** (official, via `com.unity.ai.assistant`): 3D authoring alternative to Blender for Case M. Registered as the `unity` stdio server running the Unity relay in `--mcp` mode (`~/.unity/relay/relay_win.exe --mcp --project-path "G:\Unity\Projects\My project"`), bridged to a live Unity 6.2 (`6000.5.7f1`) Editor. The Editor must be **open on the target project** for tools to respond; the bridge is a named pipe keyed to the Editor PID, so `--project-path` (not `--instance-id`) keeps the link stable across Editor restarts. Approve first-time client connections in `Edit > Project Settings > AI > Unity MCP` → Pending Connections.

## Skills (Slash Commands)

| Command | Skill | Purpose |
|---------|-------|---------|
| `/harness-usage` | Case A/B/C/W workflow | Execute design workflows with 3-axis evaluation |
| `/harness-creator` | Harness improvement | Upgrade evaluation framework, add axes, bump versions |
| `/pencil-design` | Technical diagramming | Architecture diagrams, flowcharts, ERD in .pen files |
| `/pencil-deploy` | GitHub Pages deployment | Prepare (index.html + git push) then publish (version tag) |

### Workflow Cases

- **Case A**: WebSearch WPF techniques → extract XAML → add animation cards to `design/wpf-animation.pen`
- **Case B**: Reference wpf-animation.pen → design project-specific .pen files
- **Case C**: Web animation research → JSON metadata → Pencil component
- **Case W**: Convert .pen design → HTML/CSS/JS in `design/xaml/output/sample{N}/`
- **Case M**: Modeling-first — reference analysis (video frames) → 3D modeling → engine-native asset (`.blend` in `design/blend/` for Blender, or a Unity scene/prefab under `G:\Unity\Projects\My project` for Unity) → Three.js web rebuild with cinematic cameras. **Two 3D backends**: Blender MCP (default, workflow `harness/engine/blend3d-web-flow.md`) or Unity MCP (alternative — real-time engine, URP + Cinemachine, idol-performance video; workflow `harness/engine/unity3d-flow.md`, eval `harness/knowledge/unity3d-craft.md`). **Unity performance video = Play-mode capture** (`PlayCapture` + `Time.captureFramerate` + shared `PerfClock`), NOT offline `AnimationMode` sampling (freezes skinned mesh) and NOT Unity Recorder 5.1.2 (incompatible with Unity 6.2). **Blender 3D ≠ MS Blend** (WPF tool). If a 3D structure is hard to prompt, analyze video footage first to extract numeric specs.

## Path Conventions

All paths use **project-root-relative** format:
- Design files: `design/{name}.pen`
- XAML samples: `design/xaml/sample/{NN}.xaml`
- HTML output: `design/xaml/output/sample{NN}/index.html`
- Screenshots: `image/pencil/sample{N}/`
- Project designs: `projects/design/{name}.pen`
- Harness config: `harness/harness.config.json`
- Harness knowledge: `harness/knowledge/design-craft.md`
- RPG status: `harness/logs/level-up/status.json`

## Architecture

```
harness/                    # 3-layer evaluation framework (v2.4.0)
├── knowledge/              #   Knowledge layer — scoring criteria per case
├── agents/                 #   Agents layer — evaluator decision trees
├── engine/                 #   Engine layer — state machine + RPG leveling
└── logs/                   #   Evaluation logs + RPG status

design/                     # Core design artifacts
├── wpf-animation.pen       #   Master template (12 CATs, 40+ cards)
├── xaml/sample/            #   27 WPF animation XAML sources
├── xaml/output/            #   HTML implementations + deploy index
└── json/sample/            #   Animation metadata JSON

design-wpf-app/             # .NET 10.0 WPF app for Blend timeline editing
projects/                   # Project-specific designs (e.g., publisher-app)
```

## Deployment

GitHub Pages deployment is **tag-triggered** via `.github/workflows/deploy-pages.yml`:
1. `/pencil-deploy` prepares: scans samples → updates `design/xaml/output/index.html` → commits + pushes
2. `/pencil-deploy` publishes: creates `v{X.Y.Z}` tag → GitHub Actions deploys `design/xaml/output/`

## Evaluation & RPG System

Each case is scored on 3 axes (total 100 points). XP formula: `base(score×10) × grade_multiplier × type_multiplier`. Pipeline bonuses (A→B→W: 1.5x) reward end-to-end workflows. Grades: A(80+), B(60-79), C(40-59), D(0-39).

## Key Rules

- `.pen` files are **only** accessible via Pencil MCP tools — never read them with file tools
- Always call `get_editor_state()` before working with Pencil MCP to understand current context
- WPF animation categories are CAT1–CAT13 in `design/wpf-animation.pen`
- The WPF app (`design-wpf-app/`) targets .NET 10.0 and is opened in Visual Studio Blend
