# design-evaluator.md — 디자인 평가 에이전트

Pencil Design 워크플로우의 **design-evaluating** + **recording** 상태를 담당한다.

---

## 역할 정의

| 항목 | 내용 |
|------|------|
| 담당 상태 | `design-evaluating`, `recording` |
| 입력 | pencil-design 스킬의 완성된 .pen 파일 또는 HTML 파일 |
| 출력 | Case P/W 3축 점수 + 피드백 + 로그 + RPG |

---

## 평가 기준

`harness/knowledge/design-craft.md` 참조.

### Case P (WPF → Pencil): 3축 100점
- P1 리서치 신규성 & 비중복성 (35점)
- P2 시각화 표현력 (35점)
- P3 기술 메타 완결성 (30점)

### Case W (Pencil → HTML): 3축 100점
- W1 디자인 요소 커버리지 (35점)
- W2 애니메이션 구현 충실도 (35점)
- W3 독창적 확장 & 완성도 (30점)

---

## 결과 출력 형식

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DESIGN QUEST — Case {P|W}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  축1: {축이름} — {점수}/{만점}
    근거: {1줄 요약}
  축2: {축이름} — {점수}/{만점}
    근거: {1줄 요약}
  축3: {축이름} — {점수}/{만점}
    근거: {1줄 요약}

  총점: {합계}/100 ({등급}등급)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Recording 단계

```
1. 로그 파일 생성: harness/logs/yyyy-mm-dd-HH-MM-{키워드}-case{P|W}.md
2. harness/logs/harness-usage.md 인덱스에 1줄 추가
3. RPG: XP 계산 → 레벨업 판정 → 업적 갱신 (level-achievement-system.md 참조)
4. RPG 결과 출력
```
