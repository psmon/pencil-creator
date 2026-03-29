---
name: harness-usage
description: |
  A skill for executing design work using the Pencil Design Harness.
  Runs and evaluates Case A (WPF research → template enrichment), Case B (template reference → project design), Case C (web animation → JSON → Pencil component), and Case W (Pencil → HTML) workflows.
  Use this skill in the following situations:
  - "Research WPF animations and draw them in Pencil" → Case A
  - "Research and enrich WPF templates" → Case A
  - "Add animation components" → Case A
  - "Design OO referencing wpf-animation effects" → Case B
  - "Design OO in Pencil" + wpf-animation reference mentioned → Case B
  - "Analyze OO site animations and strengthen templates" → Case C
  - "Analyze the URL and organize animation JSON" → Case C
  - "Web animation copycat" → Case C
  - "Create an HTML page referencing the Pencil design" → Case W
  - "Implement the design as a web page" → Case W
  - "Evaluate the design", "Score it" → Run evaluation
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, WebSearch, WebFetch, mcp__pencil__get_guidelines, mcp__pencil__open_document, mcp__pencil__get_editor_state, mcp__pencil__batch_design, mcp__pencil__get_screenshot, mcp__pencil__find_empty_space_on_canvas, mcp__pencil__snapshot_layout, mcp__pencil__batch_get, mcp__pencil__get_style_guide_tags, mcp__pencil__get_style_guide, mcp__pencil__get_variables, mcp__playwright__browser_navigate, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_evaluate, mcp__playwright__browser_run_code, mcp__playwright__browser_resize
---

# Harness Usage — Pencil Design Workflow Execution

Execute **Case A (WPF → Template), Case B (Template Reference → Project Design), Case C (Web Animation → JSON → Pencil Component), Case W (Pencil → HTML) workflows** based on the `harness/` 3-layer structure.

---

## 1. Design Journey State Model

```
idle → prompted → researching → designing → design-evaluating → recording → idle
```

| State | Key Action |
|-------|-----------|
| prompted | Determine Case A/B/C/W, check existing file status |
| researching | WPF research (A) / analyze wpf-animation.pen (B) / web animation analysis (C) |
| designing | Add cards (A) / project design (B) / JSON → Pencil component (C) / HTML implementation (W) |
| design-evaluating | 3-axis scoring (refer to harness/knowledge/design-craft.md) |
| recording | Write logs + RPG (XP/level/achievements) processing |

---

## 2. Case A: WPF Research → Template Enrichment

A workflow for **directly adding new WPF animation technique cards** to wpf-animation.pen.

```
Phase 1 — Gather (researching):
  → Research WPF Storyboard animation examples via WebSearch
  → Check existing wpf-animation.pen categories/card list (exclude duplicates)
  → Collect core techniques: EventTrigger, DoubleAnimation, Transform, Easing
  → Check existing files in design/xaml/sample/*.xaml

Phase 2a — Action: Individual Cards (designing):
  → Create new cards in wpf-animation.pen
  → Card structure: number+title + WPF property description + Before→After visual preview + XAML code snippet
  → Dark theme (#0A0F1C background, #22D3EE cyan accent, JetBrains Mono)
  → Save .xaml sample files in design/xaml/sample/
  → Update design/xaml/research-history.md

Phase 2b — Action: COMBINED SAMPLE (designing):
  ⚠️ Must be created when 2+ techniques are found combined in real use cases from research sources
  → Create "SAMPLE — {name} (Combined Component)" frame at the bottom of wpf-animation.pen
  → Components:
    - COMBINED SAMPLE badge + Source URL
    - Title + technique combination summary
    - Left: Visual preview (static representation of actual behavior + legend)
    - Right: Spec grid (Canvas/Lines/Trim/Color/Stagger/Easing key values)
    - Bottom-right: JSON/XAML REFERENCES (related file path mapping)
    - Bottom: WPF IMPLEMENTATION + CSS/SVG IMPLEMENTATION code blocks side by side
  → Value: Reference this single frame to implement immediately without combining individual cards
  → Case W can directly reference this SAMPLE frame for HTML generation

Phase 3 — Verify (design-evaluating):
  → design-craft.md Case A 3-axis evaluation
    A1: Research Novelty (35 pts)
    A2: Visualization Expressiveness (35 pts)
    A3: Metadata Completeness (30 pts)
  → recording: logs + RPG
```

