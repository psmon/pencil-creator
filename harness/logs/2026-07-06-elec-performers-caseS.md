# 2026-07-06 — 일렉+클래식 연주자 22종 output_ex 시리즈 (Case S)

**Case S (Concept Art → Sprite Sheet)** · GPT 컨셉 + Gemini 프레임 병행 하이브리드 · **일렉 신규 7종 + 클래식 재개선 15종 동시 영입** · 전원 93/A 균일 품질

---

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| 트리거 | `"일렉시리즈 악기를 추가 — EDM/락 커버 연주자 확보 + 기존 연주자 퀄리티 재개선, 산출물 분리(output_ex)"` |
| 방향 수정 | 1차 악기 단독 스프라이트로 진행 → 사용자 피드백으로 **연주자(캐릭터+악기)** 로 피벗 (악기 단독 산출물은 `*_items`로 보관) |
| 액션 정의 | **idle = 연주 대기상태(멈춤이 아닌 노멀 연주 루프)** / **play = 연주 활성상태(스포트라이트 역동 연주)** — 사용자 지정 |
| 캐릭터 | 일렉 7종: elec-guitar, elec-bass, keytar, synth, dj-deck, drum-machine, edrum + 클래식 15종 재개선 |
| 생성 | 캐릭터당 GPT(gpt-image-2) 컨셉 1장(참조 크롭 edit) + Gemini edit 프레임 8장(idle4+play4) = 22×9 ≈ **198 호출** |
| 후처리 | 캐릭터별 48색 적응 팔레트(v2.9.1 패턴) + HSV 그린키 + 192×192 |
| 산출 | `design/sprite/output_ex/{slug}/{idle,play}.{png,json}` + `_master/orchestra-master.png` + `index.json`(group 메타 포함) |
| 평가 | **22종 전원 93/100 · A** (S1 35 / S2 28 / S3 30, 드리프트 0.0, 그린 잔여 0px) — 균일 품질 달성 |
| RPG | +5,580 XP → **Lv.62 → Lv.63** |

## 2. 로스터

| 그룹 | slug | 컨셉 포인트 |
|------|------|------------|
| 일렉 | elec-guitar | 락 기타리스트 — 가죽 재킷 + 네온 시안 일렉기타 (파일럿) |
| 일렉 | elec-bass | 장발 베이시스트 — 네온 마젠타 베이스 |
| 일렉 | keytar | 투톤 헤어 — 네온 키 키타 |
| 일렉 | synth | 후드 — 시안/퍼플 신디사이저 (X스탠드) |
| 일렉 | dj-deck | 헤드폰 DJ — 듀얼 턴테이블 + 믹서 |
| 일렉 | drum-machine | 비니 비트메이커 — 4×4 네온 패드 |
| 일렉 | edrum | 포니테일 드러머 — 육각 패드 전자드럼 |
| 클래식 | piano~harp 15종 | 기존 악단 연주자 클린 재드로잉 (동일 의상·헤어·악기, 디테일 품질 상향) |

## 3. Phase별 요약

- **Gather**: 기존 패턴 분석(vox7 105호출 배치·itzy 컨셉 reference 고정·per-character 팔레트). 참조 소스: 클래식=원본 크롭(`crops/{slug}.png`), 일렉=근접 악기 크롭 스타일 참조.
- **Pilot**: elec-guitar 풀 스코프 → 85/A(마스터 조립 전) 게이트 통과. play-f0 썸네일 격자 결함 → 프레임 단위 재생성으로 복구.
- **Batch**: 21종 백그라운드 배치(재개 가능 skip-exists 드라이버 `tmp/gen_ex_batch.py`). 에러 0, 프레임 누락 6장 → 재실행 자동 보충.
- **Fix-pass**: 22종 콘택트 몽타주(idle/play) 시각 검수 → **썸네일 격자 15프레임 + piano 악기 불일치(업라이트↔그랜드) 검출** → 삭제 후 재생성. 재발 3프레임은 앤티그리드 강화 프롬프트("exactly ONE character, NOT a sprite sheet/grid/panels")로 해소.
- **Post/Assemble**: 22종 후처리 → `_master` 조립(22행×2액션) → index.json group(elec/classic) 메타 보강.
- **Verify**: 22종 전원 93/A (S3는 _master 조립 후 22→30 만점 회복).

## 4. 핵심 발견

1. **GPT 컨셉 + Gemini 프레임 하이브리드**: gpt-image-2가 참조 크롭에서 정체성 있는 컨셉을 만들고,
   Gemini가 컨셉 reference로 프레임 변형을 빠르게 생산 — 비용/품질 균형이 좋다.
2. **썸네일 격자는 Gemini edit의 최빈 결함 (~9%)**: 176프레임 중 15장이 미니 스프라이트 시트로 생성.
   콘택트 몽타주 검수가 필수이며, 재발 시 "exactly ONE character, NOT a sprite sheet" 강조로 해결.
3. **연주 대기 ≠ 정지**: idle을 "still performing (never frozen)"으로 명시해야 멈춘 포즈가 아닌
   노멀 연주 루프가 나온다. play는 스포트라이트 콘 연출이 프레임에 자연스럽게 박힌다.
4. **piano 컨셉 드리프트**: 원본 크롭(업라이트)과 컨셉(그랜드) 불일치 시 프레임이 혼재 —
   컨셉 확정 후 desc도 컨셉 기준으로 동기화해야 한다.

## 5. 산출물 경로

```
image/sprite/concepts_ex/{slug}.png            # GPT 컨셉 22장
image/sprite/raw_ex/{slug}/*.png               # Gemini raw 176장 (슬러그별 분리)
image/sprite/ex-palettes/{slug}.json           # 캐릭터별 48색 팔레트
design/sprite/output_ex/{slug}/{idle,play}.*   # 최종 시트+Aseprite JSON
design/sprite/output_ex/_master/               # orchestra-master.png + index.json (group 메타)
design/sprite/output_ex_items/                 # (보관) 1차 악기 단독 파일럿
tmp/gen_ex_batch.py, tmp/post_instx.py         # 재개 가능 드라이버
```

## 6. 다음 단계 제안

- **신규 개선 악단**: 클래식 연주자 신규 디자인 버전 (사용자 지정: 다음 작업, 댄스단 제외)
- **S→W**: output_ex 통합 밴드 플레이어 데모 (sample17) — elec/classic 그룹 전환, S→W ×1.3 보너스
- **S2 보강**: 루프 이음매 SSIM 측정으로 28→만점 여지
