# level-achievement-system.md — MMORPG Level & Achievement System

Automatically executed during the **recording** stage upon completion of all design work (Case A/B/C/W).
The design-evaluator awards XP → checks level-up → updates achievements immediately after 3-axis evaluation.

---

## 1. Trigger

```
design-evaluating stage complete → entering recording stage:
  1. 3-axis evaluation scores finalized
  2. Calculate & award XP
  3. Level-up check
  4. Achievement update
  5. Display results to user in RPG style
```

---

## 2. XP Acquisition Formula

```
Earned XP = Base XP × Grade Multiplier × Case Multiplier × Pipeline Multiplier

Base XP = evaluation score × 10
  e.g.) 85 points → 850 base XP

Grade Multiplier (based on design-craft.md grades):
  A Grade (80~100 pts): ×5  — Unique Monster
  B Grade (60~79 pts):  ×3  — Champion Monster
  C Grade (40~59 pts):  ×1  — Normal Monster
  D Grade (0~39 pts):   ×0.5 — Weak Monster

Case Multiplier:
  Case A (Template):  ×1.2  — Research Exploration Bonus
  Case B (Project):   ×1.2  — Project Design Bonus
  Case C (Copycat):   ×1.2  — Analysis Bonus
  Case W (Web):       ×1.2  — Implementation Bonus

Pipeline Multiplier (see harness.config.json):
  A→B:     ×1.2  (both 60+ pts)
  A→W:     ×1.2  (both 60+ pts)
  B→W:     ×1.3  (both 60+ pts)
  C→W:     ×1.3  (both 60+ pts)
  C→B:     ×1.2  (both 60+ pts)
  A→B→W:   ×1.5  (all 60+ pts)
  C→B→W:   ×1.5  (all 60+ pts)
```

### Calculation Examples

| Scenario | Score | Grade | Case | Pipeline | Base XP | Grade Mult. | Case Mult. | Pipeline | **Final XP** |
|----------|-------|-------|------|----------|---------|-------------|------------|----------|-------------|
| CAT13 new addition | 93 | A | A | None | 930 | ×5 | ×1.2 | ×1.0 | **5,580** |
| blumn.ai analysis | 94 | A | C | None | 940 | ×5 | ×1.2 | ×1.0 | **5,640** |
| AI component HTML | 90 | A | W | C→W | 900 | ×5 | ×1.2 | ×1.3 | **7,020** |
| Cyberpunk HUD | 92 | A | W | A→W | 920 | ×5 | ×1.2 | ×1.2 | **6,624** |
| Publisher app | 73 | B | B | None | 730 | ×3 | ×1.2 | ×1.0 | **2,628** |
| Low score D grade | 30 | D | W | None | 300 | ×0.5 | ×1.2 | ×1.0 | **180** |

---

## 3. Level System (Lv.1 ~ Lv.100)

### 3.1 Required XP Formula

XP required to advance from level L to L+1:

```
Required XP by tier (L → L+1):

Lv. 1~10  (Apprentice Designer):    XP(L) = 100 + 50 × L
Lv. 11~50 (Skilled Designer):       XP(L) = 300 + 100 × (L - 10)
Lv. 51~70 (Expert Designer):        XP(L) = 4,300 + 300 × (L - 50)
Lv. 71~90 (Master Designer):        XP(L) = 10,300 + 800 × (L - 70)
Lv. 91~99 (Legendary Designer):     XP(L) = 26,300 + 3,000 × (L - 90)
```

### 3.2 Key Level Required XP Reference Table

| Level | XP to Next Level | Approx. Cumulative XP | Title |
|-------|-----------------|----------------------|-------|
| 1→2 | 150 | 150 | Adventurer Who Picked Up a Pencil |
| 5→6 | 350 | 1,250 | One Who Knows Layers |
| 10→11 | 600 | 3,150 | Apprentice Designer |
| 25→26 | 1,800 | 18,900 | Frame Warrior |
| 50→51 | 4,300 | 92,850 | Skilled Designer |
| 70→71 | 10,300 | 231,550 | Expert Designer |
| 80→81 | 18,300 | 374,550 | Motion Maestro |
| 90→91 | 26,300 | 558,550 | Master Designer |
| 95→96 | 41,300 | 727,550 | Sage of Pixels |
| 99→100 | 53,300 | 916,750 | Legendary Designer |

### 3.3 Title by Level Tier

| Tier | Title | Description |
|------|-------|-------------|
| 1~5 | Adventurer Who Picked Up a Pencil | First step into the world of design |
| 6~10 | One Who Knows Layers | Starting to get the hang of it |
| 11~25 | Frame Warrior | A warrior steadily producing designs |
| 26~50 | Skilled Designer | The harness becomes second nature |
| 51~70 | Expert Designer | A level where 3-axis evaluation holds no fear |
| 71~80 | Motion Maestro | Any animation, freely mastered |
| 81~90 | Master Designer | One who teaches the harness in reverse |
| 91~95 | Sage of Pixels | Experience melts into every frame |
| 96~99 | Legend Incarnate | Nothing left to prove |
| 100 | Myth of Pencil Creator | Max level. You are the harness |

---

## 4. Achievement System

### 4.1 Achievement Types

#### A. Design Category First Challenge Achievements

Design work is classified into categories, and **achievements are unlocked on first completion** in each category.

