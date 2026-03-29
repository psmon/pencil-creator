# WPF Animation Migration Guide

원본 XAML 애니메이션을 Blend for Visual Studio에서 열람/편집 가능한 형태로 변환하는 지침.

## 목적

수집한 WPF 애니메이션 정의를 다른 플랫폼(웹, 모바일 등)에서 셀프 구현할 때
**참조 자료**로 활용하기 위함. Blend 타임라인에서 키프레임과 이징을 시각적으로 확인하는 것이 핵심.

---

## 핵심 원칙

### 1. Window → UserControl 변환

원본은 독립 `<Window>`이지만, 갤러리 앱에 임베드하려면 `<UserControl>`로 변환한다.

```xml
<!-- 원본 -->
<Window x:Class="WpfAnimations.GlassEffectButton" ...>

<!-- 변환 후 -->
<UserControl x:Class="design_wpf_app.Migrated.Sample01_GlassEffectButton"
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
             mc:Ignorable="d"
             d:DesignHeight="300" d:DesignWidth="400"
             Background="#1E1E2E">
```

- `d:DesignHeight/Width` 로 Blend 디자인 서피스 크기 지정
- Window 전용 속성(`Title`, `WindowStartupLocation` 등) 제거

### 2. ControlTemplate 해체 → 루트 Grid에 직접 배치

Blend 타임라인에서 Storyboard가 요소를 이름으로 참조하려면,
**ControlTemplate 내부가 아닌 루트 Grid에 직접** 배치해야 한다.

```
[X] ControlTemplate 내부 요소 → Blend에서 이름 참조 불가
[O] 루트 Grid 직계 자식 → x:Name으로 직접 참조 가능
```

### 3. Transform에 x:Name 부여 (인덱스 사용 금지)

```xml
<!-- [X] 인덱스 방식 — 디자인 타임 오류 발생 -->
Storyboard.TargetProperty="(UIElement.RenderTransform).(TransformGroup.Children)[0].(ScaleTransform.ScaleX)"

<!-- [O] 이름 방식 — 안정적 -->
<ScaleTransform x:Name="glassScale" />
<RotateTransform x:Name="glassRotate" />

Storyboard.TargetName="glassScale" Storyboard.TargetProperty="ScaleX"
Storyboard.TargetName="glassRotate" Storyboard.TargetProperty="Angle"
```

---

## Storyboard 이중 구조

Blend 디자인모드와 런타임 **모두** 동작하게 하려면 이중 구조가 필요하다.

### Layer 1: Resources에 x:Key Storyboard (Blend 타임라인용)

```xml
<UserControl.Resources>
    <Storyboard x:Key="GlassHoverIn">
        <DoubleAnimation Storyboard.TargetName="glassCube"
            Storyboard.TargetProperty="Opacity"
            To="1" Duration="0:0:0.5" />
        <DoubleAnimation Storyboard.TargetName="glassScale"
            Storyboard.TargetProperty="ScaleX"
            To="0.9" Duration="0:0:0.5" />
    </Storyboard>
</UserControl.Resources>
```

- Blend 타임라인 **드롭다운에서 선택** 가능
- 키프레임 편집, 이징 확인, 재생 가능
- 이것만으로는 디자인모드에서 인터랙션 안 됨

### Layer 2: EventTrigger에 인라인 Storyboard (디자인+런타임 실행용)

```xml
<Button.Triggers>
    <EventTrigger RoutedEvent="MouseEnter">
        <BeginStoryboard>
            <Storyboard>
                <!-- Layer 1과 동일한 애니메이션 복제 -->
                <DoubleAnimation Storyboard.TargetName="glassCube"
                    Storyboard.TargetProperty="Opacity"
                    To="1" Duration="0:0:0.5" />
            </Storyboard>
        </BeginStoryboard>
    </EventTrigger>
</Button.Triggers>
```

- 디자인모드에서 마우스 인터랙션으로 동작
- 런타임에서도 동일하게 동작
- **StaticResource 참조 사용 금지** — WPF가 리소스를 freeze하여 런타임 오류 발생

### 왜 이중 구조인가?

| 방식 | Blend 타임라인 | 디자인모드 인터랙션 | 런타임 |
|------|:-:|:-:|:-:|
| Resources x:Key만 | O | X | X |
| 인라인 EventTrigger만 | X | O | O |
| **이중 구조** | **O** | **O** | **O** |

---

## DemoSequence 패턴