---

## 3. Case B: Template Reference → Project Design

A workflow for creating new .pen designs for project requirements using wpf-animation.pen as a **reference library**.
**Core Principle: Separate static design (look & feel) from dynamic definitions (animation guide).**

```
Phase 1 — Gather (researching):
  → Understand user requirements (page structure, features, validation, look & feel)
  → Analyze all wpf-animation.pen categories/cards (plan which techniques to apply)
  → Check precise parameters from design/xaml/sample/*.xaml for target techniques
    ⚠️ Reading .pen alone gives "rough understanding"; reading .xaml provides "exact Duration/Easing/values"
  → Load styles/guides via Pencil get_guidelines (determine look & feel direction)
  → Check project .pen file status

Phase 2a — Action: Static Design (designing):
  → Create static screens in project .pen file
  → Define reusable components first (sidebar, buttons, etc.)
  → Each screen: sidebar instance + main content
  → Apply consistent style guide colors/fonts/roundness
  → Verify each screen via screenshot

Phase 2b — Action: Animation Guide (designing):
  → Create as a separate section within the same .pen file (below static screens)
  → Hero frame: "ANIMATION GUIDE" title
  → Separate by screen category (CAT-A: Dashboard, CAT-B: Upload, etc.)
  → Each card structure:
    - Number + title (accent color, Inter, uppercase)
    - Target: {Screen}/{Frame} specifying where to apply
    - WPF behavior description (properties, easing, duration)
    - Before → After visual preview (absolute positioning)
    - XAML code snippet (Geist Mono)
  → ⚠️ Look & feel matching required: light theme static design → light theme animation guide
  → Reference techniques from various wpf-animation.pen categories (minimum 4+ CATs)

Phase 3 — Verify (design-evaluating):
  → design-craft.md Case B 3-axis evaluation
    B1: Requirements Fidelity (35 pts)
    B2: Animation Guide Richness (35 pts)
    B3: Design Quality & Separation (30 pts)
  → recording: logs + RPG
```

### Case B Checklist

A checklist to ensure the **separation quality** of static design and animation guide:

```
□ Are static screens and animation guides in physically separate frames?
□ Does each animation guide card specify a Target frame?
□ Is the look & feel consistent? (light↔light, dark↔dark)
□ Were techniques from 4+ categories in wpf-animation.pen referenced?
□ Does each card include a Before→After visual preview?
□ Are XAML code snippets syntactically correct WPF?
□ Are reusable components (sidebar, etc.) leveraged via ref?
```

---

## 4. Case C: Web Animation Research → JSON → Pencil Component (Copycat)

A workflow for analyzing real animations from specific websites, generating **JSON technique definitions**, and building **reusable Pencil components** from them.
**Core Principle: Analyze real web animations → define in JSON structure → accumulate as Pencil component library for reuse.**

