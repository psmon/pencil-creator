# Case W 평가 로그 — 요르단의 반지 게임 랜딩 페이지

- **날짜**: 2026-03-31
- **Case**: W (Pencil → HTML)
- **산출물**: `design/xaml/output/sample06/` (index.html + style.css + main.js)
- **테마**: 판타지 퍼즐 RPG 게임 랜딩 페이지 "요르단의 반지"

---

## 참조한 WPF 애니메이션 (8개 CAT)

| CAT | 기법 | XAML 참조 | Web 구현 |
|-----|------|----------|---------|
| CAT16 | RPG Fantasy Hero Effects | wpf-animation.pen Arcane Gateway | Canvas particles + CSS 3D ring |
| CAT17 | Pulsing Glow (1.2s SineEase) | 17-pulsing-glow.xaml | CSS ringPulse keyframes (box-shadow 10→30) |
| CAT23 | Neon Glow Pulse (1.5s SineEase) | 23-neon-glow-pulse.xaml | CSS neonGlowTitle (text-shadow animation) |
| CAT27 | Holographic Shimmer (3s sweep) | 27-holographic-shimmer.xaml | CSS shimmerSweep (::before gradient) |
| CAT33 | Starfield Depth (3-layer 6/12/20s) | 33-starfield-depth-system.xaml | Canvas Starfield class (3계층 속도) |
| CAT36 | Galaxy Swirl (360° 6/12/20s) | 36-galaxy-swirl-motion.xaml | Canvas Ring3D class (3D 회전) |
| CAT38 | Hologram Float (translateY 3s) | 38-hologram-floating-panel.xaml | CSS hologramFloat + WAAPI cascade |
| CAT16p | Particle Floating Dots (5-8s stagger) | 16-particle-floating-dots.xaml | Canvas MagicParticles class |

## 페이지 구성 (6 섹션)

1. **Hero** — 3D CSS 링 + 네온 글로우 타이틀 + CTA 버튼
2. **Heroes** — 히어로 카드 3장 (Legendary/Epic/Rare) + 홀로그래픽 시머 + float
3. **Puzzle** — 인터랙티브 4x4 룬 매칭 메모리 게임 (실제 플레이 가능)
4. **Ring** — Canvas 3D 반지 (3개 틸트 링 + 12 룬 궤도 + 마우스 드래그 + 슬라이더)
5. **Crowdfunding** — 금액 카운터 애니메이션 + 프로그레스 바 + 3티어 펀딩
6. **Footer** — "펜슬 AI하네스로 제작되었습니다 (실제 출시 제품이 아닙니다)"

## 3축 평가

| 축 | 점수 | 근거 |
|---|------|------|
| W1 디자인 커버리지 | 33/35 | 8개 CAT 기법 적용, 전 섹션 WPF 매핑 완료 |
| W2 애니메이션 충실도 | 33/35 | .pen+.xaml 이중참조, WAAPI+Canvas+CSS 3중조합, 정밀 easing 매핑 |
| W3 독창적 확장 | 28/30 | 인터랙티브 퍼즐게임, 3D Canvas 반지, 파라미터 UI, 반응형, 외부이미지 無 |
| **합계** | **94/100** | **A등급** |

## XP & 레벨

- 획득XP: 940 × 5 × 1.2 × 1.0 = **5,640 XP**
- 레벨: Lv.43 → **Lv.45** (2레벨 업!)
- 잔여XP: 936 / 3,800
- 누적XP: 73,092
