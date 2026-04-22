# Case W 평가 로그 — 블룸 AI 디자인 시스템 소개 랜딩

- **날짜**: 2026-04-16
- **Case**: W (Pencil → HTML / 변형: 프로젝트 저장소 참조)
- **산출물**: `design/xaml/output/sample07/` (index.html + css/ + js/)
- **테마**: 블룸 AI 디자인 시스템 + 평가 하네스 소개 마케팅 랜딩 페이지

---

## 참조 소스

| 참조 | 유형 | 활용 내용 |
|------|------|---------|
| `D:\code\ai-studio\blumnai-design-system` | 프로젝트 | 40+ 컴포넌트, 4 테마, 3,800+ 아이콘, WCAG 2.1 AA, v1.4.10, 하네스 v1.1.0, 6 agents, 3 workflows, 기술스택 (React 18/19, TS, Tailwind 4, Radix, shadcn/ui) |
| sample04 (Peace) | globe.js | Three.js r128 Scene/Camera/Renderer 초기화 패턴, lat/lon→Vec3, QuadraticBezierCurve3 arc glow, drag + autoRotate |
| sample06 (Ring) | main.js/style.css | neon-breathe text-shadow, float translate, 3계층 parallax |
| sample01 (Four Seasons) | - | stagger cascade, ripple burst, shimmer sweep, count-up counter |
| sample03 (Cyber HUD) | - | terminal 내러티브 출력, grid overlay, dot-live indicator |

## 페이지 구성 (4 섹션)

1. **Hero** — 3D Design System Orbit (Three.js) + 네온 타이틀 cascade + stats counter
   - 중앙 Icosahedron core (pink/purple, wireframe overlay, halo backside)
   - 12개 Octahedron 노드 (12 core 컴포넌트 매핑)
   - 12 arc (QuadraticBezierCurve3) + glow segment slide
   - 180 particle cloud (radial spherical distribution, additive blending)
   - Drag rotate + auto resume after 2s idle
2. **Design System** — 6 pillar 카드 + 4-tab 컴포넌트 갤러리 + 타이핑 코드 윈도우
   - Pillar cards: 토큰 중심 / Radix 접근성 / 설계 단일화 / 서브패스 임포트 / 엔터프라이즈 / 점진 마이그레이션
   - Gallery tabs: 폼입력 / 데이터표시 / 네비게이션 / 피드백 (40+ 컴포넌트 분류)
   - Code window: syntax-highlighted npm install → import → JSX (IntersectionObserver 트리거 타이핑)
3. **Harness** — 3축 평가 카드 + 6 agents 그리드 + 3 workflows + 실행 터미널
   - Axis cards: Design Fidelity(A~D 게이지) / API Ergonomics(5단 막대) / Accessibility(SVG 링 80%)
   - Agents: 조련사, a11y-auditor, token-inspector, figma-drift-detector, type-api-reviewer, ds-release-curator
   - Workflows: component-full-audit / component-targeted-review / release-gate
   - Terminal: `harness run component-full-audit Button` 순차 실행 재생
4. **Closing** — AI 시대 사내 맞춤형 메시지 + Pure-CSS 6겹 카운터 회전 orbit
   - Central orb (pulse + glow shadow alternate)
   - 6 ring (normal/reverse 회전 18~36s)
   - Orb chips counter-rotate (텍스트 수직 유지)

## WPF 애니메이션 → Web 매핑 (20+ 기법)

| WPF 기법 | Web 구현 | 위치 |
|---------|---------|------|
| DoubleAnimation (Scale) | @keyframes ring-pulse | hero-bg 3겹 링 |
| DoubleAnimation (Opacity) | @keyframes dot-pulse | live dot, eyebrow-dot |
| ColorAnimation + LinearGradient | @keyframes hue-shift + background-position | neon title, gradient text |
| DropShadowEffect (Glow) | @keyframes neon-breathe (text-shadow) | hero title |
| DropShadowEffect (drop-shadow) | @keyframes brand-glow (filter) | brand mark |
| Stagger BeginTime | setTimeout + data-cascade-delay | hero elements, reveal |
| Radial EllipseGeometry Burst | .ripple absolute + expanding keyframes | ripple-btn WAAPI-style |
| LinearGradientBrush offset sweep | @keyframes shimmer (background-position) | mp-fill progress |
| DoubleAnimation on Text (count) | requestAnimationFrame + cubic-out easing | stat-num data-count |
| RepeatBehavior=Forever + AutoReverse | `animation: ... infinite alternate` | pulse-ring, orb-pulse |
| RotateTransform (CW/CCW) | @keyframes orb-rotate + reverse | closing 6 ring |
| Counter-rotate preservation | @keyframes chip-counter-rotate | orb-chip text upright |
| QuadraticBezierCurve3 path | THREE.QuadraticBezierCurve3 + getPoints | hero orbit arcs |
| Particle system | THREE.Points + additive blending | hero backdrop cloud |
| Storyboard.Begin + progress indicator | 고정 position:fixed scroll-progress 바 | top progress bar |
| ScrollViewer 연동 전환 | IntersectionObserver + `.in` class | reveal, cascade, axis-fill |
| TextBlock cursor blink | @keyframes caret-blink (step-end) | code caret, terminal caret |
| Parallax-like translateY | scroll handler translate(y×0.3) + opacity | hero-bg parallax |
| ScaleTransform loop + shadow | @keyframes seg-glow, bar-glow | axis gauge active states |

