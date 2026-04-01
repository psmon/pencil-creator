# design-craft.md — Design Workflow Evaluation Criteria

Evaluates the quality of **design transformation workflows** handled by the Pencil Design skill.
Scoring is based on criteria specific to design deliverables.

---

## 1. Evaluation Target Cases

| Case | Flow | Trigger Condition |
|------|------|-------------------|
| **Case A** (Template) | WPF XAML research → enrich wpf-animation.pen template | "Research WPF templates and enrich them", etc. |
| **Case B** (Project) | Reference wpf-animation.pen → project .pen design (static + animation guide) | "Reference wpf-animation effects and design OO", etc. |
| **Case C** (Copycat) | Web animation analysis → JSON technique definition → accumulate Pencil components | "Research OO site animations and strengthen template", "Analyze URL and organize JSON", etc. |
| **Case W** (Web) | Reference .pen file → HTML/web implementation | When HTML/CSS/JS page is completed referencing a .pen file |

Cases A and B can trigger independently or as a continuous pipeline (A → B → W).

---

## 2. Case A: WPF Research → Template Enrichment (3 Axes, 100 Points)

Workflow for **adding new WPF animation technique cards** to wpf-animation.pen.

### Axis A1: Research Novelty & Non-Duplication (35 Points)

Were new techniques added **without duplication** compared to existing cards in wpf-animation.pen?

| Score | Criteria |
|-------|----------|
| 0 | Mostly duplicates existing elements, no new techniques |
| 15 | 1-2 new techniques but similar variations of existing ones |
| 25 | 3+ new techniques, clearly distinct from existing categories |
| 35 | Introduces previously absent categories/paradigms + discovers original techniques |

**Evaluation Method:**
```
1. Collect existing category/card list from wpf-animation.pen (batch_get)
2. Compare with newly added cards
3. Duplicate = same WPF property (e.g., DoubleAnimation on Opacity) applied to the same control
4. Novel = previously absent WPF property combinations, new controls, new interaction patterns
```

### Axis A2: Visualization Expressiveness (35 Points)

Does the static image **intuitively convey animation before/after states (Before → After)**?

| Score | Criteria |
|-------|----------|
| 0 | Text description only, no visual state representation |
| 15 | Single state only (Before or After only) |
| 25 | Both Before/After represented + arrow/transition indicators |
| 35 | Multi-stage state transitions + clear visual differences in color/size/position + layout consistency |

**Evaluation Method:**
```
1. Check visual preview area of each card via get_screenshot()
2. Identify state transition expression patterns:
   - Hover transition: Normal → Hover side-by-side placement
   - Color change: gradient stage representation
   - Size change: overlay/side-by-side placement
   - Rotation: arc or angle indicator
3. Overall visual consistency across cards (color scheme, spacing, fonts)
```

### Axis A3: Technical Metadata Completeness (30 Points)

Are XAML code snippets and research history complete and accurate?

| Score | Criteria |
|-------|----------|
| 0 | No code snippets, no source records |
| 12 | Code snippets present but incomplete or sources unrecorded |
| 22 | Executable XAML snippets + research-history.md records |
| 26 | Standalone .xaml sample files + source URLs + key technical keywords recorded |
| 30 | Above criteria + **COMBINED SAMPLE frame** (2+ techniques integrated, visual preview + spec + WPF/CSS code in one) |

**Evaluation Method:**
```
1. Check existence of design/xaml/sample/*.xaml files and WPF Window standalone executability
2. Check design/xaml/research-history.md for source URLs, dates, key technical keywords
3. Verify XAML syntax accuracy of code blocks in wpf-animation.pen
4. Check for COMBINED SAMPLE: integrated use case combining 2+ techniques in a single frame
   - Includes visual preview + spec grid + XAML/JSON reference + WPF/CSS code blocks
   - Level where referencing this single frame enables full implementation in Case W
```

---

## 3. Case B: wpf-animation.pen Reference → Project Design (3 Axes, 100 Points)

Workflow for designing a new .pen file meeting project requirements by **referencing** animation techniques from wpf-animation.pen.
**Core Principle: Separate static design (look & feel) from dynamic definitions (animation guide).**

### Axis B1: Requirements Fidelity (35 Points)

Are all user-requested **pages/features/UX flows** reflected in the static design?

