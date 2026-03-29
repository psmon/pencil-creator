# Case W: Four Seasons WPF Animation Showcase

- 날짜: 2026-03-29
- Case: W (Pencil → HTML 구현)
- 소스: design/wpf-animation.pen 전체 12개 CAT (36카드)
- 산출물: design/xaml/output/sample01/ (index.html + style.css + app.js)

## 작업 내용

12개 CAT, 36가지 WPF 애니메이션 기법을 사계절 테마로 구현한 종합 플레이그라운드.

### 시즌별 구성

| 시즌 | CAT | 데모 (9개/시즌) |
|------|-----|----------------|
| Spring | 12+4+10 | Cherry Blossom Fall, Petal Scatter, Breeze Sway, Gradient BG, Floating Particles, Pulsing Glow, Wave Ripple, Breathing Pulse, Marching Ants |
| Summer | 1+2+8 | Floating Label, ComboBox, Toggle, Snackbar Toast, Progress Bar, Badge Pop, Ripple Button, Accordion, Tooltip |
| Autumn | 3+6+9 | Page Transition, Tab Slide, Hamburger Morph, Path Follower, Parallax, Drag&Drop, Skeleton Shimmer, Circular Progress, Bar Chart |
| Winter | 5+7+11 | Flip Card 3D, Morphing Shape, Elastic Spring, Typewriter, Marquee, Staggered List, Confetti Burst, Zoom/Pinch, Glass Button |

### 기술 매핑

| WPF 기법 | Web 구현 |
|---------|---------|
| QuadraticEase EaseIn | JS t*t quadratic, IntersectionObserver 트리거 |
| SineEase EaseInOut | CSS ease-in-out, alternate infinite |
| ElasticEase | cubic-bezier(0.175, 0.885, 0.32, 1.275) |
| CubicEase | cubic-bezier(0.4, 0, 0.2, 1) |
| AutoReverse+Forever | CSS alternate infinite |
| BeginTime stagger | animation-delay, setTimeout 증분 |
| Canvas particle | JS rAF + SVG Blob URL |
| RotateTransform3D | CSS perspective + rotateY |
| PathGeometry morph | SVG path d 전환 |
| stroke-dashoffset | SVG 원형 진행 |

### .pen + .xaml 이중 참조
- .pen: 12개 CAT 구조, 36개 카드 시각 체계 파악 (batch_get)
- .xaml: 20개 파일의 정밀 파라미터 수집 (Duration, Easing, From/To, BeginTime)

## 3축 평가

| 축 | 항목 | 점수 | 근거 |
|---|------|------|------|
| W1 | 디자인 커버리지 | 35/35 | 12개 CAT 전체, 36개 기법 모두 개별 데모 카드 |
| W2 | 애니메이션 충실도 | 32/35 | 이중참조 정밀 매핑, Canvas rAF+CSS+WAAPI+IO 다양 기법 |
| W3 | 독창적 확장 | 27/30 | 사계절 테마+반응형+IO 트리거+외부이미지 없음 |
| **합계** | | **94/100** | **A등급** |

## RPG

- 획득 XP: 5,640 (940 × 5 × 1.2)
- 레벨: 20 → 24 (키보드 워리어)