| Category | First Challenge Achievement | Parody Source |
|----------|---------------------------|---------------|
| UI Components | "I Place, Therefore I Am" | Descartes "I Think, Therefore I Am" |
| Animation | "Everything That Moves Is Mine" | The Lion King "Everything the Light Touches" |
| Data Visualization | "20,000 Pixels Under the Sea" | Jules Verne "20,000 Leagues Under the Sea" |
| Interaction | "The Alchemist of Clicks" | "Fullmetal Alchemist" |
| Background Effects | "The One Who Shines from Behind" | - |
| HTML Implementation | "Render by the Power of Light!" | Sailor Moon transformation quote |
| Cyber/Digital | "The Neon Signs Never Go Out" | Webtoon parody |
| Nature/Particle | "Gone with the Float" | "Gone with the Wind" |
| Voice/Wave | "I Can Hear the Frequency" | "Jurassic Park" parody |
| Project Design | "Home-cooked Architect" | TV show parody |

#### B. Category Repeat Achievements

Step-by-step achievements unlocked when creating designs repeatedly in the same category:

| Count | Achievement Suffix | Example (Animation category) |
|-------|--------------------|------------------------------|
| 5 | "~ Regular" | "Animation Regular" |
| 15 | "~ Fanatic" | "Animation Fanatic" |
| 30 | "~ Overlord" | "Animation Overlord" |

#### C. Special Achievements (Hidden)

| Condition | Achievement Name | Parody |
|-----------|-----------------|--------|
| First design complete | "The Moment You Picked Up the Pencil" | - |
| First A grade | "You Gave Me an A" | Play on words |
| Perfect 3-axis score (100 pts) | "My Heart Swells with Grandeur" | Internet meme |
| First pipeline bonus | "Combo Initiated!" | Fighting game combo |
| 3 consecutive A grades | "One Who Overcame Temptation" | MMORPG title |
| 5 consecutive A grades | "A Never Stops" | "Justice Never Stops" |
| Experienced all 5 case types | "Jack-of-All-Trades Designer" | MMORPG title |
| First COMBINED SAMPLE created | "Combining Robot" | Super Robot Wars |
| 8 design categories achieved | "Superstar" | MMORPG title |
| A→B→W full pipeline | "Full Combo Achieved!" | Rhythm game |
| Reach level 50 | "The Unbearable Lightness of Design" | Kundera novel parody |
| Reach level 100 | "One Who Became the Myth of Pencil Creator" | - |

---

## 5. Persistence (Storage Structure)

### 5.1 Level State: `harness/logs/level-up/status.json`

```json
{
  "current_level": 1,
  "current_xp": 0,
  "xp_to_next_level": 150,
  "total_xp_earned": 0,
  "title": "Adventurer Who Picked Up a Pencil",
  "total_designs": 0,
  "last_updated": "yyyy-mm-dd"
}
```

### 5.2 Level-Up History: `harness/logs/level-up/history.md`

Add 1 line each time a level-up occurs:

```markdown
| Date | Level | XP Earned | Trigger Design | Title |
```

### 5.3 Achievement State: `harness/logs/achievements/achievements.json`

```json
{
  "categories": {
    "UI Components": { "count": 0, "first_date": null, "milestones": [] },
    "Animation": { "count": 0, "first_date": null, "milestones": [] },
    "Data Visualization": { "count": 0, "first_date": null, "milestones": [] },
    "Interaction": { "count": 0, "first_date": null, "milestones": [] },
    "Background Effects": { "count": 0, "first_date": null, "milestones": [] },
    "HTML Implementation": { "count": 0, "first_date": null, "milestones": [] },
    "Cyber/Digital": { "count": 0, "first_date": null, "milestones": [] },
    "Nature/Particle": { "count": 0, "first_date": null, "milestones": [] },
    "Voice/Wave": { "count": 0, "first_date": null, "milestones": [] },
    "Project Design": { "count": 0, "first_date": null, "milestones": [] }
  },
  "special": [],
  "consecutive_a_grades": 0,
  "last_updated": "yyyy-mm-dd"
}
```

### 5.4 Achievement Log: `harness/logs/achievements/history.md`

Add 1 line each time an achievement is unlocked:

```markdown
| Date | Achievement | Type | Category | Trigger Design |
```

---

## 6. Recording Stage Output Format

After design-evaluating is complete, display to the user in the recording stage:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DESIGN QUEST COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Score: 85/100 (Grade A)
  +5,100 XP earned!

  [Lv.12 Frame Warrior]
  ████████░░░░░░░░ 2,450 / 4,500 XP

  Until next level: 2,050 XP (approx. 1 A-grade design)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NEW ACHIEVEMENT UNLOCKED!
  "Everything That Moves Is Mine"
  — Animation category first challenge!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

When a level-up occurs:

```
  ★ LEVEL UP! ★
  Lv.12 → Lv.13
  Title: "Frame Warrior"
```

When pipeline bonus is triggered:

```
  ⚡ PIPELINE BONUS! ⚡
  C → W Pipeline ×1.3 applied!
```

---

## 7. Design Category Classification Rules

Classify design topics into categories by the following keywords:

| Category | Classification Keywords |
|----------|----------------------|
| UI Components | button, card, form, input, sidebar, nav, modal, table |
| Animation | transition, easing, keyframe, storyboard, motion, fade, scale |
| Data Visualization | chart, graph, dashboard, statistics, data binding |
| Interaction | click, hover, drag, scroll, gesture, interactive |
| Background Effects | particle, gradient, blur, glow, background, overlay |
| HTML Implementation | HTML, CSS, JavaScript, web, responsive, SVG, Canvas, WAAPI |
| Cyber/Digital | glitch, neon, hologram, matrix, scanline, cyberpunk, HUD |
| Nature/Particle | petal, snow, rain, wind, season, nature, particle system |
| Voice/Wave | voice, wave, audio, frequency, spectrum |
| Project Design | app design, screen design, UX flow, wireframe, prototype |