```
Phase 1 — Gather (researching):
  → Access target URL and identify specific elements/sections
  → Analyze HTML/CSS/JS structure via WebFetch (libraries, @keyframes, transitions, etc.)
  → Capture section screenshots via Playwright (visual evidence)
  → Extract computed animations via browser_evaluate / browser_run_code:
    - CSS keyframes, animation properties
    - Lottie/dotlottie-player source URLs and structure
    - GSAP, Framer Motion, and other library usage
    - SVG animations, Canvas-based effects
  → If Lottie files found: download → unzip → analyze JSON layers/keyframes
  → Classify animation techniques (independent analysis per technique)

Phase 2a — Action: JSON Technique Definition (designing):
  → Create numbered files under design/json/sample/
  → Filename: {NN}-{technique-name}.json (e.g., 01-radial-voice-wave.json)
  → Required JSON structure for each:
    {
      "technique": "English technique name",
      "name_ko": "Korean technique name",
      "source": "Source URL + section description",
      "description": "Technique summary",
      "rendering": "Implementation method (Lottie/CSS/JS/SVG/Canvas)",
      "structure": { layer/element structure },
      "animationDetails": { keyframe/timing/easing/color details },
      "cssImplementation": { CSS/JS reproduction reference code }
    }
  → Independent JSON per technique: even a single animation splits into component parts
    (e.g., voice wave → 01-radial-layout, 02-trim-path, 03-color-transition each separate)

Phase 2b — Action: Pencil Component Update (designing):
  → Add component cards to wpf-animation.pen or dedicated .pen file based on JSON definitions
  → Each card structure:
    - Number + technique name (mapped from JSON technique/name_ko)
    - Source: original website URL
    - Rendering method indicator (Lottie/CSS/SVG, etc.)
    - Before → After visual preview
    - Key parameter summary (extracted from JSON)
  → 1:N or N:1 mapping between JSON and Pencil cards possible
  → Purpose: reuse in future Case W HTML implementations

Phase 2c — Action: COMBINED SAMPLE (designing):
  ⚠️ Must be created when 2+ techniques are found combined in the analyzed website
  → Create "SAMPLE — {name} (Combined Component)" frame at bottom of wpf-animation.pen
  → Frame components:
    - COMBINED SAMPLE badge (red #E4324F) + Source URL
    - Title (bilingual) + technique pipeline summary (analyze → separate → map)
    - Left VISUAL STRUCTURE: static representation of actual behavior + legend (Active/Inactive/Transition)
    - Right ANIMATION SPEC: key value grid (Canvas, Lines, Trim, Color, Stagger, Easing)
    - Right JSON REFERENCES: related JSON file paths ← technique name mapping
    - Bottom code blocks: WPF IMPLEMENTATION + CSS/SVG IMPLEMENTATION side by side
  → Value:
    - Individual cards = for learning/recombining techniques (user can mix as desired)
    - COMBINED SAMPLE = for immediate implementation as-is (no combining needed)
    - Case W can reference this single SAMPLE frame to implement the full animation

Phase 3 — Verify (design-evaluating):
  → design-craft.md Case C 3-axis evaluation
    C1: Research Depth & Accuracy (35 pts)
    C2: JSON Structure Completeness (35 pts)
    C3: Pencil Component Quality (30 pts)
  → recording: logs + RPG
```

### Case C Checklist

```
□ Were both WebFetch + Playwright tools utilized?
□ Was the actual implementation technology (Lottie/JS/CSS) correctly identified?
□ Were independent JSON files created with numbering in design/json/sample/?
□ Does each JSON include technique, source, structure, animationDetails, cssImplementation?
□ Were Pencil component cards created and mapped to JSON?
□ Are Before→After visual previews included?
□ Is the structure organized for reuse? (referenceable in future sessions)
□ If 2+ techniques were combined, was a COMBINED SAMPLE frame created?
□ Does the COMBINED SAMPLE integrate visual preview + spec + JSON refs + WPF/CSS code?
```

---

## 5. Case W: Pencil → HTML Implementation

⚠️ If Case C JSON technique definitions exist, dual-referencing `.pen` + `.json` enables more precise implementation.