| Score | Criteria |
|-------|----------|
| 0 | Most requirements missing, page composition incomplete |
| 15 | Main pages exist but some features missing |
| 25 | Full page composition complete, all major features reflected, natural UX flow |
| 35 | All requirements covered + state expressions (loading/error/empty) + reusable components like sidebar/nav |

**Evaluation Method:**
```
1. Extract user requirements list (menus, features, validations, etc.)
2. Map per-screen in .pen file: requirement → implemented frame
3. Coverage = (implemented requirements / total requirements) × 100%
4. UX flow: navigation consistency between screens, sidebar state changes
```

### Axis B2: Animation Guide Richness (35 Points)

How **diversely** were wpf-animation.pen techniques **referenced and mapped** to the project?
Does each animation card have **Target frame specification + Before→After visualization + XAML code**?

| Score | Criteria |
|-------|----------|
| 0 | No animation guide or text memo level only |
| 15 | 3 or fewer animation cards, referencing 1-2 wpf-animation.pen categories |
| 25 | 6+ cards, 3+ wpf-animation.pen categories referenced, Target/Before→After/XAML structure |
| 35 | Per-screen dedicated categories + 8+ diverse techniques + fully complete card structure + look & feel matching |

**Evaluation Method:**
```
1. Count animation guide frames and cards
2. Identify wpf-animation.pen categories referenced by each card (CAT1~12 mapping)
3. Card structure completeness: Title + Target spec + Description + Before→After Visual + XAML Code
4. Look & feel consistency: animation guide theme matches static design (important!)
5. ⚠️ Dual-reference check: Were both wpf-animation.pen (visual structure) and design/xaml/sample/*.xaml
   (precise parameters) referenced? Referencing .pen only leads to inaccurate Duration/Easing/From-To values
```

### Axis B3: Design Quality & Separation Technique (30 Points)

Is the static design's **visual completeness** and static↔dynamic **separation architecture** correct?

| Score | Criteria |
|-------|----------|
| 0 | Layout broken, mixed without separation |
| 12 | Basic layout complete, separation attempted but incomplete |
| 22 | Consistent theme/font/color + clear static-dynamic separation + animation references application points |
| 30 | Design system utilization (reusable components) + perfect separation + style guide compliance + responsive consideration |

**Evaluation Method:**
```
1. Check visual completeness via screenshots (alignment, spacing, color consistency)
2. Separation check: static screen frames and animation guide frames physically separated
3. Reference check: animation cards specify application points as "Target: {Screen}/{Frame}"
4. Reuse: common components like sidebar defined as reusable and used via ref
5. Look & feel matching: if static design uses light theme, animation guide also uses light theme
```

---

## 4. Case C: Web Animation → JSON → Pencil Component (3 Axes, 100 Points)

Workflow for analyzing real website animations, **generating JSON technique definitions**, and **accumulating reusable Pencil components**.
**Core Principle: 3-stage pipeline of web analysis (WebFetch) → JSON structuring → Pencil library accumulation.**
*Playwright is used as an auxiliary tool only when requested by the user.*

### Axis C1: Research Depth & Accuracy (35 Points)

How **deeply and accurately** were the target website's animations analyzed?

| Score | Criteria |
|-------|----------|
| 0 | Only screenshots captured, no technical analysis |
| 15 | Surface HTML/CSS analysis only, actual implementation technology unidentified |
| 25 | WebFetch deep analysis, implementation technology accurately identified (Lottie/GSAP/CSS/SVG), keyframes extracted |
| 35 | Above criteria + Lottie JSON layer parsing or JS runtime analysis + precise color/timing/easing value extraction |

**Evaluation Method:**
```
1. Was HTML/CSS/JS structure sufficiently analyzed via WebFetch?
2. Were animation implementation technologies (Lottie, CSS @keyframes, GSAP, Framer Motion, etc.) accurately identified?
3. When Lottie files found: was download → ZIP extraction → JSON layer/keyframe analysis performed?
4. Were specific values obtained for colors (hex/rgba), timing (ms), easing functions?
5. (Bonus) If Playwright browser_evaluate/run_code was used per user request, accepted as additional evidence
```

### Axis C2: JSON Structure Completeness (35 Points)

Evaluates the **structural completeness and reusability** of generated JSON technique definitions.

