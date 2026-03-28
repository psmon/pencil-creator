# Pencil Creator

**Pencil MCP + Harness 시스템으로 디자인 스킬을 자가 성장시키는 Claude Code 프로젝트**

WPF 애니메이션 패턴을 조사하고, Pencil 디자인 도구에 시각화하고, HTML로 구현하는 전체 파이프라인을 평가 루프로 반복하여 디자인 역량을 쌓아가는 시스템입니다.

---

## Pencil Design 스킬

### Pencil이란?

[Pencil](https://www.pencil.dev/)은 `.pen` 파일 형식의 디자인 도구로, **MCP(Model Context Protocol)**를 통해 AI와 직접 협업할 수 있습니다. AI가 `batch_design` 명령으로 프레임, 텍스트, 도형을 배치하고, `get_screenshot`으로 결과를 시각적으로 검증합니다.

### 작동 메커니즘

```
1. get_editor_state() → .pen 파일 구조 파악
2. get_guidelines() / get_style_guide() → 디자인 가이드 참조
3. batch_design() → 프레임/텍스트/도형 생성 (max 25 ops/call)
4. get_screenshot() → 시각적 검증
5. 반복 → 완성
```

핵심 특징:
- **다크 테마 카드 패턴**: 각 애니메이션을 "상태 전환 카드"로 표현 (제목 + 설명 + Before→After 미리보기 + 코드 스니펫)
- **멀티 에이전트**: 최대 3개 에이전트가 서로 다른 프레임에 동시 작업
- **WPF 매핑**: WPF의 Storyboard/Transform/Easing을 정적 디자인으로 번역하는 6가지 시각화 기법

---

## Harness — 디자인 경험 레벨업

### 컨셉

Harness(하네스)는 디자인 작업의 **품질을 측정하고 개선 방향을 알려주는 평가 시스템**입니다. 마치 게임의 퀘스트 시스템처럼, 디자인 작업을 완료하면 점수를 받고, 경험치를 획득하고, 레벨이 올라갑니다.

```
조사 → 디자인 → 평가 → 개선 → 다시 조사
  ↑                              |
  └────── 자가 성장 루프 ─────────┘
```

### 두 가지 워크플로우

#### Case P: WPF → Pencil (디자인 조사 → 시각화)

WPF 애니메이션 패턴을 조사하여 Pencil 디자인 카드로 시각화합니다.

```bash
# 사용 예시
> "WPF Flip Card 3D 애니메이션을 조사해서 펜슬에 그려줘"
> "WPF Elastic/Spring 효과를 조사해서 디자인 카드 추가해줘"
> "기존 .pen 파일에 새 카테고리 3개 추가해줘"
```

**3축 평가:**
| 축 | 만점 | 핵심 |
|---|---|---|
| P1 리서치 신규성 | 35 | 기존 중복 없이 새 기법 추가했나 |
| P2 시각화 표현력 | 35 | Before→After 전환이 직관적인가 |
| P3 메타 완결성 | 30 | XAML 코드와 출처가 정확한가 |

#### Case W: Pencil → HTML (디자인 → 구현)

Pencil 디자인 파일을 참조하여 실제 웹 페이지를 만듭니다.

```bash
# 사용 예시
> "펜슬의 디자인 요소를 참고해서 개인 홈페이지 만들어줘"
> ".pen 파일의 애니메이션을 최대한 적용한 랜딩페이지 작성해줘"
```

**3축 평가:**
| 축 | 만점 | 핵심 |
|---|---|---|
| W1 디자인 커버리지 | 35 | .pen 요소를 얼마나 반영했나 |
| W2 애니메이션 충실도 | 35 | 정적 디자인을 동적으로 변환했나 |
| W3 독창적 확장 | 30 | 디자인에 없는 인터랙션 추가했나 |

### RPG 시스템

작업 완료 시 XP를 획득하고 레벨이 올라갑니다:

```
획득XP = 기본XP(점수×10) × 등급배율(A:×5, B:×3, C:×1) × 유형배율(×1.2)

등급: A(80-100) B(60-79) C(40-59) D(0-39)

Pipeline 보너스: Case P + Case W 연속 실행 시 양쪽 ≥60점이면 XP 1.3배
```

---

## 스킬 구성

### pencil-design (디자인 실행)
Pencil MCP를 직접 사용하여 .pen 파일에 디자인을 생성합니다.

```bash
# 트리거 예시
> "펜슬로 아키텍처 그려줘"
> "WPF 애니메이션 조사해서 펜슬에 그려줘"
```

### harness-usage (워크플로우 + 평가)
Case P/W 워크플로우를 실행하고 3축 평가 + RPG 처리를 합니다.

```bash
# 트리거 예시
> "WPF 애니메이션 조사해서 펜슬에 그려줘" (Case P 전체 실행)
> "펜슬 참고해서 HTML 만들어줘" (Case W 전체 실행)
> "디자인 평가해줘" (평가만 실행)
```

### harness-creator (하네스 개선 + 사용법)
하네스 구조를 업그레이드하거나 사용법을 안내합니다.

```bash
# 트리거 예시
> "하네스 업그레이드해줘"
> "하네스가 뭐야? 이용법 알려줘"
> "평가 기준 개선 필요"
```

---

## 설치 및 시작

### 1. 사전 준비

- [Claude Code](https://claude.ai/claude-code) 설치
- [Pencil](https://www.pencil.dev/) 설치 (MCP 연동 필요)

### 2. skill-creator 플러그인 설치 (권장)

스킬을 생성하거나 개선할 때 유용한 공식 플러그인입니다:

```bash
claude plugin install skill-creator@claude-plugins-official
```

### 3. 프로젝트 열기

```bash
cd pencil-creator
claude
```

### 4. 시작하기

```bash
# 첫 디자인 만들기 (Case P)
> "WPF 버튼 hover 애니메이션을 조사해서 펜슬에 그려줘"

# 하네스 사용법 확인
> "하네스가 뭐야?"

# HTML로 구현 (Case W)
> "펜슬 디자인 참고해서 개인 홈페이지 만들어줘"
```

### 5. 홈페이지 생성 예시 (Case W 실전)

Pencil 디자인 파일의 애니메이션을 풍부하게 활용하여 웹 페이지를 생성하는 예시입니다.
`wpf-animation.pen`을 지정하지 않아도 프로젝트의 .pen 파일을 자동으로 참조합니다.

```bash
# 기본 — .pen 자동 참조
> "펜슬 디자인을 이용해 project1/ 경로에 여행 블로그 홈페이지를
   애니메이션 풍부하게 활용해 작성해줘"

# .pen 파일 명시 지정
> "design/wpf-animation.pen을 참고해서 project1/ 경로에
   포트폴리오 홈페이지를 만들어줘. 애니메이션 최대한 적용할 것"

# 테마 + 애니메이션 수 지정
> "펜슬 디자인 이용해 project1/에 카페 소개 페이지 작성해줘.
   다크테마, 애니메이션 20개 이상 적용"
```

**결과물 예시** (실제 이 프로젝트에서 생성한 샘플):

| 샘플 | 경로 | 적용 이펙트 | 테마 |
|------|------|-----------|------|
| AICC 랜딩 | `design/xaml/output/sample1/` | 13개 | 기업 서비스 소개 |
| 노리 홈페이지 | `design/xaml/output/sample2/` | 22개 | 개인 여행 에필로그 |

브라우저에서 `index.html`을 열면 Gradient BG, 파티클, 3D 플립 카드, 원형 차트, 타임라인 슬라이드, 컨페티 등 실제 동작하는 애니메이션을 확인할 수 있습니다.

---

## WPF 조사 자료

기존 조사 이력이 포함되어 있어, 새 사용자도 처음부터 조사할 필요 없이 바로 활용할 수 있습니다.

| 자료 | 경로 | 내용 |
|------|------|------|
| 조사 이력 | `design/xaml/research-history.md` | 17개 컴포넌트의 출처 URL, 핵심 기술, XAML 속성 |
| XAML 샘플 | `design/xaml/sample/*.xaml` | 독립 실행 가능한 WPF Window 17개 |
| .pen 파일 | `design/wpf-animation.pen` | 11개 카테고리, 37개 애니메이션 카드 |

```bash
# 기존 자료 기반으로 추가 조사
> "기존 .pen에 없는 WPF 애니메이션 10개를 더 조사해서 추가해줘"

# 특정 XAML 참조하여 디자인
> "design/xaml/sample/01-glass-effect-button.xaml을 참고해서
   펜슬에 Glass Button 변형 3종을 그려줘"
```

---

## 디렉토리 구조

```
pencil-creator/
├── .claude/skills/
│   ├── pencil-design/SKILL.md     ← Pencil MCP 디자인 스킬
│   ├── harness-usage/SKILL.md     ← Case P/W 워크플로우
│   └── harness-creator/SKILL.md   ← 하네스 개선 + 사용법
├── harness/
│   ├── knowledge/design-craft.md  ← 디자인 평가 기준 (Case P/W 3축)
│   ├── agents/design-evaluator.md ← 평가 에이전트
│   ├── engine/
│   │   ├── design-journey.md      ← 상태 전이 모델
│   │   └── level-achievement-system.md ← RPG 규칙
│   ├── logs/                      ← 작업 로그 + RPG 상태
│   └── docs/                      ← 버전 변경 이력
├── design/
│   ├── wpf-animation.pen          ← 샘플 .pen 파일 (37개 컴포넌트)
│   └── xaml/
│       ├── research-history.md    ← WPF 조사 이력 (17개 출처/기법)
│       ├── sample/*.xaml          ← WPF XAML 샘플 17개
│       └── output/sample{N}/     ← HTML 산출물 (sample1, sample2)
├── CLAUDE.md                      ← Claude Code 프로젝트 지침
└── README.md                      ← 이 파일
```

---

## 라이선스

MIT
