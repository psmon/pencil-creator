---
name: pencil-design
description: |
  A skill for generating technical modeling sketches — architecture diagrams, system blueprints, flowcharts, ERDs, etc. — as .pen files using Pencil MCP.
  Focuses on visually expressing design intent, producing diagrams/blueprints rather than code.

  Use this skill in the following situations:
  - "Draw OOO in Pencil", "Sketch OOO blueprint in Pencil"
  - "Draw a diagram in Pencil", "Draw architecture in Pencil"
  - "Create OOO as a .pen file", "Sketch OOO as a design file"
  - "Draw a system diagram", "Draw a flowchart" (when Pencil/.pen is mentioned)
  - "Draw an ERD", "Draw a state diagram" (when Pencil/.pen is mentioned)
  - When a .pen file needs to be created in the design/ directory
  - "Research WPF animations and draw in Pencil", "WPF control design ideas"
  - "Visualize XAML Storyboard", "Search WPF Blend animations and design"
  - When visually expressing WPF/XAML control animation state transitions
  - "WPF template migration", "Migrate XAML to WPF app"
  - "Convert for Blend editing", "Add to design-wpf-app"
  - "Convert WPF animation to Blend-compatible", "Convert to XAML UserControl"
  - When converting design/xaml/sample/ XAML to design-wpf-app/migrated/
  Do not use this skill for general image generation without Pencil/.pen mention — use image-gen skill instead.
allowed-tools: mcp__pencil__get_guidelines, mcp__pencil__open_document, mcp__pencil__get_editor_state, mcp__pencil__batch_design, mcp__pencil__get_screenshot, mcp__pencil__find_empty_space_on_canvas, mcp__pencil__snapshot_layout, mcp__pencil__batch_get, mcp__pencil__get_style_guide_tags, mcp__pencil__get_style_guide, Read, Write, Glob, Grep, WebSearch, WebFetch, Agent, Bash
---

# Pencil Design Skill — Technical Diagrams & Blueprint Generation

Use Pencil MCP tools to generate technical modeling sketches as .pen files — **architecture diagrams, system blueprints, flowcharts, state diagrams**, and more.
Also supports the **WPF/XAML animation control research → design idea visualization → XAML sample archiving** workflow.

---

## 1. Default Settings

| Item | Value |
|------|-------|
| Save location | `D:\MYNOTE\design\{filename}.pen` |
| Default font | Inter (system default if unavailable) |
| Canvas background | `#F5F6FA` (light gray) |
| Max canvas width | 1440px |

---

## 2. Workflow

```
Step 1. Topic Analysis
  → Determine diagram type from user request
  → Collect necessary data (read files, analyze structure, etc.)

Step 2. Diagram Design
  → Select layout pattern matching the type
  → Decide color palette
  → Plan section-by-section structure (considering max 25 ops/call constraint)

Step 3. Pencil MCP Execution
  → Call get_guidelines("web-app") (reference layout rules)
  → open_document("new") or open existing file
  → get_editor_state(include_schema: true) — understand schema
  → batch_design() — call section by section
  → get_screenshot() — visual verification

Step 4. Verification & Completion
  → Check layout/text readability via screenshot
  → Confirm placeholder flags removed
  → Report file path to user
```

---

## 3. Layout Patterns by Diagram Type

### 3.1 Architecture Diagram

Represents hierarchical structures, component relationships, and system overviews.

```
Layout:
  Main frame (vertical, padding 40, gap 32)
  ├── Title bar (center aligned)
  ├── Main row (horizontal, gap 24)
  │   ├── Left column (components/layers)
  │   ├── Center column (core flow)
  │   └── Right column (supplementary info)
  └── Bottom row (horizontal, gap 24)
      ├── Detail section A
      └── Detail section B

Color strategy:
  Assign unique color to each component/layer
  Background + border combination (fill + stroke)
  Text in darker shade of same color family as background
```

### 3.2 Flowchart / State Diagram

Visualizes sequences, branches, and loops.