개별 Storyboard를 Blend에서 전환하면 이전 상태가 리셋된다.
**DemoSequence**로 전체 애니메이션 흐름을 한 번에 확인할 수 있다.

```xml
<Storyboard x:Key="DemoSequence">
    <!-- Phase 1: HoverIn (0~0.5s) -->
    <DoubleAnimation Storyboard.TargetName="glassCube"
        Storyboard.TargetProperty="Opacity"
        From="0" To="1" Duration="0:0:0.5"
        BeginTime="0:0:0" FillBehavior="HoldEnd" />

    <!-- Phase 2: Spin (0.7~1.2s) — 이전 상태 유지한 채 회전 -->
    <DoubleAnimation Storyboard.TargetName="glassRotate"
        Storyboard.TargetProperty="Angle"
        From="0" To="360" Duration="0:0:0.5"
        BeginTime="0:0:0.7" FillBehavior="HoldEnd" />

    <!-- Phase 3: HoverOut (1.5~1.8s) — 복원 -->
    <DoubleAnimation Storyboard.TargetName="glassCube"
        Storyboard.TargetProperty="Opacity"
        To="0" Duration="0:0:0.3"
        BeginTime="0:0:1.5" FillBehavior="HoldEnd" />
</Storyboard>
```

### DemoSequence 설계 규칙

1. **BeginTime으로 Phase 분리** — 각 단계 사이에 0.2~0.3s 간격
2. **FillBehavior="HoldEnd"** 필수 — 이전 Phase 결과를 유지해야 다음 Phase가 누적
3. **From 값 명시** — Phase 1은 반드시 From 명시 (초기값 보장)
4. 마지막 Phase는 원래 상태로 복원 (루프 확인 가능)
5. **원본 의도 파악 필수** — 원본 XAML이 표현하려는 애니메이션 시나리오를 분석하고,
   DemoSequence가 그 **전체 사용자 경험 흐름**을 재현해야 한다

### DemoSequence 의도 기반 설계 프로세스

DemoSequence는 단순히 개별 Storyboard를 이어붙이는 게 아니다.
**원본이 표현하려는 애니메이션의 전체 스토리를 분석하고, 그 스토리를 재현하는 시퀀스를 구축**한다.

#### Step 1. 원본 의도 분석

변환 시 원본 XAML을 읽고 다음 질문에 답한다:

```
1. 이 애니메이션은 언제 발동하는가?
   → Loaded(자동) / MouseEnter(호버) / Click / 상태변경 / 조합

2. 사용자가 보게 되는 시각적 스토리는?
   → 예: "버튼에 마우스를 올리면 유리질감이 나타나고, 클릭하면 회전한다"

3. 어떤 속성이 어떤 순서로 변하는가?
   → Opacity 0→1, Scale 1→0.9, Angle 0→360, Opacity 1→0

4. 반복인가 일회성인가?
   → Forever / 1회 / 트리거당 1회

5. 여러 요소가 협동하는가?
   → 단일 요소 / 다수 요소 시차(stagger) / 병렬
```

#### Step 2. 분석 결과를 DemoSequence Phase로 변환

분석한 스토리의 **각 장면을 Phase로 매핑**한다.
원본에 없더라도 스토리 재현에 필요하면 Phase를 **추가 생성**한다.

```
원본 스토리                          DemoSequence Phase
─────────────────                    ─────────────────
"마우스가 버튼 위로"           →     Phase 1: HoverIn (Opacity, Scale)
"유리질감 보이는 상태에서 클릭" →     Phase 2: Spin (Rotate 360)
"마우스 떠남"                 →     Phase 3: HoverOut (복원)
```

핵심: 원본이 EventTrigger 3개로 분리한 것을
DemoSequence에서는 **하나의 연속 시나리오**로 통합한다.

#### Step 3. 원본에 없는 연출도 보강

원본은 사용자 인터랙션에 의존하므로 "대기 시간"이 없다.
DemoSequence에서는 **각 Phase 사이에 의도적 간격(gap)**을 넣어
Blend 프리뷰 시 각 단계가 명확히 구분되도록 한다.

또한 원본이 표현하지 못한 **맥락 연출**을 추가할 수 있다:

| 보강 유형 | 예시 |
|-----------|------|
| **진입 연출** | 요소가 처음 나타나는 fade-in (원본에 없어도 추가) |
| **강조 반복** | 핵심 효과를 2~3회 반복해서 기법을 명확히 보여줌 |
| **속도 변주** | 같은 효과를 느린 버전으로 한번 더 (이징 확인용) |
| **역재생** | 정방향 → 역방향으로 대칭 보여주기 |

