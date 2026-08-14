# Sparkle HDRP Stage (Case M — Unity HDRP)

RADWIMPS "Sparkle"(etq-rWQOkz8) 레퍼런스 기반 **인물 없는 실사 지향 무대**.
피아노·마이크·기타가 스포트라이트를 받고, 관객 폰라이트가 빛의 바다처럼 뒤를 채우는 연출.

- **엔진**: Unity 6.2 (6000.5.7f1), **HDRP 17.5.0** — 별도 프로젝트 `G:\Unity\Projects\SparkleHDRP`
  (URP 프로젝트 `My project`와 파이프라인이 달라 신규 프로젝트로 분리)
- **씬**: `Assets/Scenes/SparkleStage.unity` · 포스트 프로파일 `Assets/Sparkle/SparklePost.asset`
- **산출물**: `design/idola/renders/sparkle-stage-hdrp.mp4` (1920×1080, 66s, 24fps, 무음)

## 스크립트 (이 폴더 = 저장소 백업본)
- `LightSea.cs` — HDR 폰라이트 3200점. HDRP/Unlit + `_UnlitColor`>1(additive)로 Bloom 발광, 트윙클, 카메라 빌보드. PerfClock 결정론.
- `SparkleCameraDirector.cs` — 66초 8샷 시네마틱 투어(establishing→피아노 push→바닥 반사 글라이드→기타 크레인→와이드 빔→마이크 인티메이트→반사 돌리→상승 크레인 피날레).
- `PlayCapture.cs` / `PerfClock.cs` — Play 모드 결정론 캡처(`Time.captureFramerate` + Main Camera→RenderTexture→JPG, 프레임 도달 시 자동 종료).

## 씬 구성(핵심 수치)
- **바닥**: HDRP/Lit, smoothness 0.965 / metallic 0.6 (젖은 무대 반사)
- **악기**: 프리미티브 조합 — 광택 블랙 래커 피아노(건반 하이라이트), 빨간 기타(스탠드), 메탈 마이크 스탠드
- **조명**: Spot 3개(피아노/기타 95k lm, 마이크 110k lm) + 볼류메트릭(dimmer 2.2), 약한 백필 디렉셔널 0.12 lux
- **포스트**: Exposure Fixed EV 7.0 · Fog 볼류메트릭 meanFreePath 18 · Bloom 0.5 · Tonemap ACES · Vignette 0.44 · FilmGrain 0.22 · ColorAdj(contrast 12) · **MotionBlur 0(하드 컷 스미어 방지)**
- **리플렉션 프로브**: Realtime **OnAwake 1회 굽기**, res 128 (매프레임 프로브는 ~7.5s/frame로 과중 → 1회 굽기로 ~19 frame/s)

## 재현 메모
- 씬 빌드는 Unity MCP `Unity_RunCommand`(IRunCommand)로 절차적 생성. HDRP 머티리얼은 `HDMaterial.ValidateMaterial()`로 키워드/블렌드 확정.
- `LightUnit`은 Unity 6에서 코어로 이동 → `UnityEngine.Rendering.LightUnit`.
- **렌더 시 Unity 에디터 창을 포그라운드로 유지**해야 함(백그라운드면 Play 루프 스로틀 → 2 frame/130s).