| Score | Criteria |
|-------|----------|
| 0 | No JSON file generated or unstructured memo level |
| 15 | JSON generated but missing required fields or insufficient technique separation |
| 25 | Independent JSON per technique + technique/source/structure/animationDetails/cssImplementation present |
| 35 | Above criteria + consistent numbering + inter-technique cross-references + CSS/JS reproduction code + color palette/easing details |

**Evaluation Method:**
```
1. Were numbered JSON files generated under design/json/sample/?
2. Required fields in each JSON file:
   - technique (English name), name_ko (Korean name)
   - source (source URL + section)
   - description (summary)
   - rendering (implementation method: Lottie/CSS/JS/SVG)
   - structure (layer/element structure)
   - animationDetails or relevant technique details (keyframes/timing/colors)
   - cssImplementation (CSS/JS reproduction reference)
3. Were complex animations properly separated into constituent elements?
4. Can the technique be reproduced by reading only this JSON in a future session?
```

### Axis C3: Pencil Component Quality (30 Points)

Evaluates the **visual quality and reusability** of Pencil components converted from JSON.

| Score | Criteria |
|-------|----------|
| 0 | No Pencil component generated |
| 12 | Component generated but unclear JSON mapping, no Before→After |
| 22 | Clear JSON↔Pencil card mapping + Source/rendering method displayed + Before→After preview |
| 26 | Above criteria + dark/light theme consistency + key parameter summary card + immediately referenceable in future Case W |
| 30 | Above criteria + **COMBINED SAMPLE frame** (visual preview + spec grid + JSON reference + WPF/CSS unified code) |

**Evaluation Method:**
```
1. Were Pencil components generated in wpf-animation.pen or a dedicated .pen file?
2. Is each card clearly mapped to which JSON technique definition file?
3. Does each card include Source URL, rendering method, Before→After visual preview?
4. Is consistency maintained with existing card styles (dark theme, accent colors, etc.)?
5. Can this card be referenced for HTML implementation in a future Case W workflow?
6. COMBINED SAMPLE presence check (required when combining 2+ techniques):
   - Individual cards = for per-technique learning/recombination
   - COMBINED SAMPLE = for immediate real-case implementation (enables Case W entry from this single frame)
   - Includes visual preview + spec values + JSON reference + WPF/CSS code all-in-one
```

---

## 5. Case W: Pencil → HTML/Web Implementation (3 Axes, 100 Points)

### Axis W1: Design Element Coverage (35 Points)

How much of the components/effects defined in the .pen file were **reflected in the HTML implementation**?

| Score | Criteria |
|-------|----------|
| 0 | Written independently without .pen reference (design ignored) |
| 15 | Only elements from 1-2 categories partially applied |
| 25 | Elements applied from 3+ categories, most major components reflected |
| 35 | All categories covered + at least 1 representative element implemented per category |

**Evaluation Method:**
```
1. Collect category and component list from .pen file
2. Map where each element is implemented in HTML/CSS/JS
3. Coverage = (implemented component count / total component count) × 100%
4. Create mapping table (pen element → HTML implementation location)
```

### Axis W2: Animation Implementation Fidelity (35 Points)

Was the animation intent expressed in static design **faithfully converted to actual dynamic animation**?

| Score | Criteria |
|-------|----------|
| 0 | Static HTML with no animation |
| 15 | Basic CSS transition only (hover color change level) |
| 25 | CSS animation + transition used diversely, 3+ animation patterns |
| 30 | CSS + JS combination for complex animations + accurate reflection of original design intent + interactions |
| 35 | Above criteria + **multi-CAT usage (4+)** + **WAAPI sequential sequences** + **SVG realism (gradients/integrated structure)** |