예시 — Spinner의 DemoSequence:
```xml
<Storyboard x:Key="DemoSequence">
    <!-- Phase 1: 느린 1회전 — 이징과 궤적을 명확히 관찰 -->
    <DoubleAnimation ... From="0" To="360" Duration="0:0:2"
        BeginTime="0:0:0" FillBehavior="HoldEnd" />

    <!-- Phase 2: 실제 속도 3회전 — 원본 의도대로의 체감 속도 -->
    <DoubleAnimation ... From="0" To="1080" Duration="0:0:3"
        BeginTime="0:0:2.5" FillBehavior="HoldEnd" />
</Storyboard>
```

#### Step 4. DemoSequence 주석에 의도 기록

```xml
<Storyboard x:Key="DemoSequence">
    <!--
        원본 의도: 글래스 이펙트 버튼
        시나리오: 호버 → 유리 오버레이 페이드인+축소 → 클릭 → 360도 회전 → 복원
        핵심 기법: Opacity + ScaleTransform + RotateTransform 조합
        다른 플랫폼 구현 포인트:
          - 웹: hover 시 ::after에 linear-gradient + transform scale/rotate
          - 모바일: touchDown=호버, touchUp=클릭 매핑
    -->
    <!-- Phase 1: HoverIn ... -->
</Storyboard>
```

### 의도 분석 → DemoSequence 변환 요약

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  원본 XAML 분석   │ ──→ │  스토리 장면 도출  │ ──→ │ Phase별 Storyboard│
│                  │     │                  │     │    구현 + 보강     │
│ - 트리거 파악     │     │ - 장면 순서 정리   │     │ - BeginTime 배치  │
│ - 속성 변화 추적  │     │ - 누락 장면 추가   │     │ - FillBehavior    │
│ - 이징/타이밍     │     │ - 관찰용 보강 판단 │     │ - 의도 주석       │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### 타임라인 시각화 예시

```
0s        0.5s       0.7s       1.2s       1.5s      1.8s
├─ HoverIn ─┤  (gap)  ├─ Spin 360° ─┤  (gap)  ├─ HoverOut ─┤
  Opacity 0→1         Angle 0→360            Opacity 1→0
  Scale 1→0.9                                Scale 0.9→1
```

---

## 이벤트 트리거 주의사항

### 사용 가능한 RoutedEvent

| 이벤트 | EventTrigger | 비고 |
|--------|:-:|------|
| `MouseEnter` | O | |
| `MouseLeave` | O | |
| `Button.Click` | O | hitArea를 Button으로 만들어야 함 |
| `Loaded` | O | 자동 재생 애니메이션에 적합 |
| `MouseDown` | X | direct 이벤트라 EventTrigger 불가 |
| `MouseLeftButtonDown` | X | 동일 |

### 클릭 이벤트 해결: 투명 Button 히트 영역

```xml
<!-- 투명 버튼 스타일 -->
<Style x:Key="HitButtonStyle" TargetType="Button">
    <Setter Property="Background" Value="Transparent" />
    <Setter Property="BorderThickness" Value="0" />
    <Setter Property="Cursor" Value="Hand" />
    <Setter Property="Template">
        <Setter.Value>
            <ControlTemplate TargetType="Button">
                <Border Background="Transparent" />
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>

<!-- 최상위에 배치 -->
<Button x:Name="hitArea"
    Style="{StaticResource HitButtonStyle}"
    Width="200" Height="60">
    <Button.Triggers>
        <EventTrigger RoutedEvent="Button.Click">
            <BeginStoryboard>...</BeginStoryboard>
        </EventTrigger>
    </Button.Triggers>
</Button>
```

---

## 변환 체크리스트

새 샘플을 마이그레이션할 때 이 순서를 따른다.

