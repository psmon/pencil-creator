# 2026-07-06 — 보컬 분리 시리즈 output_ex_vocal (Case S)

**Case S (Concept Art → Sprite Sheet)** · vocal-1~4 리마스터(GPT+Gemini 하이브리드) + vocal-ex/vox7 복사 통합 · **연주자/보컬 분리 관리 체계 확립**

---

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| 트리거 | `"vocal-1,2,3 등 구품질 보컬만 방금 개선기법으로 개선, ex붙은 것은 복사 — output_ex_vocal로 보컬 분리 관리"` |
| 리마스터 | vocal-1~4 (2026-06-06 1차 배치 구품질분) — 동일 정체성 유지 클린 재드로잉 |
| 복사 | vocal-ex(idle/play) + vox7-1~7(idle/dance) — 이미 93/A 품질이라 무가공 복사 |
| 액션 | idle = 연주 대기(노멀 싱잉 루프) / play = 연주 활성(스포트라이트 역동 싱잉) |
| 생성 | 4인 × (GPT 컨셉 1 + Gemini 프레임 8) = 36 호출 + 누락 보충 3 + fix 2 |
| 산출 | `design/sprite/output_ex_vocal/` 12캐릭터 + `_master/`(idle/play/dance 3액션, group 메타) |
| 평가 | **리마스터 4인 전원 93/100 · A** (S1 35 / S2 28 / S3 30, 드리프트 0, 그린 0px) |
| RPG | +5,580 XP → **Lv.63 → Lv.64** |

## 2. 리마스터 정체성 (원본 크롭 유지)

| slug | 정체성 |
|------|--------|
| vocal-1 | 금발 롱웨이브 + 화이트 베레 + 청백 프릴 드레스, 핸드마이크 |
| vocal-2 | 흑발 소년 + 다크레드/블랙 롱코트, 스탠드 마이크 |
| vocal-3 | 핑크 롱헤어 + 레드 로즈 + 레드 프릴 드레스, 스탠드 마이크 |
| vocal-4 | 은발 소년 + 다크퍼플 코트/케이프, 스탠드 마이크 |

## 3. Phase별 요약

- **Copy**: vocal-ex + vox7-1~7 시트/JSON을 output → output_ex_vocal 무가공 복사 (8캐릭터).
- **Generate**: vocal-1~4 하이브리드 생성. 프레임 누락 3장 → skip-exists 재실행 보충.
- **Fix-pass**: 몽타주 검수 → vocal-2 play-f3 썸네일 격자 + play-f0 흑발→갈색 드리프트 검출
  → 앤티그리드 + "pure BLACK hair" 강화 프롬프트로 재생성.
- **Assemble**: 12캐릭터 × 3액션(idle/play/dance) 마스터 — 액션 없는 셀은 자동 스킵
  (vox7=idle/dance, 나머지=idle/play).
- **Verify**: 리마스터 4인 전원 93/A.

## 4. 핵심 발견

1. **혼합 액션 마스터**: assemble의 missing-sheet skip 동작으로 idle/play(보컬·연주자)와
   idle/dance(vox7)를 한 마스터에 3액션 컬럼으로 통합 가능.
2. **헤어 컬러 드리프트**: 다크 계열 헤어는 스포트라이트 연출 프레임에서 갈색/회색으로 밀리기 쉬움 —
   재생성 시 "pure BLACK hair" 명시로 고정.
3. **관리 분리 완성**: output_ex(연주자 22) / output_ex_vocal(보컬 12) / output(레거시 통합)
   — 시리즈별 _master 단일 진입점 확보.

## 5. 산출물 경로

```
design/sprite/output_ex_vocal/vocal-{1..4}/    # 리마스터 (idle/play)
design/sprite/output_ex_vocal/vocal-ex/        # 복사 (idle/play + preview.html)
design/sprite/output_ex_vocal/vox7-{1..7}/     # 복사 (idle/dance)
design/sprite/output_ex_vocal/_master/         # 12행×3액션 마스터 + group index.json
image/sprite/concepts_ex/vocal-{1..4}.png      # GPT 컨셉
image/sprite/raw_ex/vocal-{1..4}/              # Gemini raw 32장
image/sprite/ex-palettes/vocal-{1..4}.json     # 48색 팔레트
image/sprite/character-boxes-exvocal.json      # 마스터 조립 정의
```

## 6. 다음 단계 제안

- S→W: output_ex(연주자) + output_ex_vocal(보컬) 통합 밴드 스테이지 데모 (sample17)
- 구 output의 vocal-1~4·15연주자는 레거시 유지 (신규 참조는 ex 시리즈 사용)
