---
name: harness-usage
description: |
  Pencil Design Harness를 이용한 디자인 작업을 실행하는 스킬.
  Case A(WPF 조사→템플릿 보강), Case B(템플릿 참고→프로젝트 디자인), Case W(Pencil→HTML) 워크플로우를 실행하고 평가한다.
  다음 상황에서 반드시 이 스킬을 사용할 것:
  - "WPF 애니메이션 조사해서 펜슬에 그려줘" → Case A
  - "wpf-템플릿조사 후 템플릿보강해" → Case A
  - "애니메이션 컴포넌트 추가해줘" → Case A
  - "wpf-animation 이펙트를 참고해 OO 디자인해줘" → Case B
  - "펜슬을 이용해 OO 디자인" + wpf-animation 참고 언급 → Case B
  - "펜슬 참고해서 HTML 페이지 만들어줘" → Case W
  - "디자인을 웹으로 구현해줘" → Case W
  - "디자인 평가해줘", "점수 매겨줘" → 평가 실행
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, WebSearch, WebFetch, mcp__pencil__get_guidelines, mcp__pencil__open_document, mcp__pencil__get_editor_state, mcp__pencil__batch_design, mcp__pencil__get_screenshot, mcp__pencil__find_empty_space_on_canvas, mcp__pencil__snapshot_layout, mcp__pencil__batch_get, mcp__pencil__get_style_guide_tags, mcp__pencil__get_style_guide, mcp__pencil__get_variables, mcp__playwright__browser_navigate, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_evaluate, mcp__playwright__browser_run_code, mcp__playwright__browser_resize
---

# Harness Usage — Pencil Design 작업 실행

`harness/` 3계층 구조를 기반으로 **Case A(WPF→템플릿), Case B(템플릿참고→프로젝트 디자인), Case W(Pencil→HTML) 워크플로우**를 실행한다.

---

## 1. Design Journey 상태 모델

```
idle → prompted → researching → designing → design-evaluating → recording → idle
```

| 상태 | 핵심 행동 |
|------|----------|
| prompted | Case A/B/W 판별, 기존 .pen 파일 상태 확인 |
| researching | WPF 애니메이션 조사 (Case A) 또는 wpf-animation.pen 기법 파악 (Case B) |
| designing | 템플릿 카드 추가 (A) / 정적 디자인+애니메이션 가이드 생성 (B) / HTML 구현 (W) |
| design-evaluating | 3축 채점 (harness/knowledge/design-craft.md 참조) |
| recording | 로그 작성 + RPG(XP/레벨/업적) 처리 |

---

## 2. Case A: WPF 조사 → 템플릿 보강

wpf-animation.pen에 **새로운 WPF 애니메이션 기법 카드를 직접 추가**하는 워크플로우.

```
Phase 1 — Gather (researching):
  → WebSearch로 WPF Storyboard 애니메이션 예제 조사
  → 기존 wpf-animation.pen 카테고리/카드 목록 확인 (중복 제외)
  → 핵심 기술 수집: EventTrigger, DoubleAnimation, Transform, Easing
  → design/xaml/sample/*.xaml 기존 파일 확인

Phase 2 — Action (designing):
  → wpf-animation.pen에 신규 카드 생성
  → 각 카드 구조: 번호+제목 + WPF 속성 설명 + Before→After 시각 미리보기 + XAML 코드 스니펫
  → 다크 테마 (#0A0F1C 배경, #22D3EE cyan 악센트, JetBrains Mono)
  → design/xaml/sample/ 에 .xaml 샘플 파일 저장
  → design/xaml/research-history.md 갱신

Phase 3 — Verify (design-evaluating):
  → design-craft.md Case A 3축 평가
    A1: 리서치 신규성 (35점)
    A2: 시각화 표현력 (35점)
    A3: 메타 완결성 (30점)
  → recording: 로그 + RPG
```

---

## 3. Case B: 템플릿 참고 → 프로젝트 디자인

