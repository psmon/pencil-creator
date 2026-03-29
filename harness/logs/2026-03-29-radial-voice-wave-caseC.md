# Case C: Radial Voice Wave — blumn.ai 통화음성 애니메이션 분석

- **날짜**: 2026-03-29
- **대상**: https://blumn.ai/ — AIVY AI Agent 섹션
- **케이스**: Case C (웹 애니메이션 → JSON → 펜슬 컴포넌트)

---

## Phase 1: 조사 (researching)

### 도구 활용
- **WebFetch**: HTML 콘텐츠 1차 분석 (SPA로 인해 소스 직접 추출 불가)
- **Playwright**: browser_navigate → browser_evaluate → getLottie() API로 내부 데이터 추출
- **스크린샷**: blumn-aivy-section.png (사용자 제공) + Playwright 캡처

### 핵심 발견
- **렌더링**: dotlottie-player (Lottie canvas renderer)
- **소스**: `https://framerusercontent.com/assets/Qy5qZybQ5MfuD3GIrnCaMOTXS4.lottie`
- **구조**: 400×400, 50fps, 175프레임 (3.5s loop)
- **레이어**: 2개 (adjustment + "lines" shape layer)
- **60개 방사형 라인**: 6° 간격, y=-126~-105.75 (길이 20.25px), 두께 4px

### 분석된 기법 (3개 분리)
1. **Radial Line Array**: 60개 라인 × RotateTransform(i×6°)
2. **Trim Path Pulse**: trimStart 90%→1%→90% (CubicEase)
3. **Sequential Color Cascade**: #D8D8D8→#E55A71→#DB1E3E→#E4324F, stagger 40ms/line

---

## Phase 2a: JSON 기법 정의서

| 파일 | 기법 | 핵심 |
|------|------|------|
| `01-radial-voice-wave.json` | 통합 구조 | 60 lines, trim+color, stagger 40ms |
| `02-trim-path-pulse.json` | 트림패스 | StrokeDashOffset 18→0→18 |
| `03-sequential-color-cascade.json` | 색상 캐스케이드 | ColorAnimation stagger wave |

XAML 샘플: `design/xaml/sample/21-radial-voice-wave.xaml`

---

## Phase 2b: 펜슬 컴포넌트

### 카테고리별 카드 추가
| 위치 | 카드 | ID |
|------|------|----|
| CAT4 | 4-4 RADIAL VOICE WAVE | rLvtU |
| CAT6 | 6-4 TRIM PATH PULSE | 1yKXf |
| CAT7 | 7-4 SEQUENTIAL COLOR CASCADE | wqNpW |

### 통합 SAMPLE 프레임
- **ID**: WjWsE
- **이름**: SAMPLE — Radial Voice Wave (통합 컴포넌트)
- **구성**: 시각 프리뷰 + 스펙 그리드 + JSON 참조 + WPF/CSS 코드
- **용도**: 이 프레임 하나만 참조하면 원형 음성파동 전체 구현 가능

---

## Phase 3: 평가

| 축 | 점수 | 근거 |
|----|------|------|
| C1: 조사 깊이 | 33/35 | WebFetch+Playwright, getLottie() JSON 파싱, 키프레임/색상/이징 정밀 추출 |
| C2: JSON 완결성 | 33/35 | 3개 넘버링 JSON, 모든 필수 필드, 기법 분리, WPF+CSS 매핑 포함 |
| C3: 펜슬 품질 | 28/30 | 3카드+통합프레임, 다크테마 일관, Before→After, 코드 포함 |
| **합계** | **94/100** | **등급 A** |

---

## RPG

- **획득 XP**: 5,640 (940 × 5 × 1.2)
- **레벨**: Lv.24 → **Lv.27**
- **잔여 XP**: 666 / 2,000
