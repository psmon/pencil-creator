# 2026-07-08 — output_ex_vocal 순수 보컬 4종 play 소프트 리메이크 (Case S 리워크)

**Case S (스프라이트 리워크)** · 전일 output_ex 소프트 리메이크의 보컬 확장 · **vocal-1~4만, vocal-ex/vox7 제외(사용자 지정)** · 96/100 A

---

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| 트리거 | `"output_ex_vocal도 동일하게 소프트 개선 — 순수 보컬 vocal-*만, 너무 과격하게 부르는 것을 idle에서 자연스럽게. vox*는 댄스모드 그대로"` |
| 대상 판정 | vocal-1~4 (이음매 0.652~0.831 — 리워크 필요) / **vocal-ex 제외**: 실가수 동작분석 기반 idle6+play8, 이음매 0.876으로 이미 연속적 + 파이프라인 상이 / vox7 제외(사용자 지정) |
| 접근 | 전일 조정 프롬프트 스크립트(`tmp/gen_ex_play_soft.py`)에 보컬 4종 soft_act 추가 — belting/diva/theatrical → "slightly more heartfelt/fuller/expressive/richer" |
| 생성 | Gemini edit 4종 × 4프레임 + fix-pass 1 = **17 호출** (idle raw 프레임별 앵커) |
| Fix-pass | vocal-1 play-f2: 핸드마이크→스탠드 마이크 변형 + 드레스 색 드리프트 검출 → 재생성으로 해소 |
| 정렬 보정 | vocal-1 +2px (0.927→0.980) |
| 산출 | `output_ex_vocal/vocal-{1..4}/play.{png,json}` 교체 + 마스터 play 셀(2열) 4개만 갱신 (vocal-ex/vox7 행 불변, index.json 불변) |
| 평가 | **96/100 A** (S1 33 / S2 33 / S3 30) |
| RPG | +5,760 XP → **Lv.64 → Lv.65** (4,914/8,800) |

## 2. 결과 지표

| slug | 이음매(구→신) | play 내부(구→신) |
|------|--------------|-----------------|
| vocal-1 | 0.718 → **0.980** | 0.736 → 0.885 |
| vocal-2 | 0.701 → **0.965** | 0.663 → 0.837 |
| vocal-3 | 0.831 → **0.977** | 0.769 → 0.907 |
| vocal-4 | 0.652 → **0.991** | 0.709 → 0.869 |
| **평균** | 0.726 → **0.978** | 0.719 → 0.875 |

- 4종 전원 이음매 ≥0.90 (기준 통과), 과격 요소(mic 치켜들기·팔 휘두름·코트/케이프 플레어) 제거
- 마이크 유형 보존: vocal-1 핸드마이크, vocal-2~4 스탠드 마이크

## 3. 핵심 발견

1. **소프트 리워크 파이프라인 재사용성 검증**: 전일 output_ex 스크립트에 SOFT 엔트리 4개 추가만으로 보컬 확장 완료 — 조정 프롬프트 패턴이 악기/보컬 무관하게 동작
2. **보컬 고유 결함 유형**: 마이크 유형 변형(핸드↔스탠드) — 악기 캐릭터의 격자 결함과 다른 검수 포인트. desc에 마이크 유형 명시가 예방책
3. **대상 선별의 가치**: vocal-ex는 측정 결과 이미 연속적(0.876)이라 제외 — 지표 측정을 먼저 하면 불필요한 재생성 비용을 아낌

## 4. 산출물 경로

```
image/sprite/raw_ex_soft/vocal-{1..4}/*.png       # soft play raw 17장
design/sprite/output_ex_vocal/vocal-{1..4}/play.* # 교체된 최종 시트 (idle 불변)
design/sprite/output_ex_vocal/_master/            # play 셀만 갱신된 마스터
tmp/soft-compare/gifs/vocal-{1..4}.gif            # 검수용 idle→play 루프 GIF
```

## 5. 다음 단계 제안

- **S→W**: sample15/16 계열 데모에서 soft play 반영 확인 (63캐릭터 통합 씬)
- **drum 이음매 재도전**: output_ex 잔여 1종 (0.750) — 킷 고정 참조 방식
