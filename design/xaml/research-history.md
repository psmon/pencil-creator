# WPF Blend Animation XAML Research History

> 조사일: 2026-03-27
> 목적: 모던 WPF Storyboard 애니메이션 컨트롤 5종 조사 및 샘플 수집

---

## 1. Glass Effect Button

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft Learn - Walkthrough: Create a Button by Using XAML](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/controls/walkthrough-create-a-button-by-using-xaml) |
| 핵심 기술 | ControlTemplate, EventTrigger, ScaleTransform, RotateTransform |
| 애니메이션 | MouseEnter(글래스 페이드인+축소), MouseLeave(복원), Click(360도 회전) |
| 샘플 파일 | [`sample/01-glass-effect-button.xaml`](sample/01-glass-effect-button.xaml) |

---

## 2. Animated Navigation Drawer / Sidebar Menu

| 항목 | 내용 |
|------|------|
| 출처 | [GitHub - CSharpDesignPro/Navigation-Drawer-Sidebar-Menu-in-WPF](https://github.com/CSharpDesignPro/Navigation-Drawer-Sidebar-Menu-in-WPF) |
| 핵심 기술 | ToggleButton, DoubleAnimation, Width 속성 애니메이션 |
| 애니메이션 | Checked(65→230px 확장), Unchecked(230→65px 축소) |
| 샘플 파일 | [`sample/02-animated-sidebar-menu.xaml`](sample/02-animated-sidebar-menu.xaml) |

---

## 3. Rotating Loading Spinner

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft Learn - How to Make an Element Spin in Place](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/how-to-make-an-element-spin-in-place) |
| 참고 | [iditect.com - WPF Loading Spinner](https://www.iditect.com/faq/csharp/wpf-loading-spinner.html), [GitHub - LoadingIndicators.WPF](https://github.com/zeluisping/LoadingIndicators.WPF) |
| 핵심 기술 | RotateTransform, RepeatBehavior="Forever", StrokeDashArray |
| 애니메이션 | Loaded 이벤트로 0→360도 무한 회전 |
| 샘플 파일 | [`sample/03-rotating-loading-spinner.xaml`](sample/03-rotating-loading-spinner.xaml) |

---

## 4. Sliding Expandable Panel

| 항목 | 내용 |
|------|------|
| 출처 | [Bits Bobs Etc - Creating a Sliding Panel in WPF](https://bitsbobsetc.wordpress.com/2011/07/10/creating-a-sliding-panel-in-wpf/) |
| 핵심 기술 | TranslateTransform, AccelerationRatio/DecelerationRatio, MultiBinding |
| 애니메이션 | 우측 패널 슬라이드 인/아웃 (0.6s 이징 커브) |
| 샘플 파일 | [`sample/04-sliding-expandable-panel.xaml`](sample/04-sliding-expandable-panel.xaml) |

---

## 5. Color-Animated Content Control

| 항목 | 내용 |
|------|------|
| 출처 | [GitHub - microsoft/WPF-Samples ControlTemplateStoryboardExample](https://github.com/microsoft/WPF-Samples/blob/main/Animation/PropertyAnimation/ControlTemplateStoryboardExample.xaml) |
| 참고 | [moldstud.com - Step-by-Step Guide to Building Simple Storyboards in XAML](https://moldstud.com/articles/p-step-by-step-guide-to-building-simple-storyboards-in-xaml-your-ultimate-tutorial) |
| 핵심 기술 | ControlTemplate, ColorAnimation, SolidColorBrush, Trigger.EnterActions/ExitActions |
| 애니메이션 | MouseEnter(White→#CCCCFF 3s 자동반전), IsMouseOver(→Purple 1s), MouseLeave(→White 1s) |
| 샘플 파일 | [`sample/05-color-animated-control.xaml`](sample/05-color-animated-control.xaml) |

---

---

# 2차 조사 — 유형별 WPF 애니메이션 (2026-03-28)

> 목적: 4개 카테고리(데이터 입력 / 피드백 / 네비게이션 / 장식)별 다양한 애니메이션 패턴 조사

---

## CAT1: 데이터 입력 컨트롤 (Data Input Controls)

### 6. Floating Label TextBox

| 항목 | 내용 |
|------|------|
| 출처 | [Reflection IT - XAML Animated Headered TextBox Style](https://www.reflectionit.nl/blog/2017/xaml-animated-headered-textbox-style) |
| 핵심 기술 | VisualStateManager, TranslateTransform, ScaleTransform, ColorAnimation |
| 애니메이션 | Focus → Label Y↑18px + Scale 75% + Gray→Blue 색상 전환 |
| 샘플 파일 | [`sample/06-floating-label-textbox.xaml`](sample/06-floating-label-textbox.xaml) |

### 7. Animated ComboBox Dropdown

| 항목 | 내용 |
|------|------|
| 출처 | MaterialDesignInXAML ControlTemplate 패턴 참고 |
| 핵심 기술 | ScaleTransform on Popup, CubicEase, Opacity animation |
| 애니메이션 | IsDropDownOpen → ScaleY 0→1 (top-down unfold) + Opacity fade-in 250ms |
| 샘플 파일 | [`sample/07-animated-combobox.xaml`](sample/07-animated-combobox.xaml) |

### 8. Material Design Toggle Switch

| 항목 | 내용 |
|------|------|
| 출처 | [Harwood Tech - WPF Material Design Toggle Button](https://mharwood.uk/wpf-material-design-toggle-button/), [Medium - Building a Material Design Style Toggle Button](https://it-delinquent.medium.com/building-a-material-design-style-toggle-button-in-wpf-and-xaml-b7dcc4d5025f) |
| 핵심 기술 | TranslateTransform, ColorAnimation, DropShadowEffect |
| 애니메이션 | IsChecked → Knob X+20px + Track Gray→Green (AccelerationRatio 0.4) |
| 샘플 파일 | [`sample/08-toggle-switch.xaml`](sample/08-toggle-switch.xaml) |

---

## CAT2: 피드백 & 알림 (Feedback & Notification)

### 9. Snackbar / Toast Notification

| 항목 | 내용 |
|------|------|
| 출처 | [ResearchTech - Top-Sliding Snackbar in WPF](https://researchtech.net/index.php/2024/04/top-sliding-snackbar-notifications-in-wpf-c-using-mvvm/), [GitHub - ToastNotifications](https://github.com/rafallopatka/ToastNotifications) |
| 핵심 기술 | TranslateTransform, Opacity, BeginTime (auto-hide 3s) |
| 애니메이션 | TranslateY 60→0 slide up + Opacity 0→1 (CubicEase), 3초 후 자동 슬라이드 아웃 |
| 샘플 파일 | [`sample/09-snackbar-toast.xaml`](sample/09-snackbar-toast.xaml) |

### 10. Animated Progress Bar

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft Learn - ProgressBar Styles and Templates](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/controls/progressbar-styles-and-templates) |
| 핵심 기술 | DoubleAnimation on Value, TranslateTransform (indeterminate), SineEase |
| 애니메이션 | Indeterminate: 슬라이딩 바 ←→ 반복, Value: 0→100% smooth fill (QuadraticEase) |
| 샘플 파일 | [`sample/10-animated-progressbar.xaml`](sample/10-animated-progressbar.xaml) |

### 11. Badge Counter Pop

| 항목 | 내용 |
|------|------|
| 출처 | [Syncfusion - Badge Customization](https://help.syncfusion.com/wpf/badge/badge-customization), [GitHub Gist - Pulse Animation](https://gist.github.com/mohamedmansour/9fa64785496ceeabd991) |
| 핵심 기술 | ScaleTransform, DoubleAnimationUsingKeyFrames, ElasticEase |
| 애니메이션 | 값 변경 → Scale 1→1.3→1.0 (ElasticEase bounce, 300ms) |
| 샘플 파일 | [`sample/11-badge-counter-pop.xaml`](sample/11-badge-counter-pop.xaml) |

---

## CAT3: 네비게이션 & 전환 (Navigation & Transitions)

### 12. Page / Content Transition

| 항목 | 내용 |
|------|------|
| 출처 | [CodeProject - Simple WPF Page Transitions](https://www.codeproject.com/Articles/197132/Simple-WPF-Page-Transitions), [Marko Devcic - Animating WPF ContentControl](https://www.markodevcic.com/post/Animating_WPF_ContentControl_Part_1/) |
| 핵심 기술 | TranslateTransform + Opacity, CubicEase, ContentControl ControlTemplate |
| 애니메이션 | Old content: slide left(-300px)+fade out / New content: slide in(+300px)+fade in (400ms) |
| 샘플 파일 | [`sample/12-page-transition.xaml`](sample/12-page-transition.xaml) |

### 13. Tab Control Slide Animation

| 항목 | 내용 |
|------|------|
| 출처 | [Syncfusion - Tab Navigation Animation](https://help.syncfusion.com/wpf/tab-navigation/animation), [Microsoft Q&A - Animated TabControl](https://learn.microsoft.com/en-us/answers/questions/803164/) |
| 핵심 기술 | TranslateTransform per direction, Opacity, QuadraticEase |
| 애니메이션 | 탭 이동 방향에 따라 Left/Right 슬라이드 + Opacity 0.3→1 (350ms) |
| 샘플 파일 | [`sample/13-tab-slide.xaml`](sample/13-tab-slide.xaml) |

### 14. Hamburger → X Morph

| 항목 | 내용 |
|------|------|
| 출처 | [MahApps - HamburgerMenu](https://mahapps.com/docs/controls/HamburgerMenu), CSS/XAML morph 패턴 참고 |
| 핵심 기술 | RotateTransform, TranslateTransform, Opacity, CubicEase |
| 애니메이션 | Middle line Opacity→0, Top Y+7+Rotate45°, Bottom Y-7+Rotate-45° (250ms) |
| 샘플 파일 | [`sample/14-hamburger-to-x.xaml`](sample/14-hamburger-to-x.xaml) |

---

## CAT4: 장식 & 배경 (Decorative & Background)

### 15. Animated Gradient Background

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft Learn - Animate GradientStop Position or Color](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/how-to-animate-the-position-or-color-of-a-gradient-stop), [C# Corner - Color Animation in LinearGradientBrush](https://www.c-sharpcorner.com/Resources/893/) |
| 핵심 기술 | ColorAnimation on GradientStop.Color, DoubleAnimation on Offset |
| 애니메이션 | 3개 Stop 색상 순환(4s), Offset 0.3↔0.7 진동, AutoReverse=Forever |
| 샘플 파일 | [`sample/15-animated-gradient-bg.xaml`](sample/15-animated-gradient-bg.xaml) |

### 16. Particle / Floating Dots

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft WPF-Samples - Per-Frame Animation / ParticleEffects](https://github.com/microsoft/WPF-Samples/blob/main/Animation/Per-FrameAnimation/), [CodeProject - Particle Effects in WPF](https://www.codeproject.com/articles/Particle-Effects-in-WPF) |
| 핵심 기술 | Canvas.Top/Left DoubleAnimation, Opacity lifecycle, staggered BeginTime |
| 애니메이션 | 다수의 Ellipse가 하단→상단 부유, 각각 다른 시작 시간/속도/투명도 |
| 샘플 파일 | [`sample/16-particle-floating-dots.xaml`](sample/16-particle-floating-dots.xaml) |

### 17. Pulsing Glow Effect

| 항목 | 내용 |
|------|------|
| 출처 | [Infragistics - Drop Shadow / Glow Effect](https://www.infragistics.com/blogs/drop-shadow-glow-effect-xaml/), [BlogSpot - WPF Advanced Animation Effects](http://shashtricodewiki.blogspot.com/2015/08/wpf-advanced-xaml-animation-effects.html) |
| 핵심 기술 | DropShadowEffect (ShadowDepth=0), BlurRadius/Opacity animation, SineEase |
| 애니메이션 | BlurRadius 10→30 + Opacity 0.4→0.9 breathing pulse (SineEase, 1.2s, Forever) |
| 샘플 파일 | [`sample/17-pulsing-glow.xaml`](sample/17-pulsing-glow.xaml) |

---

---

# 3차 조사 — 봄 & 자연 파티클 애니메이션 (2026-03-28)

> 목적: 봄 시즌 테마(벚꽃, 꽃잎, 봄바람) WPF 파티클 애니메이션 기법 조사 및 CAT12 추가

---

## CAT12: 봄 & 자연 파티클 (Spring & Nature Particle)

### 18. Cherry Blossom Petal Fall (벚꽃 꽃잎 낙하)

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft Learn - DoubleAnimation](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/how-to-animate-a-property-by-using-a-storyboard), [CodeProject - Animation using Storyboards](https://www.codeproject.com/Articles/364529/Animation-using-Storyboards-in-WPF) |
| 핵심 기술 | Canvas + TranslateTransform Y, RotateTransform, OpacityAnimation, QuadraticEase |
| 애니메이션 | 꽃잎 Path 요소가 위→아래 낙하 + 회전 + 투명도 감소, BeginTime stagger로 순차 등장 |
| 샘플 파일 | [`sample/18-cherry-blossom-fall.xaml`](sample/18-cherry-blossom-fall.xaml) |

### 19. Petal Scatter Wind (꽃잎 흩날리기)

| 항목 | 내용 |
|------|------|
| 출처 | [Medium - Moving Elements with TranslateTransform Animation](https://medium.com/@artillustration391/moving-elements-with-storyboards-translatetransform-animation-in-wpf-0ac391441b37), [Medium - Scale & Rotate with WPF Storyboards](https://medium.com/@artillustration391/scale-rotate-your-ui-dynamic-transforms-with-wpf-storyboards-602bcbc061f3) |
| 핵심 기술 | TranslateTransform X/Y 복합, ScaleTransform 원근 축소, RotateTransform 회전 |
| 애니메이션 | 바람에 날리는 꽃잎: 좌→우 수평 이동 + 약간의 수직 드리프트 + 크기 축소(원거리 효과) + 페이드아웃 |
| 샘플 파일 | [`sample/19-petal-scatter-wind.xaml`](sample/19-petal-scatter-wind.xaml) |

### 20. Spring Breeze Sway (봄바람 흔들림)

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft Learn - Animation Overview](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/animation-overview), [Microsoft Learn - Transforms Overview](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/transforms-overview) |
| 핵심 기술 | DoubleAnimation AutoReverse + Forever, SineEase, TranslateTransform.X 진동 |
| 애니메이션 | 꽃줄기/잎사귀가 SineEase로 좌우 ±5~15° 부드럽게 흔들림, 꽃봉오리도 연동 진동 |
| 샘플 파일 | [`sample/20-spring-breeze-sway.xaml`](sample/20-spring-breeze-sway.xaml) |

---

## 추가 참고 자료

| 리소스 | URL |
|--------|-----|
| MaterialDesignInXamlToolkit Transitions | https://github.com/MaterialDesignInXAML/MaterialDesignInXamlToolkit/wiki/Transitions |
| WPF Material Design Toggle Button | https://mharwood.uk/wpf-material-design-toggle-button/ |
| WPF UI (Fluent Design) | https://github.com/lepoco/wpfui |
| Storyboard 가이드 (moldstud) | https://moldstud.com/articles/p-step-by-step-guide-to-building-simple-storyboards-in-xaml-your-ultimate-tutorial |

---

# 4차 조사 — 사이버 & 디지털 애니메이션 (2026-03-29)

> 목적: Cyberpunk/Futuristic UI 감성의 WPF 애니메이션 기법 6종 조사 및 CAT13 추가

---

## CAT13: 사이버 & 디지털 효과 (Cyber & Digital Effects)

### 22. Glitch Jitter (글리치 떨림)

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft Learn - Animation Tips](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/animation-tips-and-tricks), [Medium - TranslateTransform Animation](https://medium.com/@artillustration391/moving-elements-with-storyboards-translatetransform-animation-in-wpf-0ac391441b37) |
| 핵심 기술 | TranslateTransform X/Y, DiscreteDoubleKeyFrame, OpacityAnimation, ScaleTransform |
| 애니메이션 | 급격한 X/Y 오프셋(±8~12px) + Opacity 플리커(0.3↔1.0) + ScaleX 왜곡(±3%), 1초 간격 반복 |
| 샘플 파일 | [`sample/22-glitch-jitter.xaml`](sample/22-glitch-jitter.xaml) |

### 23. Neon Glow Pulse (네온 글로우 펄스)

| 항목 | 내용 |
|------|------|
| 출처 | [Infragistics - Glow Effect](https://www.infragistics.com/blogs/drop-shadow-glow-effect-xaml/), [Microsoft Learn - DropShadowEffect](https://learn.microsoft.com/en-us/previous-versions/windows/silverlight/dotnet-windows-silverlight/cc490119(v=vs.95)) |
| 핵심 기술 | DropShadowEffect (ShadowDepth=0), BlurRadius/Opacity DoubleAnimation, ColorAnimation |
| 애니메이션 | BlurRadius 15→40 breathing + Color Cyan↔Magenta cycling (SineEase, 1.5s, AutoReverse ∞) |
| 샘플 파일 | [`sample/23-neon-glow-pulse.xaml`](sample/23-neon-glow-pulse.xaml) |

### 24. RGB Split / Chromatic Aberration (색수차 분리)

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft Learn - Transforms Overview](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/transforms-overview), [GitHub - WPF-Samples](https://github.com/microsoft/WPF-Samples) |
| 핵심 기술 | 3-layer TranslateTransform (R/G/B 채널 분리), DiscreteDoubleKeyFrame |
| 애니메이션 | Red X-3~-8px, Green Y±4px, Blue X+3~+8px 오프셋 + 메인 White 레이어 상단, 3초 주기 |
| 샘플 파일 | [`sample/24-rgb-split-chromatic.xaml`](sample/24-rgb-split-chromatic.xaml) |

### 25. Scanline Sweep (스캔라인 스윕)

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft Learn - Opacity Animation](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/how-to-animate-the-opacity-of-an-element-or-brush), [CodeGuru - WPF Animation Effects](https://www.codeguru.com/dotnet/interesting-animation-effects-with-wpf/) |
| 핵심 기술 | TranslateTransform.Y sweep, LinearGradientBrush (cyan glow), DrawingBrush CRT 오버레이 |
| 애니메이션 | Y -20→400px QuadraticEase 2.5s + Opacity pulse 0.3↔0.9 + 정적 CRT 줄무늬 8% |
| 샘플 파일 | [`sample/25-scanline-sweep.xaml`](sample/25-scanline-sweep.xaml) |

### 26. Digital Matrix Rain (디지털 매트릭스 레인)

| 항목 | 내용 |
|------|------|
| 출처 | [CodeProject - Advanced Animations in WPF](https://www.codeproject.com/Articles/376163/Advanced-Animations-in-WPF), [Microsoft Learn - Storyboards Overview](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/storyboards-overview) |
| 핵심 기술 | Canvas TextBlock columns, TranslateTransform.Y cascade, staggered BeginTime, Opacity lifecycle |
| 애니메이션 | 6개 컬럼 하강 (3.2~5s), BeginTime 0~1s stagger, Opacity 0.8→0.2 fade, Cyan/Green 교차 |
| 샘플 파일 | [`sample/26-digital-matrix-rain.xaml`](sample/26-digital-matrix-rain.xaml) |

### 27. Holographic Shimmer (홀로그래픽 쉬머)

| 항목 | 내용 |
|------|------|
| 출처 | [Microsoft Learn - Animate GradientStop](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/how-to-animate-the-position-or-color-of-a-gradient-stop), [C# Corner - Color Animation](https://www.c-sharpcorner.com/Resources/893/) |
| 핵심 기술 | LinearGradientBrush 4-stop, ColorAnimation iridescent, DoubleAnimation Offset sweep |
| 애니메이션 | Cyan↔Purple↔Lime↔Amber 무지개빛 전환 + Offset 0.2↔0.8 SineEase 2s AutoReverse ∞ |
| 샘플 파일 | [`sample/27-holographic-shimmer.xaml`](sample/27-holographic-shimmer.xaml) |

---

## COMBINED SAMPLE: Cyberpunk HUD Panel

| 항목 | 내용 |
|------|------|
| 조합 기법 | Glitch Jitter + Neon Glow Pulse + RGB Split + Scanline Sweep |
| 파이프라인 | Phase 1 글리치(0~200ms) → Phase 2 네온 안정화(200ms~∞) → Phase 3 RGB 분리(500ms~∞) → Phase 4 스캔라인(0~∞) |
| 가치 | 4개 기법의 통합 구현 예시, Case W에서 즉시 HTML 변환 가능 |

---

## 추가 참고 자료

| 리소스 | URL |
|--------|-----|
| XamlFlair Animation Library | https://github.com/XamlFlair/XamlFlair |
| WPF Advanced Animation Effects | http://shashtricodewiki.blogspot.com/2015/08/wpf-advanced-xaml-animation-effects.html |
| WPF Fluid Segmented Control | https://medium.com/@artillustration391/mastering-modern-ui-creating-a-fluid-animated-segmented-control-in-wpf-4db952ddeac3 |
