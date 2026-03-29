# Case W: AI 컴포넌트 샘플페이지 — 음성파동 통합 컴포넌트 쇼케이스

- **날짜**: 2026-03-29
- **유형**: Case W (Pencil → HTML)
- **산출물**: design/xaml/output/sample02/ (design.pen + index.html + style.css + script.js)

---

## 파이프라인: C → W

- Case C (2026-03-29): blumn.ai 원형음성파동 분석 — 94/100 A
- Case W (현재): AI 컴포넌트 샘플페이지 — 90/100 A
- 파이프라인 보너스: C → W 양쪽 60점+ → 각 XP × 1.3

---

## 3축 평가

### W1: 디자인 요소 커버리지 — 32/35

| CAT | 기법 | HTML 구현 |
|-----|------|-----------|
| CAT4 | Pulsing Glow, Particle, Gradient, Voice Wave | Core SVG + 3 Variants |
| CAT5 | Shape Morph | Morphing Spectrum Wave (ellipse rx/ry) |
| CAT6 | Trim Path, Path Trajectory | stroke-dashoffset WAAPI + DC 파티클 |
| CAT7 | Color Cascade, Sequential | 60-line stagger + 채팅 상태 |
| CAT8 | Ripple, Interactive | 전송 버튼 + 상태 전환 클릭 |

5개 CAT 카테고리 커버. 5개 섹션(Core/Variants/Chatbot/Agent/DataCenter) 모두 구현.

### W2: 애니메이션 구현 충실도 — 31/35

- **.pen + .xaml + .json 3중 참조**: wpf-animation.pen 시각 구조 + 21-radial-voice-wave.xaml 정밀 파라미터 + 01~03 JSON 기법 정의서
- **WAAPI 전면 활용**: 6개 애니메이션 클래스 (RadialVoiceWave, GlowPulseWave, ParticleVoiceField, MorphingSpectrumWave, ChatbotWave, AgentRealtimeWave)
- **WPF → Web 정밀 매핑**:
  - StrokeDashOffset 18.225 → 0.2025 (WAAPI keyframes)
  - ColorAnimation 6단계 캐스케이드 (#D8D8D8 → #E55A71 → #DB1E3E → #E4324F)
  - BeginTime stagger → WAAPI delay
  - CubicEase → cubic-bezier(0.333, 0, 0.667, 1)
  - SineEase → ease-in-out
- **Canvas 파티클**: ParticleVoiceField 30개 + DataCenter 27개 경로 파티클
- **SVG 리얼리티**: radialGradient 센터 글로우, 가이드 링

### W3: 독창적 확장 — 27/30

- **파라미터 제어 UI**: Line Count / Speed / Stagger / Active Color 4개 슬라이더
- **챗봇 4상태 전환**: idle → processing → speaking → complete 클릭 제어
- **감정 분석 시뮬레이션**: setInterval 실시간 변동
- **IntersectionObserver**: 스크롤 진입 fade-in
- **반응형**: @media 1200px 대응
- **외부 이미지 0**: 100% SVG + Canvas + CSS
- **UX 스토리**: Core → Variants → Chatbot → Agent → DataCenter 5단계 흐름

---

## 총점: 90/100 — A등급

---

## XP 계산

```
기본XP = 90 × 10 = 900
등급배율 = ×5 (A등급)
유형배율 = ×1.2 (Case W)
파이프라인 보너스 = ×1.3 (C → W)

최종XP = 900 × 5 × 1.2 × 1.3 = 7,020
```
