# 2026-04-17 — Verdana Health DesignMD 영입 (Case D)

**Case D (DesignMD → Pencil Replication)** · 첫 Case D 실행 (v2.6.0 신설 케이스)

---

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| 트리거 | `"verdana Health Design System 디자인엠디 에서 가지고와"` (/harness-usage) |
| 대상 시스템 | chef/verdana-health-design-system |
| 원본 | https://designmd.ai/chef/verdana-health-design-system |
| 라이선스 | MIT (DesignMD default) |
| 산출 .pen | `design/design-md.pen` |
| 원본 보존 | `design/design-md/verdana-health-design-system/DESIGN.md` |

---

## 2. Phase별 요약

### Phase 1 — Gather (designmd CLI)
- `designmd search "verdana health"` → 1 result (chef/verdana-health-design-system, 238 DL)
- `DESIGNMD_API_KEY` 환경 설정 후 `designmd download` 수행 → 134 lines DESIGN.md 수집
- 섹션 인덱스: Overview · Colors(9) · Typography(3 fonts, 10 scale) · Spacing(7) · Radius(5) · Elevation(4) · Components(8종) · Do's and Don'ts(10)
- **특이사항**: 원본에 명시적 Templates 섹션 없음 (토큰+컴포넌트 중심 시스템)

### Phase 2a — Frame Replication
펜슬 프레임 구조:
```
design/design-md.pen
├─ Index — Verdana Health (다크 히어로 프레임)
├─ 01 TOKENS
│  ├─ Color Tokens (9 swatch + 설명 + hex)
│  ├─ Typography (3 family 카드 + 10 type scale 프리뷰)
│  ├─ Spacing (7 scale + 시각 바)
│  ├─ Border Radius (5 + 실제 radius 샘플)
│  └─ Elevation (4 shadow 샘플 + spec)
├─ 02 COMPONENTS
│  ├─ Buttons (Primary/Secondary/Ghost/Destructive × sm/md/lg + Disabled)
│  ├─ Cards (Default/Elevated/Header Bar)
│  ├─ Inputs (Default/Focus/Error/Disabled, helper/error text)
│  ├─ Chips (Filter/Active/Success/Warning/Error)
│  ├─ Lists (Default/Hover/Active row)
│  ├─ Checkboxes (Unchecked/Checked/Indeterminate/Disabled)
│  ├─ Radio Buttons (Unchecked/Selected/Disabled)
│  └─ Tooltips (bg+text+arrow+spec)
├─ 03 DO'S AND DON'TS (10개 규칙 Do/Don't 2컬럼)
└─ README (메타·3계층·Case B/W 브리지·footer)
```
- 각 프레임 헤더에 `Source: DESIGN.md § {섹션명}` 참조 명시
- 색상 hex·폰트명·간격 px 모두 원본과 1:1 복제
- `get_screenshot()`으로 Colors/Buttons/Elevation/Do's/README 시각 검증 완료

### Phase 2b — README 프레임
- 시스템 소개 + 메타 그리드 (Origin / License / Themes)
- 3계층 카드 (TOKENS / COMPONENTS / TEMPLATES — 원본에 템플릿 부재 명시)
- Bridge to Next Cases: Case B/W 연결 가이드 + 예시 프롬프트
- footer: 생성 하네스 버전 + 파일 경로

---

## 3. 3축 평가 (design-craft.md Case D)

### D1: 디자인 시스템 수집 충실도 — 28/35
- ✅ designmd search → download CLI 실제 호출
- ✅ DESIGN.md 원본을 `design/design-md/<slug>/` 에 보존
- ✅ 디자인 토큰 5섹션(Color/Typography/Spacing/Radius/Elevation) 식별·정리
- ✅ 컴포넌트 8종 + Do's/Don'ts 추출
- ✅ 메타(name/slug/tags/license/source URL) 기록
- ⚠️ 유사 레퍼런스 2개+ 비교 조사 미수행 (35 tier 블로커)