```
[ ] 1. 원본 Window XAML 구조 분석
       - 어떤 요소에 어떤 애니메이션이 적용되는지 파악
       - Transform 종류 확인 (Scale, Rotate, Translate, Skew)

[ ] 2. UserControl 껍데기 생성
       - x:Class="design_wpf_app.Migrated.Sample{NN}_{PascalName}"
       - d:DesignHeight/Width 설정
       - Background 원본과 동일하게

[ ] 3. 요소를 루트 Grid에 직접 배치
       - ControlTemplate에서 꺼내기
       - 각 요소에 x:Name 부여
       - Transform에도 x:Name 부여 (인덱스 금지)

[ ] 4. Resources에 개별 Storyboard 정의 (x:Key)
       - 이름 규칙: {효과명}{동작} (예: GlassHoverIn, SpinnerRotate)
       - TargetName으로 요소/Transform 참조

[ ] 5. 원본 의도 분석 → DemoSequence Storyboard 구축
       - 원본 트리거/속성변화/이징 분석 (5가지 질문)
       - 스토리 장면을 Phase로 매핑
       - 원본에 없는 보강 연출 판단 (진입, 강조반복, 속도변주, 역재생)
       - BeginTime + FillBehavior="HoldEnd"로 조립
       - 의도 주석 기록 (원본의도/시나리오/핵심기법/크로스플랫폼)

[ ] 6. EventTrigger에 인라인 Storyboard 복제
       - 호버: MouseEnter / MouseLeave
       - 클릭: Button.Click (투명 Button 사용)
       - 자동재생: Loaded

[ ] 7. 코드비하인드는 최소화
       - InitializeComponent()만 있는 빈 클래스
       - 특수한 경우(코드 생성 파티클 등)만 로직 추가

[ ] 8. 빌드 확인 → DB 업데이트
       - status 변경 (변환완료/빌드성공)
       - animationSummary: 사용자 관점 시나리오 한 줄 요약
       - coreAnimations: 핵심 기법 배열 (예: ["Opacity 페이드", "RotateTransform 360도"])
       - triggerType: 발동 유형
       - migrationLog에 변환 로그 추가 (핵심기능 제목 요약 포함)
```

---

## 애니메이션 유형별 변환 패턴

### A. 인터랙션형 (호버/클릭)
예: Glass Button, Toggle Switch, Sidebar Menu

- 투명 Button 히트 영역 사용
- EventTrigger: MouseEnter, MouseLeave, Button.Click
- DemoSequence: HoverIn → 액션 → HoverOut

### B. 자동 반복형 (Loaded 시 자동 재생)
예: Spinner, Particle, Gradient BG, Matrix Rain

- `RepeatBehavior="Forever"` 사용
- EventTrigger: `Loaded`로 자동 시작
- DemoSequence: 한 사이클만 보여주기 (RepeatBehavior 제거)

```xml
<!-- 런타임: 무한 반복 -->
<EventTrigger RoutedEvent="Loaded">
    <BeginStoryboard>
        <Storyboard RepeatBehavior="Forever">
            <DoubleAnimation ... Duration="0:0:1" />
        </Storyboard>
    </BeginStoryboard>
</EventTrigger>

<!-- Blend 타임라인: 단일 사이클 -->
<Storyboard x:Key="SpinnerRotate">
    <DoubleAnimation ... Duration="0:0:1" />
</Storyboard>
```

### C. 시퀀스형 (단계별 진행)
예: Page Transition, Cherry Blossom Fall

- 각 단계를 개별 Storyboard로 분리
- DemoSequence에서 BeginTime으로 이어 붙이기
- FillBehavior="HoldEnd" 필수

### D. 코드 생성형 (XAML만으로 불가)
예: Radial Voice Wave (60개 라인 동적 생성)

- Loaded 이벤트에서 코드로 요소 생성
- 생성된 요소에 Storyboard 적용
- Resources에는 **대표 샘플 Storyboard** 정의 (1~2개 요소만)
- DemoSequence는 대표 요소만으로 구성

---

## 파일 구조

```
design-wpf-app/
├── migrated/
│   ├── Sample01_GlassEffectButton.xaml      (UserControl)
│   ├── Sample01_GlassEffectButton.xaml.cs   (코드비하인드)
│   ├── Sample02_AnimatedSidebarMenu.xaml
│   └── ...
├── db/
│   ├── migration-db.json                     (마이그레이션 현황)
│   └── README.md                             (DB 스키마 설명)
├── docs/
│   └── animation-migration-guide.md          (이 문서)
├── MainWindow.xaml                           (갤러리 네비게이션)
└── MainWindow.xaml.cs
```

---

## Blend 사용법 요약

1. `migrated/Sample{NN}_*.xaml` 파일을 Blend에서 열기
2. **타임라인 드롭다운**에서 Storyboard 선택
   - 개별 확인: `GlassHoverIn`, `GlassSpinClick` 등
   - 전체 흐름: `DemoSequence`
3. **재생 버튼(▶)** 으로 애니메이션 프리뷰
4. 키프레임 클릭하여 이징, 타이밍, 값 수정
5. 디자인 서피스에서 마우스 호버/클릭으로 인터랙션 확인