## 3축 평가

| 축 | 점수 | 근거 |
|---|------|------|
| W1 디자인 커버리지 | 32/35 | 참조 소스 5곳에서 다중 기법 통합. .pen 직접 참조가 아닌 프로젝트 저장소 참조로 변형된 Case W. Hero 3D + 6 pillar + 3축 + 3 workflow + 터미널 + 닫는 orbit까지 전 구역 매핑. |
| W2 애니메이션 충실도 | 33/35 | 20+ 기법, WPF→Web 매핑 명확, Three.js+WAAPI+Canvas+CSS 4중조합, radialGradient SVG defs, prefers-reduced-motion 준수, 외부 이미지 無 (SVG/CSS/Canvas 자체 생성). 파라미터 제어 슬라이더 無 (-2). |
| W3 독창적 확장 | 28/30 | **상단 Scroll Progress Bar + 글로우 헤드(신규)**, 우측 커스텀 그라디언트 스크롤바, Hero 스크롤 패럴랙스, 3-breakpoint 반응형(960/768/560), word-break:keep-all 한글 처리, Terminal 내러티브 재생, Typed code IntersectionObserver, 3D orbit drag+autoResume, ContentCategory별 독창 시각화(gauge/bars/ring). |
| **합계** | **93/100** | **A등급** |

## 반응형 & 스크롤 개선 (사용자 피드백 대응)

1. **Scrollbar 위치 수정**: `body { overflow-x: hidden }` → `overflow-x: clip`으로 변경. html-level 스크롤바가 뷰포트 우측 끝에 고정.
2. **Custom Scrollbar**:
   - WebKit: thumb에 브랜드 그라디언트, hover 글로우, active 색상 반전
   - Firefox: scrollbar-color 토큰
3. **Scroll Progress Bar** (신규): `position: fixed; top: 0` 3px 바 + 끝단 펄싱 글로우 헤드 (1.4s breathe). 스크롤 진행률 기반 width + hue-rotate.
4. **Hero Parallax**: rAF 쓰로틀 scroll handler로 hero-bg translateY(0.3×) + opacity fade.
5. **반응형**: ≤960/768/560 3단계. Hero 1컬럼 stack, nav links 숨김, gallery tabs 가로 스크롤, closing orbit 축소.
6. **한글 래핑**: `word-break: keep-all` 적용 — "블룸 AI 디자인 시스템을 / 소개합니다" 안정 2줄.

## Playwright 검증

| 해상도 | 확인 |
|--------|------|
| 1400×900 Hero | 3D orbit 정상, 타이틀 2줄, stats counter up, cascade 동작 |
| 1400×900 Mid-scroll (28%) | 상단 progress bar 핑크 헤드 가시, custom scrollbar 우측 끝 |
| 1400×900 Harness | 3 axis 카드 그리드, 6 agents, 3 workflows, terminal 실행 완료 |
| 390×844 Mobile Hero | 1컬럼 stack, orbit 280px, CTA 풀폭, 타이틀 유지 |
| 390×844 Mobile Harness | 세로 카드 스택, progress bar 가시, 스크롤바 노출 |

## XP & 레벨

- 기본XP: 93 × 10 = 930
- 등급배율: A등급 → ×5
- 케이스배율: Case W → ×1.2
- 파이프라인: 없음 (단독 W)
- 획득XP: 930 × 5 × 1.2 × 1.0 = **5,580 XP**

- 레벨: Lv.45 → **Lv.46** (1레벨 업!)
- 칭호: 숙련 디자이너 유지
- 잔여XP: 936 + 5,580 = 6,516 → 3,800 차감 → **2,716 / 3,900**
- 누적XP: 73,092 + 5,580 = **78,672**

## 업적

- **신규**: "HTML구현의 단골손님" (HTML구현 카테고리 5회 달성)
- 연속 A등급: 7 → 8 (이미 '유혹을 이겨낸 자' + 'A는 멈추지 않아' 달성 상태 유지)
- UI컴포넌트 count 1→2, 프로젝트설계 count 1→2 (milestone 미도달)
