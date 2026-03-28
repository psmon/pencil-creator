# Case A: 봄 & 자연 파티클 애니메이션 템플릿 보강

- 날짜: 2026-03-28
- Case: A (WPF 조사 → 템플릿 보강)
- 파일: design/wpf-animation.pen

## 작업 내용

CAT12 — Spring & Nature Particle (봄 & 자연 파티클) 카테고리를 신규 추가.
봄 시즌 테마로 벚꽃 낙하, 꽃잎 흩날림, 봄바람 흔들림 3가지 애니메이션 기법을 조사하고 카드로 시각화.

### 추가된 카드
1. **12-1 CHERRY BLOSSOM FALL** — Canvas + TranslateTransform Y + RotateTransform + OpacityAnimation + QuadraticEase + BeginTime stagger
2. **12-2 PETAL SCATTER WIND** — TranslateTransform X/Y + ScaleTransform 원근 축소 + 바람 효과
3. **12-3 SPRING BREEZE SWAY** — DoubleAnimation AutoReverse Forever + SineEase + TranslateTransform.X 진동

### 생성된 XAML 샘플
- design/xaml/sample/18-cherry-blossom-fall.xaml
- design/xaml/sample/19-petal-scatter-wind.xaml
- design/xaml/sample/20-spring-breeze-sway.xaml

## 3축 평가

| 축 | 항목 | 점수 | 근거 |
|---|------|------|------|
| A1 | 리서치 신규성 | 30/35 | 기존 CAT1-11에 없는 봄/자연 파티클 카테고리 신규 도입, 3개 차별화된 기법 |
| A2 | 시각화 표현력 | 22/35 | 꽃잎 Path 다양한 각도/투명도 배치, 바람 점선 표현. Before→After 명시적 분리 부족 |
| A3 | 기술 메타 완결성 | 28/30 | 3개 독립 실행 XAML + research-history.md 갱신 + 코드 뱃지 |
| **합계** | | **80/100** | **A등급** |

## RPG

- 획득 XP: 4,800 (800 × 5 × 1.2)
- 레벨: 5 → 15 (키보드 워리어)
