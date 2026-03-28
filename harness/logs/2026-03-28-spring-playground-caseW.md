# Case W: 봄 애니메이션 웹 플레이그라운드

- 날짜: 2026-03-28
- Case: W (Pencil → HTML 구현)
- 소스: design/wpf-animation.pen CAT12 (3카드)
- 산출물: design/xaml/output/sample00/ (index.html + style.css + app.js)

## 작업 내용

CAT12 봄 & 자연 파티클 애니메이션 3종을 바닐라 JS + CSS로 구현한 웹 애니메이션 플레이그라운드.

### XAML → Web 매핑

| WPF 속성 | Web 구현 | 적용 섹션 |
|---------|---------|----------|
| TranslateTransform.Y + QuadraticEase | JS rAF + quadratic easing function | 12-1 Fall |
| RotateTransform RepeatBehavior="Forever" | JS continuous rotation per frame | 12-1 Fall |
| OpacityAnimation | JS globalAlpha interpolation | 12-1, 12-2 |
| TranslateTransform X/Y + ScaleTransform | JS rAF composite transform | 12-2 Wind |
| DoubleAnimation AutoReverse Forever | CSS @keyframes alternate infinite | 12-3 Sway |
| SineEase EaseInOut | CSS ease-in-out timing | 12-3 Sway |
| BeginTime stagger | animation-delay + JS spawn timing | All |

### 구현 특징
- 이미지 파일 없음: SVG Blob URL로 꽃잎 생성 (petalImageCache)
- JS/CSS 완전 분리 (index.html + style.css + app.js)
- 각 섹션 컨트롤 패널: 슬라이더로 파라미터 실시간 조절
- 배경 전역 꽃잎 파티클 (bgPetals canvas)
- 잔디 canvas 드로잉 + 바람 줄무늬 시각화
- 반응형 @media 대응

## 3축 평가

| 축 | 항목 | 점수 | 근거 |
|---|------|------|------|
| W1 | 디자인 커버리지 | 32/35 | CAT12 3카드 전부 구현, 모든 WPF 속성 매핑 |
| W2 | 애니메이션 충실도 | 30/35 | QuadraticEase/SineEase/AutoReverse/Scale 충실 매핑, 컨트롤 패널 인터랙션 |
| W3 | 독창적 확장 | 26/30 | bgPetals, 잔디, 바람 줄무늬, 반응형, SVG Blob, 파라미터 조절 |
| **합계** | | **88/100** | **A등급** |

## v2 피드백 반영 (같은 날)

### 수정사항
1. **꽃잎 리얼리티**: SVG radialGradient 꽃잎 (종이조각 → 자연스러운 그라데이션 꽃잎)
2. **Sway 통합**: 꽃/줄기/잎을 하나의 SVG로 통합 (따로놈 해결)
3. **인트로 떨림 수정**: globalFade 1.5초 fade-in + 분산 배치
4. **AI Bloom 섹션 추가**: Seed→Stem→Leaves→Bloom→Celebrate 순차 애니메이션
   - CAT5 ScaleTransform (꽃잎 모핑)
   - CAT6 Path Animation (줄기 stroke-dashoffset)
   - CAT7 Staggered Sequence (꽃잎 순차 등장)
   - CAT10 Glow Pulse (발광 효과)
   - CAT11 Confetti Burst (축하 파티클)
   - CAT12 SineEase Sway (피어난 후 흔들림)

## RPG

- 획득 XP: 5,280 (880 × 5 × 1.2)
- 레벨: 15 → 20 (키보드 워리어)