```
Layout:
  Vertical flow (vertical, gap 12)
  Each state = horizontal row (horizontal: icon + state name + description)
  Branch points = separate background color note box
  Loops = ↺ symbol + description text

State representation:
  Circle dot (ellipse) + background color circle (frame, cornerRadius: 14)
  Unique color per state for visual distinction
```

### 3.3 ERD / Data Model

Represents entities and relationships.

```
Layout:
  Entity = card-style frame (vertical: title + field list)
  Relationship = text label between entities
  Grouping = background color areas for domain separation
```

### 3.4 Grid / Matrix

Represents comparison tables and feature matrices.

```
Layout:
  Table structure (frame → row frame → cell frame → content)
  Header row = dark background + white text
  Data rows = alternating background colors (striped)
```

---

## 4. Color Palette Guide

Color combinations suitable for technical diagrams. Each section uses a **background (fill) + border (stroke) + text (fill)** triple.

| Name | Background | Border | Text (dark) | Text (medium) | Usage |
|------|-----------|--------|-------------|---------------|-------|
| Gold | #FEF3C7 | #F59E0B | #78350F | #92400E | Knowledge, config |
| Cyan | #CFFAFE | #06B6D4 | #164E63 | #155E75 | Agents, processing |
| Rose | #FFE4E6 | #F43F5E | #881337 | #9F1239 | Engine, warnings |
| Green | #D1FAE5 / #F0FDF4 | #86EFAC | #166534 | #15803D | Publishing, success |
| Blue | #DBEAFE | #3B82F6 | #1E40AF | #1D4ED8 | Default, utilities |
| Purple | #EDE9FE | #8B5CF6 | #5B21B6 | #7C3AED | Core, skills |
| Orange | #FFF7ED | #FDBA74 | #9A3412 | #C2410C | Evaluation, metrics |
| Dark | #1E1B4B | #312E81 | #C4B5FD | #A5B4FC | Highlight sections |
| Neutral | #FFFFFF | #E5E7EB | #1B1F3B | #6B7280 | Cards, containers |

---

## 5. batch_design Core Rules

Pencil MCP's batch_design can execute a **maximum of 25 operations** per call. Complex diagrams should be split by logical sections across calls.

### Execution Order

```
1. Create main container (placeholder: true)
2. Title + subtitle
3. Call batch_design for each section (left, center, right, etc.)
4. Bottom section
5. Set placeholder: false
6. Verify with get_screenshot()
```

### Required Checklist

- [ ] Set `fill` property on all text (missing = transparent = invisible)
- [ ] Specify `width`/`height` on frames (`fill_container` or number)
- [ ] Do not use `x`/`y` on flexbox children (ignored)
- [ ] Start with `placeholder: true`, set `false` when complete
- [ ] For text wrapping: `textGrowth: "fixed-width"` + `width` required
- [ ] Images are not `type: "image"` — create a frame then use `G()` operation
- [ ] Binding names cannot be reused across batch_design calls

### Common Patterns

```javascript
// Card-style section
card=I(parent, {type: "frame", layout: "vertical", width: "fill_container",
  height: "fit_content", fill: "#FFFFFF", cornerRadius: 12, padding: 16,
  gap: 8, stroke: {fill: "#E5E7EB", thickness: 1}})

// Color badge + text row
row=I(parent, {type: "frame", layout: "horizontal", width: "fill_container",
  height: "fit_content", gap: 8, alignItems: "center"})
badge=I(row, {type: "frame", width: 24, height: 24, fill: "#3B82F6",
  cornerRadius: 6, layout: "vertical", justifyContent: "center", alignItems: "center"})
label=I(badge, {type: "text", content: "A", fontSize: 11,
  fontWeight: "bold", fill: "#FFFFFF", fontFamily: "Inter"})

// State dot (for flowcharts)
icon=I(row, {type: "frame", width: 28, height: 28, fill: "#D1FAE5",
  cornerRadius: 14, layout: "none"})
dot=I(icon, {type: "ellipse", width: 10, height: 10, fill: "#10B981", x: 9, y: 9})

// Warning/note box
note=I(parent, {type: "frame", layout: "horizontal", width: "fill_container",
  height: "fit_content", fill: "#FEF2F2", cornerRadius: 8,
  padding: [8, 12, 8, 12], gap: 6, alignItems: "center"})

// Card with shadow
shadow=I(parent, {type: "frame", ..., effect: {type: "shadow",
  shadowType: "outer", blur: 12, color: "#0000000F", offset: {x: 0, y: 4}}})
```