```
Phase 1 — Gather:
  → Analyze .pen file categories/components (card structure/colors/layout via batch_get)
  → Read precise animation parameters from design/xaml/sample/*.xaml for target techniques
    ⚠️ Dual-reference required:
      .pen → identify techniques, visual structure, color scheme
      .xaml → obtain precise values: Duration, EasingFunction, From/To, BeginTime
      Reading .pen alone degrades quality! Must read .xaml for accurate WPF→Web mapping
  → Check animation guide cards (reference Case B artifacts if available)
  → Verify visual elements via get_screenshot()

Phase 2 — Action (designing):
  → Convert .pen static design to HTML/CSS/JS (separate JS/CSS implementation)
  → XAML → Web mapping (extended table):
    WPF DoubleAnimation → CSS transition or WAAPI
    QuadraticEase EaseIn → JS quadratic easing (t*t)
    SineEase EaseInOut → CSS ease-in-out or cubic-bezier(0.445,0.05,0.55,0.95)
    ScaleTransform → transform: scale()
    ColorAnimation → CSS color transition
    OpacityAnimation → opacity transition or JS globalAlpha
    TranslateTransform → transform: translateX/Y() or JS rAF
    RotateTransform → transform: rotate() + @keyframes
    ElasticEase → cubic-bezier(0.175, 0.885, 0.32, 1.275)
    Stagger BeginTime → animation-delay increments or WAAPI Promise chain
    AutoReverse + Forever → CSS alternate infinite
    RepeatBehavior="Forever" → animation: infinite or rAF loop
    Path stroke animation → SVG stroke-dasharray/dashoffset
    DropShadowEffect Glow → filter: drop-shadow() animation
    Confetti Burst → WAAPI particle system
  → SVG Reality Rules:
    ⚠️ Natural elements (petals, leaves) must use radialGradient (flat fill = paper scraps)
    ⚠️ Compound elements (flower+stem+leaf) must be a single unified SVG (separate = disconnected)
    ⚠️ Canvas particle initial appearance must have fade-in delay (prevents jitter)
    ⚠️ Use SVG Blob URL, Base64, or CSS instead of external images (PNG)
  → Sequential Animation (WAAPI recommended):
    Build Promise chains using Web Animations API .animate().finished
    Provide stage-by-stage progress indicator UI (Seed→Grow→Bloom, etc.)
  → Parameter Control UI: sliders for real-time speed/count/force adjustment
  → Multi-CAT utilization: integrate techniques from 4+ wpf-animation.pen categories
  → Save to: design/xaml/output/sample{N}/index.html
  → Implement as many animation guide cards as possible

Phase 3 — Verify (design-evaluating):
  → design-craft.md Case W 3-axis evaluation
    W1: Design Coverage (35 pts)
    W2: Animation Fidelity (35 pts)
    W3: Creative Extension (30 pts)
  → Playwright section capture (optional)
  → recording: logs + RPG
```

---

## 6. Playwright Section Capture

A workflow for capturing screenshots of each section of HTML demos.

```
1. python -m http.server 8765 (from the HTML directory)
2. browser_resize(1400, 900)
3. browser_navigate("http://localhost:8765/")
4. For each section:
   browser_evaluate(() => document.getElementById('{id}').scrollIntoView())
   waitForTimeout(1500)
   browser_take_screenshot(filename: "tmp/playwright/sample{N}/{order}-{section}.png")
⚠️ Screenshots are saved under tmp/playwright/ (not for git commit — file size concerns)
```

---

## 7. Logs & RPG

Execute during the recording phase after all work is complete.

```
1. Log: harness/logs/yyyy-mm-dd-{keyword}-case{A|B|C|W}.md
2. Index: Add 1 line to harness/logs/harness-usage.md
3. XP calculation: BaseXP(score×10) × GradeMultiplier(A:5/B:3/C:1/D:0.5) × TypeMultiplier(A:1.2/B:1.2/C:1.2/W:1.2)
4. Level-up check + achievement update (refer to harness/engine/level-achievement-system.md)
```

---

## 8. Pipeline Bonus

| Pipeline | Condition | Bonus |
|----------|-----------|-------|
| A → B | Both 60+ pts | Each XP × 1.2 |
| A → W | Both 60+ pts | Each XP × 1.2 |
| B → W | Both 60+ pts | Each XP × 1.3 |
| C → W | Both 60+ pts | Each XP × 1.3 |
| C → B | Both 60+ pts | Each XP × 1.2 |
| A → B → W | All 60+ pts | Each XP × 1.5 |
| C → B → W | All 60+ pts | Each XP × 1.5 |
