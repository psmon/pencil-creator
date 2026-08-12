---
name: unity3d-flow
scope: case-M
since: v2.12.0
triggers:
  - "유니티로 아이돌 공연 만들어"
  - "unity로 캐릭터 춤 영상"
  - "믹사모 캐릭터로 그룹댄스"
  - "unity 무대 연출 영상"
  - "unity performance video"
---

# Unity3D → 실시간 아이돌 공연 플로우 (Case M — Unity 백엔드)

> **원칙: Play 모드 실시간 렌더가 최종이다.** 캐릭터·리그·안무·무대·카메라를 Unity(URP)에서
> 확정하고, 최종 영상은 **Play 모드의 실제 Animator 모션을 프레임 캡처**해서 만든다.
> Blender 백엔드(`blend3d-web-flow`)의 Unity 대안 — 실시간 엔진이라 리타겟·연출·영상화가 빠르다.

⚠️ **전제**: Unity Editor가 대상 프로젝트를 연 상태 + Unity MCP 브리지 활성
(`~/.unity/relay/relay_win.exe --mcp --project-path ...`). URP + Cinemachine + Input System 권장.

## 파이프라인 (6단계)

```
① 캐릭터 (Mixamo 휴머노이드 베이스)
   - Playwright로 mixamo.com 로그인 → Character 선택 → FBX for Unity / T-pose 다운로드
   - 프로젝트로 복사 → ModelImporter animationType=Humanoid (아바타 자동)
   - ⚠️ FBX 임베디드 텍스처는 ExtractTextures + 머티리얼 ExtractAsset (안 하면 흰색)
   - 얼굴 데칼(눈/눈썹/입)은 URP/Lit 알파클립(_AlphaClip, _ALPHATEST_ON, 큐 2450)
   - 멤버 차별화 = 디퓨즈 아틀라스 HSV 리컬러(PIL): 순수색만 마스크(피부 오렌지 제외)

② 개인기 (공통 스킬 풀)
   - Mixamo Animations → Without Skin / FBX for Unity → Humanoid 임포트 + loopTime
   - Mecanim 휴머노이드가 자동 리타겟 (Blender 리타겟 뒤집힘 지옥 없음)
   - 전 멤버가 같은 컨트롤러(전환 없는 N-스테이트) 공유 → 디렉터가 CrossFade로 제어

③ 그룹 안무 (음악 동기 디렉터)
   - 음악 구간 분석: soundfile+numpy로 BPM·비트·에너지 섹션·고조 도출
   - ChoreoDirector: 세그먼트 스케줄(유니즌 ~20% + 고조마다 멤버 스포트라이트 로테이션)
   - 포메이션 간 곡선 아크 동선(perp*sin), 비-스포트라이트는 배경무브+위상차

④ 무대 (프로시저럴 + URP Post)
   - 콘/문/풍선/쿠키/스프링클 프로시저럴, 그라데이션 스카이돔(Unlit cull off)
   - MoonController: 달 우→좌 아크 이동 + 곡 중반 실루엣 이벤트(예: E.T. 패러디)
   - 조명(웜키+핑크필+파스텔앰비언트) + URP Volume(Bloom·ColorAdjustments·Vignette)

⑤ 카메라 컷 (방송 연출)
   - CameraDirector: 음악 동기 하드컷 편집(드론·돌리·스포트라이트 푸시인·히어로·크레인)
   - ⚠️ 근접 프레이밍 필수 — 멀면 잔잔한 안무가 정지처럼 보인다

⑥ 영상 렌더 (Play 모드 결정적 캡처)  ★핵심
   - ❌ 오프라인 AnimationMode.SampleAnimationClip + 오프스크린 cam.Render()는 금지:
        스킨드 메시가 프레임마다 안 구워져 캐릭터가 정지로 찍힘.
   - ❌ Unity Recorder 5.1.2는 Unity 6.2와 비호환(GetInstanceID obsolete-error, 전체 컴파일 차단).
   - ✅ PlayCapture: Time.captureFramerate=fps로 실제 Animator를 1/fps씩 진행,
        LateUpdate에서 Main Camera→RenderTexture→JPG. 시간축은 PerfClock.T(공유 static)로
        디렉터 3종을 구동. 오디오는 mute하고 ffmpeg로 원본 mux(결정적이라 완벽 싱크).
   - ffmpeg: -framerate fps -i frame_%05d.jpg -i song -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest
```

## 산출물 체크리스트

- [ ] Mixamo 베이스 FBX + 멤버 리컬러 텍스처 (Unity 프로젝트 `Assets/YUNA/`)
- [ ] 개인기 클립 라이브러리 + 전환없는 공통 컨트롤러
- [ ] ChoreoDirector / MoonController / CameraDirector (음악 동기, `PerfClock` 대응)
- [ ] 프로시저럴 무대 + URP Post 볼륨
- [ ] **최종 영상** `design/idola/renders/{name}.mp4` (Play 캡처 + 음악)

## 함정 모음 (검증된 교훈)

| 증상 | 원인 | 해결 |
|------|------|------|
| 영상에서 캐릭터 정지 | 오프라인 샘플 렌더가 스킨드메시 미갱신 | **PlayCapture** 방식으로 |
| 캐릭터 흰색 | FBX 임베디드 텍스처 미추출 | ExtractTextures + 머티리얼 ExtractAsset |
| 얼굴에 검은 띠 | 얼굴 데칼 불투명 | URP/Lit 알파클립 |
| 리컬러 시 피부까지 변색 | 마스크가 오렌지(피부) 포함 | 순수색 hue만 좁게 마스크 |
| Recorder 컴파일 에러 | Recorder 5.1.2 ↔ Unity 6.2 비호환 | 제거 후 PlayCapture 자작 |
| 파티클 Simulate 에러 도배 | velocity 3축 모드 불일치 | 3축 동일 모드 또는 모듈 비활성 |
| Play 전환 직후 SaveScene 실패 | "cannot be used during play mode" | IsPlaying 확인 후 실행 |
| RunCommand `Mesh` 충돌 | 네임스페이스 모호 | `UnityEngine.Mesh` 명시 |

## 평가

3축 평가 기준: [../knowledge/unity3d-craft.md](../knowledge/unity3d-craft.md)