---

## 6. Anti-patterns

| Anti-pattern | Result | Correct Approach |
|-------------|--------|-----------------|
| No fill on text | Transparent text (invisible) | Always set fill: "#color" |
| 25+ operations at once | Possible execution failure | Split by section across calls |
| placeholder not removed | Remains in incomplete state | Always set false when done |
| x/y on flexbox children | Ignored, unintended layout | Use gap/padding/alignItems |
| Reusing binding names | Reference errors | Use unique names per call |
| Creating images as type: "image" | Non-existent type | Create frame then use G() |
| No screenshot verification | Layout errors undetected | Always get_screenshot() on completion |

---

## 7. WPF/XAML Design Idea Workflow

A workflow for researching WPF Blend for Visual Studio animation controls/screens and visualizing them as design ideas in Pencil.
The core purpose is to **learn animation patterns defined in WPF XAML and visualize state transitions using Pencil's design expressiveness**.

### 7.1 Workflow Steps

```
Step 1. WPF Animation Research
  → Research modern WPF Storyboard animation examples via WebSearch/Agent
  → Core techniques: EventTrigger, DoubleAnimation, ColorAnimation, TranslateTransform, etc.
  → Collect XAML code snippets per control

Step 2. Generate Pencil Design Ideas
  → Visualize in design/wpf-animation.pen (or user-specified .pen file)
  → Represent each animation as a "state transition card"
    - Title + number (JetBrains Mono, cyan accent)
    - Animation description (Inter, gray)
    - Visual preview (Before → After states connected by arrow)
    - Key XAML code snippet (code block style)
  → Dark theme recommended: #0A0F1C background, #1E293B card, #22D3EE accent

Step 3. XAML Meta Archiving
  → design/xaml/research-history.md — source/acquisition history
  → design/xaml/sample/*.xaml — complete Window XAML sample files
  → Update existing info and add latest when enriching
```

### 7.2 Design Idea Card Pattern

Represent each WPF animation control as a single card:

```javascript
// Card structure (dark theme)
card=I(row, {type: "frame", layout: "vertical", width: "fill_container",
  height: "fit_content(480)", fill: "#1E293B", cornerRadius: 12,
  padding: [24, 24, 24, 24], gap: 20})

// Number + title (cyan accent)
title=I(card, {type: "text", content: "01  GLASS EFFECT BUTTON",
  fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: "700",
  fill: "#22D3EE", letterSpacing: 2})

// Animation description
desc=I(card, {type: "text", content: "MouseEnter → Glass overlay fades in...",
  fontFamily: "Inter", fontSize: 13, fill: "#94A3B8",
  textGrowth: "fixed-width", width: "fill_container", lineHeight: 1.5})

// Visual preview (state transition)
vis=I(card, {type: "frame", layout: "none", width: "fill_container",
  height: 180, fill: "#0F172A", cornerRadius: 8})
// → Place Before state + "→" arrow + After state inside

// XAML code snippet block
codeBlock=I(card, {type: "frame", layout: "vertical",
  width: "fill_container", height: "fit_content(80)",
  fill: "#0A0F1C", cornerRadius: 6, padding: [12, 16, 12, 16], gap: 4})
codeLine=I(codeBlock, {type: "text", content: "<Storyboard ...>",
  fontFamily: "JetBrains Mono", fontSize: 10, fill: "#22D3EE"})
```

### 7.3 State Transition Visualization Techniques

Animations must be represented as still images, so use these patterns:

