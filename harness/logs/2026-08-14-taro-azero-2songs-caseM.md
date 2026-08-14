# Case M (Unity HDRP) — TARO/AZero 2곡 연속 실황 공연 (피아노+노래, 숄더뷰)

- **산출물**: `design/idola/renders/taro-azero-live-2songs.mp4` (1920×1080, 7:12=432s, h264+aac, 10,374f)
- **레퍼런스**: RADWIMPS "Sparkle"(etq-rWQOkz8) 실황 — 거의 암전 + 관객 폰라이트 바다 + 얕은 심도 보케 + 오버숄더 핸드헬드. `image/video-analysis/etq-rWQOkz8/overview.png` 로 어두움/구성 확정.

## 두 곡
1. **RUN — TARO** (1/2, 3:09) · 공연자 Remy(남) · `Assets/Scenes/SparkleStage.unity`
2. **반짝인 너와 나 — AZero** (2/2, 4:02) · 공연자 Claire=YUNA 베이스(여) · `Assets/Scenes/SparkleStage2.unity`

## 핵심 전환 (이미지 켄번즈 → 유니티 실황 재연)
사용자 지적: 켄번즈 슬라이드쇼는 정적·유니티 미사용. → **모델링 모드로 재구성**. 피아노 치며 노래하는 착석 공연자를 3D로 세우고 숄더뷰 동적 카메라로 실황 재연.

## 파이프라인
- **캐릭터/모션**: Remy(기존) + Mixamo "Piano Playing(Multiple Runs)" Without-Skin 다운로드(Playwright) → Humanoid 리타깃. YUNA는 기존 claire.fbx(YUNA 베이스) 재사용.
- **본 정밀 정렬**: `AnimationMode.SampleAnimationClip`으로 손·엉덩이 월드좌표 측정 → 그랜드피아노 건반/벤치를 손↔건반에 자동 정렬. 캐릭터 오버사이즈(머리 y2.66) → 머리높이 기준 자동 스케일(Remy 0.62, Claire 적응형).
- **리얼리티 스택(HDRP)**: **Fixed Exposure 크러시(EV 10.3)** — 자동노출 금지가 핵심(자동노출이 암전 씬을 밝게 끌어올려 룩이 망가짐). Depth of Field 보케 + 볼류메트릭 Fog(thin/dark) + Bloom + ACES + Vignette + Film Grain + Chromatic Aberration + Lens Distortion. 스포트 림/키 축소로 공연자 실루엣. 생성 피아노 래커 텍스처.
- **숄더뷰 카메라**(`PerfCam.cs`): 착석 피아니스트 뒤 어깨 너머 → 건반 위 손 → 관객 라이트-바다. 4샷 핸드헬드(Perlin 셰이크) + 루프.
- **캡처/먹싱**: PlayCapture(RUN 4553f, 반짝인 5821f @1080p) → 곡별 UI 먹싱(`scratchpad/build_song_ui.py`, malgun 폰트, 진행바 drawbox+t식, drawtext 제목/가수/1of2/총시간) → concat -c copy.

## 함정/교훈
- **자동노출**: Exposure 오버라이드가 프로파일에서 누락되면 HDRP 자동노출이 암전 씬을 밝게 만듦 → 반드시 Fixed Exposure 명시.
- **에디터 포그라운드 필수**: 백그라운드면 Play 캡처가 2f/130s로 스로틀. `WScript.Shell.AppActivate(pid)`가 SetForegroundWindow보다 확실.
- **drawtext 이스케이프**: 폰트 경로 `C:` 콜론 → 폰트를 작업폴더로 복사해 상대경로 참조로 회피. 라이브 타임코드(`%{pts...}`)는 취약 → 총시간 정적 표기로 단순화.

## v2 — 스파클 스펙터클 개편 (레퍼런스 구간 재분석 후)
사용자 피드백: 무대·관객이 멀고 애니/파티클 부재, 어두움 부족. etq 영상을 구간별 재몽타주(intro 24-54s / piano 118-148s / finale 358-388s)로 해석:
- **핵심 장치 발견**: 피날레의 **수직 스파크 커튼**(하늘에서 떨어지는 별) + 관객이 무대에 밀착 + 거의 무광원 실루엣.
- **신규 컴포넌트**: `FallingSparks.cs`(낙하 스파클 1300, HDR 6.5 — 씬의 사실상 유일 광원), `CrowdSilhouette.cs`(밀착 관객 실루엣 900 + 폰라이트 웨이브/스웨이 = 관객 호흡), LightSea 9000점 보울형 + 스웨이, LED 기둥.
- **블랙아웃**: 스포트 1.6-2.6k lm 속삭임, BackFill off, EV 10.9, void fog. 카메라 6샷 스펙터클(연주자는 잠깐).
- **곡 순서 스왑**: 1/2 반짝인 너와 나—AZero(YUNA), 2/2 RUN—TARO(Remy).
- **최종**: `design/idola/renders/azero-taro-live-2songs.mp4` (7:12, 705MB — **대용량 산출물은 커밋 제외, 별도 관리**).
- 검토 워크플로: PlayCapture disable → 사용자가 에디터 ▶로 실시간 검토 → 확정 후 캡처 재무장(프리뷰 렌더 반복보다 효율적). 주의: Play 중 RunCommand 변경은 씬에 저장 안 됨(정지 후 재적용 필요).

## SE~SE3 에디션 (2026-08-15)
- **SE**: 칠흑 배경(camera black clear + Fog ConstantColor — SkyColor 모드가 하늘색 wash 원인) + 검정 바닥 + **암전 인트로**(IntroDirector: 기둥 점등→림 실루엣→관객 호흡→별비). VolumeProfile 소실 함정 → 전 컴포넌트 일괄 생성한 SparklePostSE.asset. 카메라 12샷/104s(드론·오빗·에어리얼·관객POV). `EditorPrefs InteractionMode=1`(No Throttling)로 무포커스 렌더 확립(외부 .cs 수정 후 Refresh 필수).
- **SE2**: 곡 교체 — 1/2 별빛이 머문 자리(TARO·남성 피아노), 2/2 반짝인 너와 나(AZero). 피아니스트 착석 교정(뒤로+축소+본 재정렬). 반짝인 = **4인 YUNA(Y/U/N/A 리컬러) + 백댄서 6인 댄스**(WaveHipHop↔HipHopDancing 32s 교대, DanceCycle.cs), 백라이트 강화.
- **SE3**: **반응 피아노 건반**(PianoKeys.cs — 개별 키 30개, 손가락 본 근접시 눌림/틸트), 댄스 전용 카메라(PerfCam.dance) + **바닥 조명 5기**, **얼굴 깨짐 수정**(Brows/Eyes/Mouth 메시는 FacialAnimMap+알파클립 전용 — 몸통 디퓨즈 금지), **사이버틱 백댄서**(화이트 바디+네온 밴드 6색), **HDR 출력**(단일 zscale bt709→HLG/BT.2020 직접 변환 → libx265 10bit; linear 경유 체인은 zimg "no path" 실패).
- 산출물(커밋 제외): `taro-azero-live-2songs-se3-hdr.mp4`(HDR, 8:22, 143MB) + SDR 호환본.

## 확장 여지
- 스파클 색 배리에이션(청백/금) 및 곡 클라이맥스 동기화
- 네온 밴드 색 시퀀스 애니메이션(비트 동기 점멸)
- 리드 4인 개별 안무 파트 분배