wpf-animation.pen을 **참고 라이브러리**로 활용하여 프로젝트 요구사항에 맞는 새 .pen 디자인을 생성하는 워크플로우.
**핵심 원칙: 정적 디자인(룩앤필)과 동적 정의(애니메이션 가이드)를 분리한다.**

```
Phase 1 — Gather (researching):
  → 사용자 요구사항 파악 (페이지 구성, 기능, 유효검사, 룩앤필)
  → wpf-animation.pen 카테고리/카드 전체 파악 (어떤 기법을 적용할지 계획)
  → Pencil get_guidelines로 스타일/가이드 로딩 (룩앤필 방향 결정)
  → 프로젝트 .pen 파일 상태 확인

Phase 2a — Action: 정적 디자인 (designing):
  → 프로젝트 .pen 파일에 정적 화면 생성
  → 재사용 컴포넌트 먼저 정의 (사이드바, 버튼 등)
  → 각 화면: 사이드바 인스턴스 + 메인 콘텐츠
  → 스타일 가이드 색상/폰트/라운드니스 일관 적용
  → 화면별 스크린샷 검증

Phase 2b — Action: 애니메이션 가이드 (designing):
  → 동일 .pen 파일 내 별도 섹션으로 생성 (정적 화면 아래)
  → 히어로 프레임: "ANIMATION GUIDE" 타이틀
  → 화면별 카테고리 분리 (CAT-A: Dashboard, CAT-B: Upload 등)
  → 각 카드 구조:
    - 번호 + 제목 (악센트 컬러, Inter, uppercase)
    - Target: {Screen}/{Frame} 적용 위치 명시
    - WPF 동작 설명 (속성, 이징, 듀레이션)
    - Before → After 시각 미리보기 (absolute 배치)
    - XAML 코드 스니펫 (Geist Mono)
  → ⚠️ 룩앤필 매칭 필수: 정적 디자인이 밝은 테마 → 애니메이션 가이드도 밝은 테마
  → wpf-animation.pen의 다양한 카테고리에서 기법 참고 (최소 4개 CAT 이상)

Phase 3 — Verify (design-evaluating):
  → design-craft.md Case B 3축 평가
    B1: 요구사항 충실도 (35점)
    B2: 애니메이션 가이드 풍부성 (35점)
    B3: 디자인 품질 & 분리 기법 (30점)
  → recording: 로그 + RPG
```

### Case B 체크리스트

정적 디자인과 애니메이션 가이드의 **분리 품질**을 보장하기 위한 체크리스트:

```
□ 정적 화면과 애니메이션 가이드가 물리적으로 분리된 프레임인가?
□ 애니메이션 가이드의 각 카드에 Target 프레임이 명시되어 있는가?
□ 룩앤필이 일관되는가? (밝은↔밝은, 어두운↔어두운)
□ wpf-animation.pen에서 4개+ 카테고리의 기법을 참고했는가?
□ 각 카드가 Before→After 시각 미리보기를 포함하는가?
□ XAML 코드 스니펫이 WPF 문법에 맞는가?
□ 재사용 컴포넌트(sidebar 등)가 ref로 활용되는가?
```

---

## 4. Case W: Pencil → HTML 구현

