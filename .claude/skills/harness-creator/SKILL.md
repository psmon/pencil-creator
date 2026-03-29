---
name: harness-creator
description: |
  Pencil Design Harness의 구조를 개선하고 업그레이드하는 스킬.
  다음 상황에서 반드시 이 스킬을 사용할 것:
  - "하네스 업그레이드해줘", "스킬 개선 필요", "harness-creator", "하네스 개선"
  - 디자인 평가 점수가 낮을 때 개선 방향 안내
  - 새 평가 축 추가 또는 워크플로우 변경이 필요한 경우
  - "하네스가 뭐야?", "하네스 이용법 알려줘" 등 하네스 사용법 질문 시
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, WebSearch
---

# Harness Creator — Pencil Design Harness 업그레이드

`harness/` 3계층 구조를 분석하고 지속적으로 개선한다.

---

## 1. 하네스 3계층 구조

```
harness/
├── knowledge/      ← Layer 1: 디자인 평가 기준 (design-craft.md)
├── agents/         ← Layer 2: 평가 에이전트 (design-evaluator.md)
└── engine/         ← Layer 3: 워크플로우 (design-journey.md, level-achievement-system.md)
```

---

## 2. 업그레이드 Agentic Loop

### Gather Context
```
1. harness/logs/*.md 에서 관찰사항 수집
2. harness.config.json 현재 버전 확인
3. 변경 대상 계층 식별 (knowledge → agents → engine 순서)
```

### Take Action
```
1. 상위 계층부터 순서대로 변경
2. harness.config.json 버전 범프
3. harness/docs/vX.Y.Z.md 변경 문서 작성
```

### Verify
```
1. 계층 간 참조 정합성 확인
2. 스킬의 upgrade_history 기록 확인
```

---

## 3. 버전 관리

| 변경 유형 | 버전 범프 | 예시 |
|-----------|-----------|------|
| 패치 (0.0.x) | 문서 수정, 예시 추가 | design-craft.md 기준 조정 |
| 마이너 (0.x.0) | 새 평가 축, 워크플로우 변경 | Case W에 접근성 축 추가 |
| 메이저 (x.0.0) | 전체 구조 재설계 | 3축 → 5축 변경 |

---

## 4. 하네스 사용법 안내

사용자가 하네스에 대해 질문하면 다음을 안내한다:

```
하네스(Harness)는 Pencil 디자인 작업의 품질을 측정하고 개선하는 시스템입니다.

주요 기능:
  1. Case A 평가: WPF 애니메이션을 조사해서 wpf-animation.pen 템플릿 보강 품질 측정
  2. Case B 평가: 템플릿을 참고해서 프로젝트 디자인(정적+애니메이션 가이드) 품질 측정
  3. Case C 평가: 웹사이트 애니메이션 분석 → JSON 기법 정의서 → 펜슬 컴포넌트 품질 측정
  4. Case W 평가: Pencil 디자인을 HTML로 구현할 때 품질 측정
  5. RPG 시스템: 작업마다 XP를 획득하고 레벨업하는 게이미피케이션
  6. 자가 개선: 평가 관찰사항을 축적하여 스킬을 업그레이드

사용법:
  - "WPF 애니메이션 조사해서 펜슬에 그려줘" → Case A 워크플로우 시작
  - "wpf-animation 참고해 OO 디자인해줘" → Case B 워크플로우 시작
  - "OO사이트 애니메이션 조사해서 템플릿 강화" → Case C 워크플로우 시작
  - "펜슬 참고해서 HTML 만들어줘" → Case W 워크플로우 시작
  - "하네스 업그레이드해줘" → 이 스킬(harness-creator) 실행
```