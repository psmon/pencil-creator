# 파이프라인: 텍스트 → 3D 모델링 → 렌더 → Unity 리깅 → 댄스

Case M 확장 — 이미지 생성부터 Unity 실시간 댄스까지 검증된 end-to-end 파이프라인 (2026-08-16, AMD Strix Halo 로컬).

```
① 텍스트 → 참조 이미지 (Gemini image-gen)
② 이미지 → 3D PBR GLB (Hunyuan3D, WSL2 Docker ROCm)
③ GLB → 툰 렌더 (Blender 5.1, 셀 셰이딩 + Freestyle)      ← 산출물 A: 렌더 PNG
④ GLB → 리그드 FBX (Blender 자동 리깅)
⑤ FBX → Unity(HDRP) 임포트 + Humanoid + 댄스 리타깃        ← 산출물 B: 춤추는 실시간 캐릭터
```

전체 배경/함정은 메모리 `hunyuan3d-local-rocm.md` 참조. 이 문서는 각 단계 실행 요약.

---

## ① 텍스트 → 참조 이미지

3D 재구축엔 **단일 오브젝트·정면 전신·단색 배경·깔끔한 실루엣**이 최적.

```powershell
py -3.14 .claude/skills/pencil-design/scripts/image-gen.py generate `
  --prompt "cute chibi kawaii idol star, full body, front view, standing A-pose, cel-shaded toon, pastel, big eyes, twin-tail hair, plain white background, character reference sheet" `
  --topic "idol-star-toon" --provider gemini --aspect-ratio "3:4"
# → image/gemini/{date}-idol-star-toon.png (JSON으로 경로 반환)
```

---

## ② 이미지 → 3D PBR (Hunyuan3D, WSL2 Docker)

네이티브 Windows는 custom_rasterizer HIP 빌드 불가 → **Docker(Linux ROCm)** 사용. SKILL.md의 Docker 모드 참조.

```powershell
$run = ".claude/skills/hunyuan3d-local/scripts/docker.ps1"
pwsh -File $run build                                    # 최초 1회 (이미지 빌드)
pwsh -File $run gen --image <ref.png> --out out.glb       # PBR 3D (형상+텍스처)
pwsh -File $run gen --image <ref.png> --out out.glb --skip-paint   # 형상만(빠름)
```
결과: `out.glb` (2048² baseColor PBR 텍스처, ~40K face 게임레디, UV 有). 가중치·custom_rasterizer 캐시됨(2회차부터 빠름).

**gfx1151 GPU 관문(전부 우회 코드 반영됨)**: custom_rasterizer(.so.7 호스트빌드) · MIOpen conv(`MIOPEN_FIND_MODE=2`+native폴백) · SDPA(`TORCH_ROCM_AOTRITON_ENABLE_EXPERIMENTAL=1`+math폴백) · bpy(→trimesh) · paint output은 반드시 `.obj`로.

---

## ③ GLB → 툰 렌더 (Blender 5.1 헤드리스)

스크립트: `C:\Users\psmon\infra\blender\toon_idol.py` (blend3d 스킬 규약). 핵심:
- **셀 셰이딩**: `Diffuse BSDF → ShaderToRGB → ColorRamp(CONSTANT 3밴드) × baseColor Tex → Emission` (EEVEE 전용 ShaderToRGB).
- **외곽선**: Freestyle 활성 + 검은 라인. ⚠️ `lineset.linestyle`가 None일 수 있어 `bpy.data.linestyles.new()` 명시 할당.
- 카메라 정면/3-4 뷰, 스무스 셰이딩, 카메라 활성화(`scene.camera=cam`).

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" -b --factory-startup -P "C:\Users\psmon\infra\blender\toon_idol.py"
# → design/blend/out/idol-toon-front.png, idol-toon-34.png
```

---

## ④ GLB → 리그드 FBX (Blender 자동 리깅)

스크립트: `C:\Users\psmon\infra\blender\rig_idol.py`. 핵심:
- 바운딩박스 기반 **휴머노이드 아마추어**(Hips/Spine/Chest/Neck/Head/Left·RightShoulder·UpperArm·LowerArm·Hand·UpperLeg·LowerLeg·Foot — Unity가 이름으로 humanoid 매핑). 치비 비율(다리 짧고 머리 큼)에 맞춰 z 비율 배치.
- ⚠️ **heat weighting(`parent_set ARMATURE_AUTO`)은 이 메시(납작 시트+비정형)에서 실패** → **최근접-뼈 리지드 스키닝**으로 대체(각 정점을 가장 가까운 뼈 세그먼트에 weight 1). 블록키하지만 확실히 웨이트 실림.
- FBX 익스포트: `object_types={'ARMATURE','MESH'}`, `add_leaf_bones=False`, `bake_anim=False`.

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" -b --factory-startup -P "C:\Users\psmon\infra\blender\rig_idol.py"
# → design/blend/out/idol-star-rigged.fbx
```

---

## ⑤ FBX → Unity(HDRP) 임포트 + Humanoid + 댄스

대상: `G:/Unity/Projects/SparkleHDRP` (HDRP, Unity 6.2). Unity MCP 사용. **Editor 스크립트 한 방 셋업**(`Assets/Editor/IdolDancerSetup.cs`, `[MenuItem("Tools/Setup Idol Dancer")]`):
1. `ModelImporter.animationType = Human` + `avatarSetup = CreateFromThisModel` + `SaveAndReimport` → 아바타 자동생성(avatarValid 확인).
2. `PrefabUtility.InstantiatePrefab(fbx)` → 씬 배치.
3. **HDRP Lit 머티리얼 + `_BaseColorMap` = 텍스처** (안 하면 흰색).
4. `Animator.avatar` = 생성 아바타, `runtimeAnimatorController` = `Assets/PerformerYuna/DanceAB.controller`.
5. `DanceCycle` 컴포넌트 부착(PerfClock 기반 A↔B 크로스페이드).

**조명(필수)**: 새 씬은 카메라/라이트 없음 + HDRP 앰비언트 없음 → Directional Sun + **정면 KeyFront** 추가해야 밝고 이목구비 보임(안 하면 얼굴 그림자로 어두움).

**함정**:
- GLB 임포트 불가 → FBX 필수. `Unity_ImportExternalModel`은 FBX+albedo URL.
- HDRP 게임카메라 MCP 캡처 불가(`Failed to render preview`) → **씬뷰 캡처**만. Play 진입 시 씬뷰 프레이밍 리셋 + MCP 브리지 잠깐 끊김(GetState 폴링). **Play 전 씬 저장 필수**(프리즈 대비).
- `CreateScript`는 덮어쓰기 불가 → 디스크 직접 write + `ManageAsset Import`로 재컴파일.
- **치비 휴머노이드 리타깃은 접지/변형 거침**(뜨거나 각짐). 품질 업그레이드 = **Mixamo 오토리그**(FBX 웹 업로드 → 부드러운 스킨 웨이트).

---

## 산출물
- `design/blend/out/idol-star-pbr.glb` — PBR 텍스처 3D (게임레디)
- `design/blend/out/idol-star-rigged.fbx` — 리그드(Humanoid) 애니메이션 레디
- `design/blend/out/idol-toon-{front,34}.png` — 툰 렌더
- Unity `SparkleHDRP/Assets/Scenes/IdolStar.unity` — 밝은 조명 + 춤추는 아이돌