| Animation Type | Visualization Method |
|---------------|---------------------|
| Hover transition | Normal state → arrow → Hover state side by side |
| Color change | 3-step gradient (Normal → Transition → Active) |
| Size change | Small state → large state overlay or side by side |
| Rotation | 0° state + rotation arc indicator (sweepAngle) |
| Slide | Before/after positions shown with opacity difference |
| Infinite loop | RepeatBehavior icon (∞) + single frame capture |

### 7.4 design/xaml Directory Structure

```
design/xaml/
├── research-history.md    ← Research history (source URLs, core techniques, dates)
└── sample/                ← Complete XAML sample files
    ├── 01-glass-effect-button.xaml
    ├── 02-animated-sidebar-menu.xaml
    └── ...
```

- `research-history.md`: **Append** to existing content on new research (no overwriting)
- `sample/`: Save as number-name.xaml pattern, must be independently executable as WPF Window units
- Read and enrich existing info; update duplicate items with latest information

### 7.5 WPF Animation Key Keywords

Focus on these keywords when researching:

- **Storyboard**: EventTrigger, BeginStoryboard, RepeatBehavior
- **Transform**: ScaleTransform, RotateTransform, TranslateTransform
- **Animation**: DoubleAnimation, ColorAnimation, ThicknessAnimation
- **Easing**: CubicEase, QuadraticEase, AccelerationRatio/DecelerationRatio
- **Control**: ControlTemplate, DataTemplate, Style.Triggers
- **Modern**: Material Design, Fluent Design, WPF UI (lepoco/wpfui)

---

## 8. Multi-Agent Distributed Design (Up to 3 Concurrent)

Pencil MCP allows multiple Agents to call batch_design on the same .pen file **simultaneously**.
When creating many cards/sections, deploying up to 3 agents in parallel can triple work speed.

### 8.1 Distributed Processing Principles

```
Core Rule: Each agent works only on different frames (nodes) — never overlap

Preparation Phase (main thread):
  1. Establish overall layout plan
  2. Pre-create container frames per category (placeholder: true)
     - Main thread inserts titles/descriptions for each container
     - Secure IDs of row frames where cards will go
  3. Clearly assign responsible frame IDs per agent

Distribution Phase (up to 3 agents concurrent):
  Agent 1 → Frame A (e.g., cat2row "4R0Kr") — 3 cards
  Agent 2 → Frame B (e.g., cat3row "fOqok") — 3 cards
  Agent 3 → Frame C (e.g., cat4row "o5CZl") — 3 cards

Completion Phase (each agent independent):
  → Set placeholder: false for own assigned frame
  → Verify own area with get_screenshot()
```

### 8.2 Agent Prompt Template

The following information must be provided to each agent:

```
1. File path: D:\MYNOTE\design\{filename}.pen
2. Target row frame ID: "{row-id}" — insert cards only in this frame
3. Parent container ID: "{container-id}" — target for placeholder: false on completion
4. Card design specs (fill, cornerRadius, padding, gap, fonts, etc.)
5. Specific content for each card (title, description, visual elements, code snippets)
6. Instruction to verify with get_screenshot on completion
```

### 8.3 Layout Collision Prevention

| Rule | Description |
|------|------------|
| Frame ID separation | Each agent calls I() only within assigned row frame ID |
| Position fixed | Container frame x/y pre-positioned by main — agents don't modify |
| placeholder management | Each agent sets placeholder: false only on own parent container |
| Binding names | No binding name conflicts between agents (each batch_design call is independent) |
| Screenshots | Each agent calls get_screenshot() only with own container ID |

### 8.4 Application Scenarios

```
Scenario A: Category-based distribution (most common)
  → 3 of 4 categories run simultaneously, 1 handled by main
  → Main: Build Cat1 directly + create Cat2/3/4 containers
  → Agent 1/2/3: Handle Cat2, Cat3, Cat4 respectively

Scenario B: Large diagram section-based distribution
  → Left/center/right areas each handled by different agents
  → Main: Create overall frame + 3 column frames
  → Agent 1/2/3: Build content within each column

Scenario C: Design + XAML sample in parallel
  → Pencil design and XAML file creation proceed simultaneously
  → Agent 1: Pencil card design (batch_design)
  → Agent 2: Write XAML sample files 06~11 (Write)
  → Agent 3: Write XAML sample files 12~17 (Write)
```

