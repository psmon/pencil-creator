# Pencil Creator

[![Pencil Creator Demo](https://img.youtube.com/vi/wx6UsD48zXs/maxresdefault.jpg)](https://www.youtube.com/watch?v=wx6UsD48zXs)

> ▶ Click the image to watch the **PencilCreator demo video**.

![Pencil Creator](design/img/intro.png)

**Look & Feel + Animation First Design** — A Claude Code project for designing and validating look & feel and animations before building web applications.
It provides 11+ (and growing) animatable controls out of the box, and with this design harness you can discover and add controls like the above using only prompts.

# MS Blend for Visual Studio

![Pencil Creator](design/img/blend-xaml.png)

Pencil can implement animated web content using definition files alone.

Optionally, by using the **Blend tool** in addition,
you can control the detailed movements of animations more directly.
It serves as a **complement to Pencil's timeline & storyboard features**.

> ⚠️ **Terminology — two similarly-named tools appear in this project.**
> - **MS Blend for Visual Studio** (above) — the WPF XAML timeline/storyboard design tool, used in Case A/W work.
> - **Blender 3D** — the open-source 3D modeling tool, driven via Blender MCP in [Case M](#case-m-3d-modeling---web-3d-animation-blender---threejs) to produce 3D assets.
>
> They are completely different tools.

---

## Pencil Design Files (.pen)

The design artifacts of this project are managed as `.pen` files for the [Pencil](https://pencil.elpass.app/) editor.
Download the files below and open them in the Pencil editor to explore the animation templates and project designs.

| File | Description | Download |
|------|-------------|----------|
| WPF Animation Template | 12 CATs, 40+ technique card library | [`design/wpf-animation.pen`](design/wpf-animation.pen) |
| Publisher App Design | Web ZIP publisher app (4 screens + 12 animation guide cards) | [`projects/design/publisher-app.pen`](projects/design/publisher-app.pen) |

---

## Design-First Concept

The core philosophy of this project is **"Design before code, animation design before static design."**

```
+----------------------------------------------------------------+
|                    ANIMATION-FIRST DESIGN                       |
|                                                                 |
|  1. WPF Animation Research   DoubleAnimation, ScaleTransform,   |
|     (Case A)                 Easing, Storyboard pattern mining  |
|           |                                                     |
|           v                                                     |
|  2. Animation Template       wpf-animation.pen                  |
|     Library Build            10 CATs, 37 technique cards        |
|           |                                                     |
|           v                                                     |
|  3. Project Design           Static look & feel screens         |
|     (Case B)                 + Animation guides (separated!)    |
|           |                                                     |
|           v                                                     |
|  4. HTML Implementation      Convert to CSS/JS animations       |
|     (Case W)                 Apply WPF -> CSS mapping rules     |
|           |                                                     |
|           v                                                     |
|  5. Harness Evaluation       3-axis scoring + RPG experience    |
|     & Improvement                                               |
|           |                                                     |
|           v                                                     |
|        Iterate                                                  |
+----------------------------------------------------------------+
```

**Why design animations first?**

- Animations feel awkward when added later. You need to design **state transitions (Before -> After)** from the start for a natural UX.
- WPF Storyboard patterns are the best reference for explicitly defining animation properties (target, duration, easing).
- **Separating** static design from dynamic definitions allows animations to remain independent when the look & feel changes.

---

## Application Layout — Project Design Artifacts

### Publisher App (Web ZIP Publisher)

An application for uploading ZIP files to publish and manage websites.

**Static Design (4 screens):**

| Screen | Key Components |
|--------|---------------|
| Dashboard | 4 stat cards + published sites table |
| Upload | Drag & drop zone + progress bar + completed file list |
| Publish | Form (name/publisher/description/favicon) + validation + publish button |
| View Sites | 6 site card grid (3x2) + open in new window / delete |

**Animation Guide (4 categories, 12 cards):**

| Category | Card | WPF Technique | Target Element |
|----------|------|---------------|----------------|
| CAT-A Dashboard | Counter Roll-Up | DoubleAnimation + CubicEaseOut | Stat value text |
| | Staggered Row Entrance | TranslateY + Opacity Stagger | Table rows |
| | Skeleton Shimmer | GradientStop + Forever | Loading state |
| CAT-B Upload | Dropzone Pulse Glow | Opacity + Shadow AutoReverse | Dropzone border |
| | Progress Bar Gradient | Width DoubleAnimation | Progress fill |
| | File Card Slide-In | TranslateX + ElasticEase | Completed file cards |
| CAT-C Publish | Floating Label Input | Y + Scale + ColorAnimation | Input fields |
| | Validation Stagger Check | Scale + BounceEase | Validation items |
| | Publish Button Ripple | Ellipse Scale + Opacity | Publish button |
| CAT-D View Sites | Card Hover Scale + Lift | ScaleTransform + Shadow | Site cards |
| | Gradient Background Shift | PointAnimation + Forever | Card thumbnails |
| | Delete Bounce Shrink | BackEaseIn + Opacity | Delete action |

File: `projects/design/publisher-app.pen`

---

## WPF Animation Research Techniques

### Research -> Visualization Pipeline

WPF Storyboard/DoubleAnimation/Transform patterns are researched and **statically visualized** as Pencil design cards.

```
WebSearch XAML examples
    |
    v
Extract key properties
  - TargetProperty (Opacity, ScaleX, TranslateX...)
  - Duration, BeginTime
  - EasingFunction (CubicEaseOut, ElasticEase, BounceEase...)
  - RepeatBehavior, AutoReverse
    |
    v
Create Pencil card
  +------------------------------+
  | 1-1  FLOATING LABEL TEXTBOX  |  <- Number + Title
  |                               |
  | Focus -> Label Y^18px        |  <- Behavior description
  | Scale 75%, Color transition   |
  |                               |
  | +----------+  ->  +----------+|  <- Before -> After
  | | Username |      | Username ||
  | |          |      | #        ||
  | +----------+      +----------+|
  |                               |
  | <DoubleAnimation              |  <- XAML code
  |   TargetProperty="Y"         |
  |   To="-18" Duration="0.2"/>  |
  +------------------------------+
```

### Current Template Library

| Resource | Path | Scale |
|----------|------|-------|
| Animation Template | `design/wpf-animation.pen` | 12 CATs, 40+ cards |
| XAML Samples | `design/xaml/sample/*.xaml` | 27 standalone files |
| Research History | `design/xaml/research-history.md` | 20 sources/techniques recorded |
| **WPF App (for Blend)** | `design-wpf-app/` | **27 UserControls (Blend timeline editable)** |

**Category List:**

| CAT | Topic | Key Techniques |
|-----|-------|---------------|
| 1 | Data Input Controls | Floating Label, ComboBox, Toggle |
| 2 | Feedback & Notification | Snackbar, Progress Bar, Badge |
| 3 | Navigation & Transitions | Page Transition, Tab Slide, Hamburger Morph |
| 4 | Decorative & Background | Gradient BG, Particle Dots, Pulsing Glow |
| 5 | 3D Transform & Shape Morph | Flip Card, Morphing, Elastic Spring |
| 6 | Path & Trajectory | Path Follower, Parallax, Drag & Drop |
| 7 | Text & Sequential | Typewriter, Marquee, Staggered List |
| 8 | Interactive UI Controls | Ripple Button, Accordion, Tooltip |
| 9 | Data Visualization & Loading | Skeleton Shimmer, Circular Progress, Bar Chart |
| 10 | Ambient & Decorative FX | Wave Ripple, Breathing Pulse, Marching Ants |
| 11 | Celebration & Advanced | Confetti Burst, Zoom/Pinch, Animated Tooltip |
| 12 | Spring & Nature Particle | Cherry Blossom Fall, Petal Scatter, Breeze Sway |

---

## Harness Workflow (Case A · B · W · S · M)

### Case A: WPF Template Enrichment

```bash
> "Research WPF templates and enrich them"
> "Research WPF Elastic/Spring effects and add them to wpf-animation.pen"
```

Directly researches WPF XAML via WebSearch and adds cards to `design/wpf-animation.pen`.

| Evaluation Axis | Max Score | Key Criteria |
|-----------------|-----------|-------------|
| A1 Research Novelty | 35 | Were new techniques added without duplicating existing ones? |
| A2 Visualization Expressiveness | 35 | Is the Before->After transition intuitive? |
| A3 Metadata Completeness | 30 | Are the XAML code and sources accurate? |

### Case B: Project Design (Design-First)

```bash
> "Design a publisher app in Pencil referencing wpf-animation effects"
> "Design a shopping mall admin page referencing wpf-animation"
```

Uses wpf-animation.pen as a **reference library** to create separated static look & feel + animation guide designs.

| Evaluation Axis | Max Score | Key Criteria |
|-----------------|-----------|-------------|
| B1 Requirements Fidelity | 35 | Were all required pages/features designed? |
| B2 Animation Guide Richness | 35 | Diverse WPF technique mapping + target specification |
| B3 Design Quality & Separation | 30 | Look & feel consistency + static/dynamic separation |

### Case W: HTML Implementation

```bash
> "Create HTML referencing the Pencil design"
> "Implement the publisher-app.pen design as a web page"
```

Converts the .pen file's static design + animation guide into HTML/CSS/JS.

| Evaluation Axis | Max Score | Key Criteria |
|-----------------|-----------|-------------|
| W1 Design Coverage | 35 | How much of the .pen elements were reflected? |
| W2 Animation Fidelity | 35 | Were the animation guides actually implemented? |
| W3 Creative Extension | 30 | Were interactions beyond the design added? |

### Case S: Sprite Animation (Concept / Video -> Sprite Sheet)

```bash
> "Make sprite sheets from this concept art"
> "Analyze this YouTube singer's motion and build a vocal-ex sprite"
```

Turns concept art **or a real video's motion** into background-transparent, game/web-ready
sprite sheets (Aseprite Hash JSON). Two image providers are supported — **Gemini** (batch,
seed-fixed consistency) and **OpenAI gpt-image-2** (concept-as-reference consistency, no seed).
Real footage can be analyzed first via the `video-motion-analysis` skill (yt-dlp + ffmpeg
contact sheets) to extract a motion vocabulary, which is then mapped to sprite keyframes.

**Featured case — `vocal-ex`** (FIFA World Cup 'DNA' stage singer):
the singer's 47–55s close-up sequence was analyzed, a character concept was generated with
gpt-image-2, then 14 frames (idle 6 + play 8 — 1.75x the standard 8) were produced and
post-processed (HSV matte -> palette quantize -> Aseprite JSON). Case S score: **93 / A**.

Concept (gpt-image-2) -> sprite sheet (play, 8 frames):

![vocal-ex concept](image/openai/2026-06-13-vocal-ex-concept.png)

![vocal-ex play sheet](design/sprite/output/vocal-ex/play.png)

> The motion arc: mic raise -> head sway -> **chin-up climax** -> sustain -> **both-arms finale**.
> A live player for all sprite collections (orchestra + vocal + dance + vocal-ex) ships as
> `sample15` — see the [demo site](https://psmon.github.io/pencil-creator/sample15/).

| Evaluation Axis | Max Score | Key Criteria |
|-----------------|-----------|-------------|
| S1 Character Fidelity | 35 | Concept vs. frame 0 palette/identity consistency |
| S2 Animation Quality | 35 | Frame count, grid alignment, loop seam |
| S3 Engineering Usability | 30 | Alpha, Aseprite JSON, packed master + index |

### Case M: 3D Modeling -> Web 3D Animation (Blender -> Three.js)

```bash
> "Analyze this promo video, model the apartment complex in 3D, and build it for the web"
> "Model it in Blender first, then make a web 3D page with 5 cinematic camera moves"
```

> ⚠️ **Blender** here means the open-source 3D modeling tool **Blender 3D** —
> not **MS Blend for Visual Studio** (the WPF XAML design tool described above).

This is the **"model first -> implement web second"** pipeline.
The 3D space is finalized in Blender (real coordinates, real dimensions) and the
**`.blend` file is adopted as a design asset** (`design/blend/` — a reusable asset on par
with `.pen` files). The web side (Three.js) ports those placement numbers verbatim via the
coordinate rule (`x,y,z -> x,z,-y`) and layers cinematic camera direction on top.

**💡 If prompting the 3D model is hard — go through video footage instead.**
When a 3D structure is difficult to describe in words, analyze a YouTube/local video first.
Extracting frames with ffmpeg (or the `video-motion-analysis` skill) turns the reference into
**numbers** — building count, floor counts, height hierarchy, layout, lighting mood — and those
numbers become the Blender modeling spec. Instead of describing "what it looks like,"
you just say "like this video."

The 7-step flow:
1. Reference analysis (video/image) -> 2. Blender MCP modeling (render-verify per chunk) ->
3. Save the `.blend` asset (`design/blend/`) -> 4. Three.js rebuild (port the numbers) ->
5. Camera direction (ease-in-out blending) -> 6. Playwright verification -> 7. Deploy

**Featured case — `sample17` (ACMER Dongtan Cinematic 3D)**:
a 61s apartment promo video -> 30 analyzed frames -> 5 towers + Korean 20/30/40/80-pyeong
interiors -> 11 camera modes (5 cinematic + 4 balcony-entry cutaway interior tours +
2 construction timelapses) + a 9-piece gpt-image-2 photoreal texture ON/OFF toggle.
Master asset: [`design/blend/acmer-dongtan.blend`](design/blend/acmer-dongtan.blend) ·
[live demo](https://psmon.github.io/pencil-creator/sample17/)

| Evaluation Axis | Max Score | Key Criteria |
|-----------------|-----------|-------------|
| M1 Modeling Fidelity | 40 | Reference match, real-scale space, lighting mood, verify renders |
| M2 Web Rebuild Consistency | 30 | Coordinate/dimension porting, material parity, performance (InstancedMesh) |
| M3 Camera Direction | 30 | 5+ modes, transition blending, 3-phase interior entry |

#### Case M variant — Rigged Idol Concert Music Video (Blender, no web)

```bash
> "Analyze design/idola, model 4 idols photorealistically, dress them, rig them, and
>  choreograph a groove dance to music/BEAT_Mastered_run.wav on a night outdoor stage"
```

A **character + performance** branch of Case M that outputs a **music-synced concert video**
instead of a web page. Everything is built procedurally in Blender via MCP / headless CLI and
saved as reusable assets under `design/idola/` (scripts in `design/idola/scripts/`).

The pipeline, end to end:

1. **Members** — reference analysis (album art) + K-pop body/face proportion research →
   Gemini realistic face & fabric textures (sphere-pre-distorted for clean head wrapping).
2. **Rig** — skin-modifier idol base body + humanoid armature (17 bones) + automatic skinning
   + **separate swappable garments** (hanbok: jeogori bodice, baerae sleeves, gloves, slim
   skinned chima) + member initials (Y·U·N·A) + head-on-bone.
3. **Physical walk** — world-pinned foot IK (no ghost glide), reach clamp + knee-pole parenting
   (no reverse/side knee), shoulder ROM forward-bias (no chicken-wing arm).
4. **Choreography** — pure-stdlib beat analysis (BPM 84.2) → beat-locked gentle groove with
   per-member phase offset + rotating spotlight (member steps forward) + arc blocking.
5. **Night stage** — generated skybox backplate, stage/truss/LED/speakers, **Lego-style crowd**
   (one minifig instanced, hat/hair toppers, color-varied, beat bob), night concert lighting
   (color spots + cool key + warm rim + footlight).
6. **Broadcast camera (31 cuts)** — drone establishes/sweeps, audience-reaction cutaways,
   spotlight push-ins, audience-POV, 3/4 dolly, low hero, crane; hard cuts on phrase boundaries.
7. **LED jumbotron (2-pass)** — a broadcast cam close-up of the on-stage artist is rendered,
   then fed to the LED wall as a frame-synced image sequence → real live-relay screen.

**Featured output — YUNA night concert**: full 177 s music video
[`design/idola/renders/yuna-concert-full.mp4`](design/idola/renders/yuna-concert-full.mp4) ·
rig asset [`design/blend/yuna-rig4.blend`](design/blend/yuna-rig4.blend) ·
render performance log [`design/idola/render-performance-log.md`](design/idola/render-performance-log.md)
(AMD Radeon 8060S, EEVEE, 2-pass full song ≈ 20 min).
*Ongoing: swappable songs (e.g. `music/05_Ice cream moon.flac`), finger rig, richer crowd.*

#### Case M variant — Unity Real-Time Idol Performance (Unity backend, Play-capture video)

```bash
> "Set up Unity MCP as a Blender alternative for Case M"
> "Base a cute YUNA k-pop group on a Mixamo character, choreograph a group dance to
>  Ice cream moon, build a storybook ice-cream stage, and render the performance video"
```

The **Unity real-time backend** for the Case M character-performance branch (the Blender
alternative). A live Unity 6.2 Editor is driven via **Unity MCP** (`Unity_RunCommand` C# +
Playwright for asset sourcing). Everything is authored in **URP** and the final video is made by
**capturing the real Play-mode Animator** — not offline sampling.

The 6-step flow (details: [`harness/engine/unity3d-flow.md`](harness/engine/unity3d-flow.md)):

1. **Character** — a **Mixamo** humanoid base (Playwright download → `FBX for Unity`) imported as
   Humanoid; embedded textures extracted, face decals set to URP alpha-clip; members
   differentiated by **HSV atlas recolor** (mask the pure garment hue, skip skin).
2. **Solo skills** — Mixamo *Without-Skin* clips imported Humanoid → **Mecanim auto-retarget**
   (no Blender retarget-flip pain); all members share one transition-free controller a director
   drives via `CrossFade`.
3. **Group choreography** — song analyzed with `soundfile`+`numpy` (BPM/section/climax) →
   `ChoreographyDirector` (unison ≈ 20% + **Y→U→N→A spotlight rotation** + curved-arc blocking).
4. **Storybook stage** — procedural ice-cream cones/moon/balloons/candy particles + gradient sky
   dome + URP post (Bloom/Color/Vignette); `MoonController` sweeps the moon right→left and flies an
   **E.T.-bicycle silhouette across the moon mid-song** (parody event).
5. **Broadcast camera** — `CameraDirector` cuts (drone / dolly / spotlight push-in / hero / crane),
   all synced to the shared clock; **close framings so gentle moves read**.
6. **Video render** — ⚠️ the reliable path is **`PlayCapture`**: `Time.captureFramerate` steps the
   real Animator at a fixed fps, `LateUpdate` renders the Main Camera to disk, a shared `PerfClock`
   drives the three directors, audio is muxed by ffmpeg. *(Offline `AnimationMode` sampling freezes
   the skinned mesh; Unity Recorder 5.1.2 is incompatible with Unity 6.2 — both avoided.)*

**Featured output — YUNA "Ice Cream Moon"**: full 3:35 performance video
[`design/idola/renders/yuna-icecream-moon.mp4`](design/idola/renders/yuna-icecream-moon.mp4)
(720p24 + music, real Play-mode animation). Unity project lives under
`G:\Unity\Projects\My project\Assets\YUNA\` (Base / Dances / Stage / Scripts).

> **Blender vs Unity backend for Case M:** Blender = photoreal offline render, procedural control,
> `.blend` asset. Unity = real-time engine, trivial Mecanim retargeting, URP + Cinemachine, and
> fast Play-capture video — better for interactive / game-oriented idol performances.

### Pipeline Bonus

| Path | Condition | XP Bonus |
|------|-----------|----------|
| A -> B | Both 60+ pts | x1.2 |
| A -> W | Both 60+ pts | x1.2 |
| B -> W | Both 60+ pts | x1.3 |
| S -> W | Both 60+ pts | x1.3 |
| M -> W | Both 60+ pts | x1.3 |
| S -> M | Both 60+ pts | x1.2 |
| A -> B -> W | All 60+ pts | x1.5 |
| S -> B -> W | All 60+ pts | x1.5 |

---

## RPG System

Earn XP upon task completion and level up.

```
Earned XP = Base XP (score x 10) x Grade multiplier (A:x5 B:x3 C:x1 D:x0.5) x Type multiplier (x1.2)

Grades: A (80-100) B (60-79) C (40-59) D (0-39)

Current Status: Lv.20 "Keyboard Warrior" | Total XP: 12,708
```

---

## Skill Configuration

| Skill | Role | Trigger |
|-------|------|---------|
| `harness-usage` | Execute Case A/B/W + evaluation | "Enrich WPF template", "Design it", "Create HTML" |
| `pencil-design` | Pencil MCP diagrams/blueprints + WPF App migration | "Draw architecture in Pencil", "Migrate XAML" |
| `harness-creator` | Harness structure improvement | "Upgrade the harness" |

---

## Directory Structure

```
pencil-creator/
├── .claude/skills/
│   ├── pencil-design/         <- Pencil MCP design skill
│   ├── harness-usage/         <- Case A/B/W workflow + evaluation
│   └── harness-creator/       <- Harness structure improvement
├── design/
│   ├── wpf-animation.pen      <- WPF animation template (10 CATs, 37 cards)
│   └── xaml/
│       ├── research-history.md <- WPF research history
│       ├── sample/*.xaml       <- 17 XAML samples
│       └── output/sample{N}/   <- HTML output
├── design-wpf-app/
│   ├── design-wpf-app.slnx    <- Open in Blend for Visual Studio
│   ├── migrated/               <- 27 converted UserControls (Blend timeline editable)
│   ├── db/migration-db.json    <- Migration status DB (v2 schema)
│   └── docs/                   <- Core conversion guide
├── projects/
│   ├── design/*.pen            <- Per-project designs (static + animation guide)
│   └── prompt/                 <- Project prompt history
├── harness/
│   ├── knowledge/              <- Evaluation criteria (design-craft.md)
│   ├── agents/                 <- Evaluation agents
│   ├── engine/                 <- RPG rules + state model
│   ├── logs/                   <- Work logs + RPG state
│   └── docs/                   <- Version change history
├── CLAUDE.md                   <- Claude Code project instructions
└── README.md
```

---

## WPF App Migration (for Blend Editing)

A project that converts 27 collected XAML animations into a WPF App editable via **Blend for Visual Studio** timeline.
When implementing animations on other platforms (web, mobile), use the Blend timeline to visually inspect keyframes and easing.

### Usage

```bash
# Open in Blend
design-wpf-app/design-wpf-app.slnx   # <- Open this file in Blend for Visual Studio

# Runtime execution (Gallery Viewer)
cd design-wpf-app && dotnet run

# Request new XAML migration (Claude Code)
> "Migrate XAML to WPF app"
> "Convert design/xaml/sample/28-xxx.xaml to Blend-compatible format"
```

### Blend Timeline Usage

1. Open `migrated/Sample{NN}_*.xaml` files in Blend
2. Select a Storyboard from the **timeline dropdown** (GlassHoverIn, SpinnerRotate, etc.)
3. Select **DemoSequence** to play the full animation flow at once
4. Click keyframes to modify easing, timing, and values

### Project Structure

```
design-wpf-app/
├── design-wpf-app.slnx     <- Open in Blend
├── MainWindow.xaml          <- Left navigation + right content viewer
├── migrated/                <- 27 converted UserControls
├── db/migration-db.json     <- Migration status DB (v2)
└── docs/animation-migration-guide.md  <- Core conversion guide
```

---

## Roadmap

This project will **continuously add sample web pages alongside harness design upgrades**.

- [ ] **Publisher App HTML Implementation** (Case W) — Implement publisher-app.pen design + 12 animation guides as an actual web page
- [ ] **WPF Template Expansion** (Case A) — Add CAT 10+ (Scroll-driven Animation, View Transition, etc.)
- [ ] **New Project Designs** (Case B) — Various app layouts: dashboards, e-commerce, SaaS landing pages, and more
- [ ] **Harness v3.0** — Auto-connect Case B->W pipeline, add accessibility evaluation axis
- [ ] **Design System** — Reusable component library shareable across projects

> All samples follow the **Animation-First Design** principle: look & feel and animation guides are designed first, then implemented.

---

## Getting Started

```bash
# 1. Prerequisites
# Install Claude Code + Pencil

# 2. Open the project
cd pencil-creator
claude

# 3. Start your first task
> "Design a portfolio app in Pencil referencing wpf-animation"  # Case B
> "Research and enrich WPF templates"                            # Case A
> "Create HTML referencing the Pencil design"                    # Case W
> "Migrate XAML to WPF app"                                      # Blend editing
> "What is the harness?"                                         # Usage guide
```

---

## Built with the Harness

Everything you see above is produced on top of the **Pencil Design Harness (v2.6.0)** —
not a plain prompt runner, but a quality framework that closes the loop of **prompt → design → evaluation → level-up**.

- **5 workflow cases** — A (WPF → Template) · B (Template → Project) · C (Web → JSON → Component) · D (DesignMD → Pencil) · W (Pencil → HTML)
- **3-axis × 100-point auto evaluation** — every artifact gets a score/grade (A/B/C/D) logged under `harness/logs/`
- **Pipeline bonuses** — chain cases like A → B → W to earn up to **1.5× XP**
- **RPG level & achievement system** — levels and achievements accumulate with each run, making quality bars visible

The video below walks through the full loop — **from a single prompt to Pencil design, HTML implementation, and automated scoring** — driven entirely by the Harness.

<a href="https://www.youtube.com/watch?v=iFBF_CMX64g">
  <img src="https://img.youtube.com/vi/iFBF_CMX64g/hqdefault.jpg" alt="Built with the Harness" width="420" />
</a>

> ▶ Click the image to watch the **Harness making-of video** on YouTube.

---

## License

MIT

---

> **[Korean / 한국어 README](README-KR.md)**
