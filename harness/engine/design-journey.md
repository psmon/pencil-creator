# design-journey.md — Pencil Design Journey 상태 모델

Pencil Design 작업의 전체 상태 전이 모델을 정의한다.

---

## 상태 다이어그램

```
idle
  ↓ (요청 수신)
prompted
  ↓ (유형 판별: Case A/B/C/W)
researching     ← WPF 조사 (A) / 템플릿 파악 (B) / 웹 애니메이션 분석 (C)
  ↓
designing       ← 카드 추가 (A) / 프로젝트 디자인 (B) / JSON→펜슬 (C) / HTML 생성 (W)
  ↓
design-evaluating  ← design-evaluator 3축 평가
  ↓
recording       ← 로그 작성 + RPG 처리
  ↓
idle
```

---

## 작업 유형별 경로

### Case A: WPF 조사 → 템플릿 보강
```
idle → prompted → researching(WPF) → designing(.pen 카드 추가) → design-evaluating(Case A) → recording → idle
```

### Case B: 템플릿 참고 → 프로젝트 디자인
```
idle → prompted → researching(wpf-animation.pen) → designing(정적+애니메이션 가이드) → design-evaluating(Case B) → recording → idle
```

### Case C: 웹 애니메이션 → JSON → 펜슬 컴포넌트 (Copycat)
```
idle → prompted → researching(WebFetch+Playwright 분석) → designing(JSON 정의서+펜슬 컴포넌트) → design-evaluating(Case C) → recording → idle
```

### Case W: Pencil → HTML/웹 구현
```
idle → prompted → designing(HTML, .pen/.json 참조) → design-evaluating(Case W) → recording → idle
```

### Pipeline A→B→W: WPF 완전 루프
```
idle → prompted → researching(WPF) → designing(.pen) → design-evaluating(Case A)
  → designing(프로젝트) → design-evaluating(Case B)
  → designing(HTML) → design-evaluating(Case W, 파이프라인 보너스)
  → recording → idle
```

### Pipeline C→B→W: 카피캣 완전 루프
```
idle → prompted → researching(웹 분석) → designing(JSON+펜슬) → design-evaluating(Case C)
  → designing(프로젝트) → design-evaluating(Case B)
  → designing(HTML) → design-evaluating(Case W, 파이프라인 보너스)
  → recording → idle
```

### Pipeline C→W: 카피캣 직통
```
idle → prompted → researching(웹 분석) → designing(JSON+펜슬) → design-evaluating(Case C)
  → designing(HTML) → design-evaluating(Case W, 파이프라인 보너스)
  → recording → idle
```

---

## 상태별 담당

| 상태 | 담당 | 핵심 행동 |
|------|------|----------|
| prompted | - | Case A/B/C/W 판별, 기존 파일 상태 확인 |
| researching | pencil-design | WPF 조사 (A) / 템플릿 파악 (B) / 웹 애니메이션 분석 (C) |
| designing | pencil-design | 카드 추가 (A) / 프로젝트 디자인 (B) / JSON→펜슬 (C) / HTML (W) |
| design-evaluating | design-evaluator | 3축 채점 + 매핑 테이블 |
| recording | design-evaluator | 로그 + XP + 업적 |