### 8.5 Anti-patterns

| Anti-pattern | Result | Correct Approach |
|-------------|--------|-----------------|
| 2 agents on same frame ID | Node collision, unpredictable results | Strictly separate frame IDs |
| Deploying agents without container creation | No target frame, failure | Main must create containers first |
| 4+ agents simultaneously | Performance degradation, timeout risk | Maximum 3 concurrent agents |
| Not passing frame ID to agent | Insertion at wrong location | Specify exact ID in prompt |
| Main modifying agent work area | Collision occurs | No access to area until agent completes |

---

## 9. Design Evaluation Trigger

Trigger evaluation based on `harness/knowledge/design-craft.md` criteria upon design work completion.

### 9.1 Case P Trigger Conditions (WPF → Pencil)

```
Auto-trigger when ALL conditions met:
  1. WPF/XAML related research was performed
  2. New components/cards were added to .pen file
  3. Visual verification via get_screenshot() was completed

Evaluation axes: P1 (Novelty 35) + P2 (Visualization 35) + P3 (Metadata Completeness 30)
```

### 9.2 Case W Trigger Conditions (Pencil → HTML)

```
Auto-trigger when ALL conditions met:
  1. .pen file was referenced via batch_get/get_screenshot
  2. HTML/CSS/JS files were generated
  3. Generated HTML applies .pen design elements

Evaluation axes: W1 (Coverage 35) + W2 (Animation Fidelity 35) + W3 (Creative Extension 30)
```

### 9.3 Pipeline P→W Bonus

```
When Case P and Case W trigger consecutively in the same session:
  Both ≥ 60 pts → 1.3x bonus on each XP
```

---

## 10. Design Export & HTML Generation Workflow

### 10.1 .pen → HTML Conversion Workflow

A workflow for implementing animation components from Pencil design files as actual HTML/CSS/JS.

```
Step 1. Analyze Design Elements
  → Analyze .pen file structure via get_editor_state() / snapshot_layout()
  → Check visual elements of each category via get_screenshot()
  → Collect Before→After patterns and XAML snippets from animation cards

Step 2. Animation Mapping Design
  → Design HTML/CSS technique mappings for each .pen component
  → Create mapping table (pen effect → CSS/JS implementation location)

  Mapping Rules:
    WPF DoubleAnimation → CSS transition / @keyframes
    WPF ColorAnimation → CSS color transition
    WPF ScaleTransform → CSS transform: scale()
    WPF RotateTransform → CSS transform: rotate()
    WPF TranslateTransform → CSS transform: translate()
    WPF ElasticEase → CSS cubic-bezier(.68,-.55,.265,1.55)
    WPF RepeatBehavior=Forever → CSS animation: infinite

Step 3. HTML Generation
  → Save to design/xaml/output/sample{N}/index.html
  → Dark theme recommended (var(--bg), var(--cyan) CSS variables)
  → Include responsive + interactive + scroll-triggered animations

Step 4. Playwright Capture (for wiki publishing)
  → Start local server with python -m http.server
  → browser_navigate → section scrollIntoView → waitForTimeout → take_screenshot
  → Save section PNGs to tmp/playwright/sample{N}/

Step 5. Wiki Publishing
  → Attach capture images + HTML files to wiki
  → Add animation descriptions for each section image
```

### 10.2 Output Directory Structure

```
design/xaml/output/
├── sample00/             ← Design test sample page
│   ├── index.html
│   ├── style.css
│   └── app.js
└── sample{N}/            ← Additional test sample pages
```

### 10.3 Playwright Section Capture Pattern

```javascript
// 1. Start local server
// python -m http.server 8765 (from design/xaml/output/sample{N}/)

// 2. Browser setup
browser_resize(1400, 900)
browser_navigate("http://localhost:8765/")

// 3. Per-section iteration
for each section_id in [hero, about, travels, gallery, stats, journey, contact]:
  browser_evaluate(() => document.getElementById(section_id).scrollIntoView())
  browser_run_code(async (page) => await page.waitForTimeout(1500))
  browser_take_screenshot(filename: "tmp/playwright/sample{N}/{order}-{section}.png")
```

