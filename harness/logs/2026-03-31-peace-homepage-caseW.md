# Case W: Peace Homepage HTML — 평가 로그

> 날짜: 2026-03-31
> Case: W (Web)
> 주제: 평화로운 젠 가든 → "전쟁을 멈추고 평화를 기원하는 홈페이지"
> 파이프라인: A→W (Case A 88점 + Case W 92점)

---

## 산출물

### 파일 구성
| 파일 | 역할 | 크기 |
|------|------|------|
| `design/xaml/output/sample04/index.html` | 4 섹션 HTML 구조 | 6.6KB |
| `design/xaml/output/sample04/style.css` | 전체 스타일 (반응형 포함) | 8.7KB |
| `design/xaml/output/sample04/main.js` | WAAPI 애니메이션 엔진 + 옵션 패널 | 18.6KB |

### 섹션 구성
| # | 섹션 | 적용 기법 |
|---|------|----------|
| 1 | Hero (메인 화면) | Aurora Gradient (31) + Breathing Circle (28) + Feather Drift (30) + Zen Fade (32) + Ripple (29) |
| 2 | Peace Message | Zen Fade Cascade (32) + Card Ripple BG (29) + Button Hover (CAT8) |
| 3 | Peace Map | Map Dots Breathing (CAT10) + Ripple Emanation (29) + Zen Fade (32) |
| 4 | Footer | Gradient BG (CAT4) + Zen Fade (32) + Peace Symbol Glow |

### 애니메이션 옵션 패널
- Speed 슬라이더 (0.3x ~ 3.0x)
- Feather Count 슬라이더 (0 ~ 25)
- Ripple Intensity 슬라이더 (0 ~ 2.0)
- 5개 토글: Breathing / Ripple / Feather / Aurora / Cascade

---

## XAML→Web 매핑 (이중 참조)

| XAML 파라미터 | 값 (from .xaml) | Web 구현 |
|--------------|-----------------|---------|
| ScaleTransform 0.6→1.4 | 28.xaml:20-21 | WAAPI scale(0.6)→scale(1.4) |
| SineEase EaseInOut | 28.xaml:23 | cubic-bezier(0.445,0.05,0.55,0.95) |
| Duration 0:0:4 | 28.xaml:21 | 4000ms |
| BeginTime 0:0:0.3 | 28.xaml:55 | delay: 300ms |
| Opacity 0.3→1.0 | 28.xaml:106 | opacity keyframes |
| Scale 0→8 | 29.xaml:20 | WAAPI scale(0)→scale(8) |
| BeginTime stagger 0.8s | 29.xaml:45 | delay: 800ms, 1600ms |
| TranslateX -30→30 | 30.xaml:37 | translateX(-30px)→(30px) |
| TranslateY 0→500 | 30.xaml:46 | translateY(0)→(110vh) |
| Rotate -15→15 | 30.xaml:51 | rotate(-15deg)→(15deg) |
| ColorAnimation 4-stop | 31.xaml:20-54 | rAF color lerp cycle |
| Offset 0.2↔0.5 | 31.xaml:57 | gradient % interpolation |
| PowerEase P=3 EaseOut | 32.xaml:16 | cubic-bezier(0.215,0.61,0.355,1) |
| BeginTime +500ms stagger | 32.xaml:33 | IntersectionObserver + delay |

---

## 3축 평가

| 축 | 항목 | 점수 | 비고 |
|----|------|------|------|
| W1 | 디자인 커버리지 | 32/35 | 5/5 CAT14 카드 + CAT10/CAT8/CAT4 = 4개+ 카테고리 |
| W2 | 애니메이션 충실도 | 33/35 | WAAPI 전면 활용, .pen+.xaml 이중 참조, 정밀 매핑 |
| W3 | 독창적 확장 | 27/30 | 파라미터 UI 3슬라이더+5토글, SVG 자체 생성, 반응형, 세계 지도 |
| **합계** | | **92/100** | **등급 A** |

---

## XP 계산

```
기본XP = 92 × 10 = 920
등급배율 = ×5 (A등급)
케이스배율 = ×1.2 (Case W)
파이프라인배율 = ×1.2 (A→W, 88+92 양쪽 60+)

최종XP = 920 × 5 × 1.2 × 1.2 = 6,624
```

---

## RPG 업데이트
- Lv.38 → Lv.40 (+2 level ups)
- XP: 460 / 3,300
- Total XP: 55,116
