# design-journey.md — Pencil Design Journey 상태 모델

Pencil Design 작업의 전체 상태 전이 모델을 정의한다.

---

## 상태 다이어그램

```
idle
  ↓ (요청 수신)
prompted
  ↓ (유형 판별: Case P 또는 W)
researching     ← WPF/외부 자료 조사 (Case P만)
  ↓
designing       ← pencil-design 스킬로 .pen 파일 작업 또는 HTML 생성
  ↓
design-evaluating  ← design-evaluator 3축 평가
  ↓
recording       ← 로그 작성 + RPG 처리
  ↓
idle
```

---

## 작업 유형별 경로

### Case P: WPF 조사 → Pencil 디자인
```
idle → prompted → researching(WPF) → designing(.pen) → design-evaluating(Case P) → recording → idle
```

### Case W: Pencil → HTML/웹 구현
```
idle → prompted → designing(HTML, .pen 참조) → design-evaluating(Case W) → recording → idle
```

### Pipeline P→W: 연속 실행
```
idle → prompted → researching(WPF) → designing(.pen) → design-evaluating(Case P)
  → designing(HTML) → design-evaluating(Case W, 파이프라인 보너스)
  → recording → idle
```

---

## 상태별 담당

| 상태 | 담당 | 핵심 행동 |
|------|------|----------|
| prompted | - | Case P/W 판별, 기존 .pen 파일 상태 확인 |
| researching | pencil-design | WebSearch로 WPF 애니메이션 조사 |
| designing | pencil-design | .pen 파일에 카드 생성 또는 HTML 구현 |
| design-evaluating | design-evaluator | 3축 채점 + 매핑 테이블 |
| recording | design-evaluator | 로그 + XP + 업적 |