### 10.4 Playwright Video Recording (WebM)

For recording animation demonstrations as video, WebM recording is possible via `browser_run_code`.
Refer to `tools/tools-window.md` for installation procedures and GIF/MOV conversion methods.

⚠️ **Note**: This project targets a Windows environment. When installing ffmpeg, consider OS compatibility (npm `ffmpeg-static` package auto-selects OS-specific binaries and is recommended).

---

## 11. WPF App Migration Workflow (XAML → Blend Editable)

A workflow for converting collected WPF XAML animations into a form that can be viewed/edited in **Blend for Visual Studio**.
The purpose is to visually inspect keyframes/easing via Blend timeline when self-implementing animations on other platforms.

### 11.1 Core Reference Document

This guide must be read and followed before conversion work:

```
design-wpf-app/docs/animation-migration-guide.md
```

This document defines:
- Window → UserControl conversion rules
- ControlTemplate dismantling → root Grid direct placement
- Naming Transforms with x:Name (no index usage)
- Storyboard dual structure (Resources x:Key + EventTrigger inline)
- DemoSequence intent-based design process
- Event trigger precautions
- 8-step conversion checklist

### 11.2 Project Structure

```
design-wpf-app/
├── design-wpf-app.slnx          ← Open this file in Blend
├── MainWindow.xaml               ← Left navigation + right content viewer
├── MainWindow.xaml.cs            ← Register new items in CreateSampleControl()
├── migrated/                     ← Converted UserControl XAML
│   ├── Sample{NN}_{PascalName}.xaml
│   └── Sample{NN}_{PascalName}.xaml.cs
├── db/
│   ├── migration-db.json         ← Migration status DB (v2 schema)
│   └── README.md
└── docs/
    └── animation-migration-guide.md  ← Core conversion guide
```

### 11.3 Workflow Steps

```
Step 1. Analyze Original XAML
  → Read design/xaml/sample/{NN}-{name}.xaml
  → Identify triggers/property changes/easing (5 questions — see guide)
  → Classify animation type (interaction/auto-repeat/sequence/code-generated)

Step 2. UserControl Conversion
  → Follow the 8-step conversion checklist from animation-migration-guide.md
  → Create migrated/Sample{NN}_{PascalName}.xaml + .xaml.cs
  → Define individual Storyboard x:Key in Resources
  → DemoSequence: analyze original intent → Phase mapping → add enhancement effects
  → Clone inline Storyboard in EventTrigger

Step 3. MainWindow Registration
  → Add new entry to CreateSampleControl() switch in MainWindow.xaml.cs

Step 4. Build Verification
  → Run dotnet build, confirm 0 errors

Step 5. DB Update
  → Update db/migration-db.json entry:
    - status: "Build Success"
    - animationSummary: one-line user-perspective scenario summary
    - coreAnimations: core technique array
    - triggerType: trigger type
  → Add conversion log to migrationLog (include core feature title summary)
```

### 11.4 Blend Usage Tips

- Open `design-wpf-app/design-wpf-app.slnx` in Blend for Visual Studio to start working immediately
- Select Storyboards from each UserControl's **timeline dropdown**
- Select `DemoSequence` and play (▶) to view the full animation flow at once
- Select individual Storyboards to edit keyframes/modify easing
- Verify runtime-identical behavior via mouse interaction on the design surface

### 11.5 Batch Conversion Strategy

Strategy for efficiently converting 27+ XAML files:

```
Phase 1: Convert first 1 + build verification (prototype)
Phase 2: Batch convert 5 similar types + build
Phase 3: Convert special types individually + build
Phase 4: Full DB update + user feedback
```

- Auto-repeat types (Loaded+Forever) are simplest — suitable for batch processing
- Interaction types (hover/click) apply transparent Button hit area pattern
- Code-generated types (dynamic elements) require individual attention
- Use Agent tool to create 4~5 in parallel for speed improvement