### D2: 프레임 단위 복제 정확도 — 30/35
- ✅ 인덱스 프레임 (시스템명/메타/원본 링크)
- ✅ TOKENS 5계층 분리 프레임
- ✅ COMPONENTS 8개 각각 독립 프레임
- ✅ 색상 hex / 폰트명 / 간격 px 원본과 일치
- ✅ 각 프레임에 `Source: DESIGN.md § {섹션명}` 참조 명시
- ✅ get_screenshot() 시각 검증 완료
- ⚠️ 35 tier ("템플릿이 컴포넌트 ref로 조립") 충족 불가 — 원본에 Templates 섹션 부재

### D3: 디자인 토큰 & 템플릿 재사용성 — 18/30
- ✅ 네이밍 규칙 일관 (Frame 이름 · Source 앵커)
- ✅ README 프레임 완결 (라이선스·Case B/W 브리지 가이드·Bridge Prompts 포함)
- ✅ 라이선스 고지 (MIT)
- ❌ **컴포넌트에 `reusable: true` 미지정** — Case B에서 ref 참조 불가, 시각 예시 수준
- ❌ 다크/라이트 변형 미지원 (원본이 light-only, 변형 파생 없음)
- ❌ 토큰 프레임과 컴포넌트 연결 규약 부재

---

## 4. 총점 & 판정

| 축 | 점수 | 만점 |
|---|-----|-----|
| D1 수집 충실도 | 28 | 35 |
| D2 프레임 단위 복제 | 30 | 35 |
| D3 재사용성 | 18 | 30 |
| **합계** | **76** | **100** |

**등급: B (60-79)**

### 강점
- 원본 DESIGN.md의 토큰/컴포넌트/규칙을 누락 없이 전부 이식
- 다크 히어로 인덱스 + 다크 README로 시스템의 "시작/끝" 프레임을 시각 랜드마크로 잡음
- 각 컴포넌트 프레임에 원본 스펙(padding/radius/hex) 근거 문구를 동봉 → Case W 시 CSS 매핑 즉시 가능
- 원본에 없는 Templates 섹션을 README에 "Case B로 파생" 브리지로 명시 → 단절 없이 다음 케이스로 연결

### 약점 (다음 Case D 실행 시 개선 포인트)
1. **컴포넌트 reusable 마크 누락** — Button/Card/Input 등은 `reusable: true`로 선언해야 Case B 템플릿에서 ref 조립 가능
2. **토큰 변수화 미도입** — `document.variables`에 `$color-navy`, `$radius-md` 등 토큰을 등록하면 컴포넌트와 향후 프로젝트에서 참조 가능
3. **유사 레퍼런스 비교 부재** — designmd에서 accessible/saas 태그의 다른 디자인 2건을 함께 조사했다면 D1 35점 달성 가능
4. **원본 없는 Templates의 파생** — README에 "예시 템플릿 파생"까지 .pen에 생성했다면 D2/D3 양쪽 상승 가능

---

## 5. RPG Recording

```
기본XP     = 76 × 10             = 760
등급배율(B) = ×3                  = 2,280
케이스배율(D) = ×1.2               = 2,736  ← 획득 XP
파이프라인  = 없음 (단독 Case D)
```

### 레벨 변화
```
이전: Lv.46  2,716 / 3,900  "숙련 디자이너"
부여: +2,736 XP
계산: 5,452 ≥ 3,900 → 레벨업!

새로: Lv.47  1,552 / 4,000  "숙련 디자이너"
총 획득 XP: 81,408
```

### 마일스톤
- 🎯 **첫 Case D 실행** — v2.6.0 신설 케이스의 1호 기록
- 🆙 **Lv.47 달성**

---

## 6. 파일 산출물

```
design/
├── design-md.pen                                    ← 신규 (15개 top-level 프레임)
└── design-md/
    └── verdana-health-design-system/
        └── DESIGN.md                                ← 원본 보존 (134 lines)
```

---

## 7. 다음 액션 제안

- **Case B 실행**: "design-md.pen의 Verdana Health로 telehealth 대시보드 디자인해줘" → D→B 파이프라인(×1.3)
- **Case W 실행**: "design-md.pen 참고해서 HTML 만들어줘" → D→W 파이프라인(×1.3)
- **D→B→W 완주** 시 ×1.5 파이프라인 보너스
- **개선판 Case D 재실행**: 위 약점 4종 반영하여 80+ A등급 목표