**Evaluation Method:**
```
1. Check WPF → Web mapping fidelity:
   - QuadraticEase EaseIn → JS quadratic easing (t*t)
   - SineEase EaseInOut → CSS ease-in-out or cubic-bezier
   - AutoReverse + Forever → CSS alternate infinite
   - ScaleTransform → transform: scale()
   - RotateTransform → transform: rotate() + @keyframes
   - TranslateTransform → translateX/Y()
   - RepeatBehavior="Forever" → animation: infinite or rAF loop
   - BeginTime stagger → animation-delay increments
   - Path animation (stroke-dashoffset) → SVG stroke-dasharray/dashoffset
   - ElasticEase → cubic-bezier(0.175, 0.885, 0.32, 1.275)
   - Particle system → JS Canvas rAF or WAAPI
   - Glow/pulse → filter: drop-shadow() or box-shadow animation
2. SVG realism quality:
   - radialGradient applied to natural elements (petals, leaves)? (flat fill = deduction)
   - Integrated SVG structure for complex elements (flower+stem+leaf)? (disjointed = deduction)
   - fade-in on initial appearance? (prevents jitter)
3. Sequential animation implementation:
   - Web Animations API (WAAPI) or Promise chain usage
   - Stage-by-stage progress indicator
4. Fine-tuning of easing, duration, delay
5. Multi-CAT usage: integrating techniques from 4+ categories of wpf-animation.pen
6. ⚠️ Dual-reference required: Were both .pen (visual structure/card layout) and .xaml (precise parameters)
   referenced? Referencing .pen only = "approximate implementation", referencing .xaml too = "precise implementation"
   - .pen → which technique, visual structure, color scheme
   - .xaml → Duration, EasingFunction, From/To, BeginTime and other precise values
```

### Axis W3: Creative Extension & Completeness (30 Points)

Did the implementation go beyond design reference to achieve **creative extension** and **page completeness**?

| Score | Criteria |
|-------|----------|
| 0 | Simple element listing, insufficient page completeness |
| 12 | Basic layout complete, design elements simply placed |
| 22 | Responsive + interactive elements + consistent theme/UX flow |
| 26 | Creative interactions not in the design + complete UX storyline + accessibility considerations |
| 30 | Above criteria + **narrative sequence animation** (e.g., AI Bloom) + **parameter control UI** + **no external images needed (self-generated SVG/Base64)** |

**Evaluation Method:**
```
1. Responsive: @media queries, fluid layout existence
2. Interaction: diversity of click/scroll/hover event handlers
3. UX story: logical flow between sections
4. Accessibility: semantic HTML, color contrast, keyboard navigation
5. Originality: new interaction patterns not in the .pen file
6. Narrative sequence: story animation progressing through stages (e.g., Seed→Bloom)
7. Parameter control: real-time animation parameter adjustment via sliders, etc.
8. Self-contained resources: resolved via SVG Blob URL, Base64, CSS without external images (PNG)
```

---

## 6. Grade System

| Grade | Score Range |
|-------|------------|
| A | 80-100 |
| B | 60-79 |
| C | 40-59 |
| D | 0-39 |

---

## 7. Pipeline Evaluation

### A → B Sequential Execution
- Both 60+ points → 1.2x XP bonus each
- Reason: Rewards consistent flow of enriching templates then immediately applying to project

### B → W Sequential Execution
- Both 60+ points → 1.3x XP bonus each
- Reason: Rewards complete design → implementation pipeline

### A → W Sequential Execution
- Both 60+ points → 1.2x XP bonus each
- Reason: Rewards direct template research to web implementation pipeline

### C → W Sequential Execution
- Both 60+ points → 1.3x XP bonus each
- Reason: Rewards web animation analysis to immediate HTML implementation copycat pipeline

### C → B Sequential Execution
- Both 60+ points → 1.2x XP bonus each
- Reason: Rewards cross-pipeline of applying web animation techniques to project design

### A → B → W Full Pipeline
- All three 60+ points → 1.5x XP bonus each
- Reason: Rewards complete loop of research → design → implementation

### C → B → W Full Pipeline
- All three 60+ points → 1.5x XP bonus each
- Reason: Rewards complete copycat loop of web analysis → project design → implementation

---

## 8. Evaluation Procedure

```
Step 1. Trigger Detection
  - Case A: WebSearch for WPF research + new cards added to wpf-animation.pen
  - Case B: wpf-animation.pen referenced + new .pen design completed for project requirements
  - Case C: Website animation analyzed + JSON technique definition + Pencil component generation completed
  - Case W: .pen file referenced + HTML/CSS/JS files generated

Step 2. Context Collection
  → Case A: compare existing vs. new cards in wpf-animation.pen
  → Case B: user requirements list + static screens + animation guide check
  → Case C: analysis tool utilization + JSON file structure + Pencil component mapping
  → Case W: .pen component → HTML mapping

Step 3. 3-Axis Scoring
  → Score per axis according to evaluation method
  → Record 1-line evidence per axis

Step 4. Result Output
  → Total score + grade + per-axis scores + mapping table
  → Pass to recording stage (for XP calculation)
```
