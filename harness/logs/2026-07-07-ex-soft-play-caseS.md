# 2026-07-07 — output_ex play 액션 소프트 리메이크 22종 (Case S 리워크)

**Case S (스프라이트 리워크)** · 조정 프롬프트 신규 스크립트 · **idle 프레임 앵커 방식** · 95/100 A

---

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| 트리거 | `"idle은 그대로, play가 너무 과격 — idle에서 자연스럽게 이어지는 살짝 퍼포먼스로 개선. 파일럿 1종 → 차이 파악 → 배치"` |
| 문제 진단 | 기존 play: 스포트라이트 콘 + 음표 버스트 + 급격한 포즈(주먹/점프) + 머리색 드리프트 → idle과 이음매 단절 |
| 정량 근거 | elec-guitar 기준 idle 내부 IoU 0.998 vs idle→play 이음매 0.650 (실루엣 35% 점프) |
| 접근 | **조정 프롬프트 신규 스크립트** (`tmp/gen_ex_play_soft.py`, gen_ex_batch.py 파생) — 컨셉 대신 **idle raw 프레임을 프레임별 참조** (idle-fN → play-fN) |
| 파일럿 | elec-guitar 1종 → 이음매 0.650→0.993 확인 → 사용자 승인 후 21종 배치 |
| 생성 | Gemini edit 22종 × 4프레임 = 88 + 누락 보충 2 + fix-pass 3 ≈ **93 호출** (에러 0, 그리드 결함 0) |
| 산출 | `output_ex/{slug}/play.{png,json}` 22종 교체 + `_master/orchestra-master.png` 재조립 (index.json 불변) |
| 평가 | **95/100 A** (S1 33 / S2 32 / S3 30) |
| RPG | +5,700 XP (Lv.64 유지, 7,654/8,500) |

## 2. 조정 프롬프트 핵심 (기존 대비)

1. **참조 앵커 교체**: 컨셉 이미지 → 해당 캐릭터 idle raw 프레임 (프레임별 1:1 매핑) — 포즈/스케일/정체성 연속성 확보
2. **soft_act**: 과격한 active_act("slamming/explosive/thunderous") → idle_act보다 한 단계만 올린 표현("a bit more energetically, small head-bob")
3. **금지어 명시**: NO spotlight cone / NO sparkle burst / NO dramatic pose change / NO raised fist / no color shift
4. **이펙트 상한**: 음표 최대 2개(작게), 글로우 '살짝 밝게'까지
5. **duration 조정**: play 110ms → 140ms (idle 150ms에 근접, 완만한 체감)

## 3. 결과 지표 (22종 평균)

| 지표 | 구 play | soft play |
|------|--------|-----------|
| idle-f3→play-f0 이음매 IoU | 0.780 | **0.970** |
| play 내부 인접 IoU | 0.711 | **0.914** |
| 이음매 ≥0.90 달성 | 6/22 | **21/22** |

- 정렬 보정: violin(+6px 시프트, 0.811→0.980), trombone(-5px, 0.835→0.962) — 후처리 오토센터링 오프셋 교정 (`tmp/align_soft2/3.py`)
- **drum 0.750 잔여**: 드럼킷 렌더 편차(스틱/심벌 실루엣)가 원인, 캐릭터 자체는 정렬됨. 재생성 2회·스케일+시프트 탐색 모두 0.82 한계 → 수용하고 기록

## 4. 핵심 발견

1. **idle 프레임 앵커가 컨셉 앵커보다 연속성에 압도적**: 같은 스탠스 유지 지시 + idle-fN 입력만으로 이음매 +0.19 평균 개선
2. **잔여 이음매 갭의 주범은 후처리 오토센터링**: 악기 돌출부(활/슬라이드/스틱)가 bbox를 바꿔 중심이 수 px 밀림 — 시트 전 프레임 동일 시프트 정렬로 교정 가능 (내부 연속성 보존)
3. **그리드 결함 0**: 앤티그리드 문구 상시 포함 시 88프레임 결함 0 (기존 ~9% 대비) — 상시 포함이 정답
4. **IoU는 정당한 모션도 벌점**: trombone 슬라이드·violin 활은 큰 실루엣 변화가 정상 — 이음매(f3→f0)와 내부 연속성을 분리 측정해야 오판 없음

## 5. 산출물 경로

```
image/sprite/raw_ex_soft/{slug}/*.png           # soft play raw 88장
design/sprite/output_ex/{slug}/play.{png,json}  # 교체된 최종 시트 (idle 불변)
design/sprite/output_ex/_master/                # 재조립 마스터 (레이아웃 동일: 행별 idle-f0|play-f0)
tmp/gen_ex_play_soft.py                         # 조정 프롬프트 배치 (재개 가능)
tmp/post_ex_soft.py, align_soft2/3.py           # 후처리 + 정렬 보정
tmp/compare_idle_play.py, summary_soft.py       # 연속성 정량 측정
tmp/soft-compare/gifs/{slug}.gif                # 검수용 idle→play 루프 GIF 22종
```

## 6. 다음 단계 제안

- **drum 이음매**: 킷 고정 참조(악기만 따로 크롭 참조) 또는 idle 킷 합성 방식으로 0.9+ 도전
- **S→W**: sample14/16 계열 데모에서 soft play 반영 확인 (idle↔play 전환 체감 검증)
- **vocal 시리즈 동일 적용**: output_ex_vocal 12종도 같은 리워크 후보 (사용자 검수 후 결정)