```
Phase 1 — Gather:
  → .pen 파일의 카테고리/컴포넌트 파악
  → 애니메이션 가이드 카드 확인 (Case B 산출물이 있으면 참조)
  → get_screenshot()으로 시각 요소 확인

Phase 2 — Action (designing):
  → .pen 정적 디자인을 HTML/CSS/JS로 변환 (JS/CSS 분리 구현)
  → XAML → Web 매핑 (확장 테이블):
    WPF DoubleAnimation → CSS transition 또는 WAAPI
    QuadraticEase EaseIn → JS quadratic easing (t*t)
    SineEase EaseInOut → CSS ease-in-out 또는 cubic-bezier(0.445,0.05,0.55,0.95)
    ScaleTransform → transform: scale()
    ColorAnimation → CSS color transition
    OpacityAnimation → opacity transition 또는 JS globalAlpha
    TranslateTransform → transform: translateX/Y() 또는 JS rAF
    RotateTransform → transform: rotate() + @keyframes
    ElasticEase → cubic-bezier(0.175, 0.885, 0.32, 1.275)
    Stagger BeginTime → animation-delay 증분 또는 WAAPI Promise chain
    AutoReverse + Forever → CSS alternate infinite
    RepeatBehavior="Forever" → animation: infinite 또는 rAF loop
    Path stroke animation → SVG stroke-dasharray/dashoffset
    DropShadowEffect Glow → filter: drop-shadow() animation
    Confetti Burst → WAAPI particle system
  → SVG 리얼리티 필수 규칙:
    ⚠️ 자연물(꽃잎, 잎 등)은 radialGradient 적용 (flat fill 금지 = 종이조가리)
    ⚠️ 복합 요소(꽃+줄기+잎)는 통합 SVG 1개로 구성 (분리하면 따로 놈)
    ⚠️ Canvas 파티클 초기 등장 시 fade-in 지연 적용 (떨림 방지)
    ⚠️ 외부 이미지(PNG) 대신 SVG Blob URL, Base64, CSS로 자체 생성
  → 순차 시퀀스 애니메이션 (WAAPI 권장):
    Web Animations API의 .animate().finished로 Promise chain 구성
    스테이지별 진행 표시기 UI 제공 (Seed→Grow→Bloom 등)
  → 파라미터 제어 UI: 슬라이더로 speed/count/force 실시간 조절
  → 다중 CAT 활용: wpf-animation.pen의 4개+ 카테고리 기법 통합
  → 저장: design/xaml/output/sample{N}/index.html
  → 최대한 많은 애니메이션 가이드 카드를 실제 구현

Phase 3 — Verify (design-evaluating):
  → design-craft.md Case W 3축 평가
    W1: 디자인 커버리지 (35점)
    W2: 애니메이션 충실도 (35점)
    W3: 독창적 확장 (30점)
  → Playwright 섹션별 캡처 (선택)
  → recording: 로그 + RPG
```

---

## 5. Playwright 섹션별 캡처

HTML 데모의 각 섹션을 스크린샷으로 캡처하는 워크플로우.

```
1. python -m http.server 8765 (HTML 디렉토리에서)
2. browser_resize(1400, 900)
3. browser_navigate("http://localhost:8765/")
4. 각 섹션별:
   browser_evaluate(() => document.getElementById('{id}').scrollIntoView())
   waitForTimeout(1500)
   browser_take_screenshot(filename: "tmp/playwright/sample{N}/{순번}-{섹션}.png")
⚠️ 스크린샷은 tmp/playwright/ 이하에 저장 (git 커밋 대상 아님, 파일 크기 이슈)
```

---

## 6. 로그 & RPG

모든 작업 완료 후 recording 단계에서 실행한다.

```
1. 로그: harness/logs/yyyy-mm-dd-{키워드}-case{A|B|W}.md
2. 인덱스: harness/logs/harness-usage.md에 1줄 추가
3. XP 계산: 기본XP(점수×10) × 등급배율(A:5/B:3/C:1/D:0.5) × 유형배율(A:1.2/B:1.2/W:1.2)
4. 레벨업 판정 + 업적 갱신 (harness/engine/level-achievement-system.md 참조)
```

---

## 7. Pipeline 보너스

| 파이프라인 | 조건 | 보너스 |
|-----------|------|--------|
| A → B | 양쪽 60점+ | 각 XP × 1.2 |
| A → W | 양쪽 60점+ | 각 XP × 1.2 |
| B → W | 양쪽 60점+ | 각 XP × 1.3 |
| A → B → W | 전체 60점+ | 각 XP × 1.5 |