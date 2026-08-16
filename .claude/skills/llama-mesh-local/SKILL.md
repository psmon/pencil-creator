---
name: llama-mesh-local
description: >
  NVIDIA LLaMA-Mesh를 이 컴퓨터(AMD Radeon 8060S, gfx1151)에서 로컬로 실행해 텍스트 프롬프트로
  3D 메시(OBJ)를 생성한다. LLM(LLaMA 3.1 8B 파인튜닝)이 정점/면을 텍스트로 직접 출력 →
  파싱해 .obj 저장 → Unity에 네이티브 임포트(중간 변환 없음). 두 백엔드:
  (1) Docker ROCm 서버 — 모델을 별도 프로세스로 상주(권장, hunyuan3d 와 동일 GPU 패턴),
  (2) llama.cpp Vulkan — 프리빌트 초경량 단발 실행. 다음 상황에서 사용:
  - "LLaMA-Mesh로 3D 만들어", "텍스트로 메시 생성(LLM)", "llama-mesh 도입"
  - "ROCm/도커로 3D 모델 생성", "서버 상주로 메시 생성", "OBJ 바로 Unity에 넣어줘"
  - 깔끔한 저폴리/텍스트-네이티브 3D가 필요할 때 (Hunyuan3D의 조밀·비정형 토폴로지 대안)
---

# LLaMA-Mesh Local — 텍스트 → 3D 메시(OBJ) → Unity 직결

NVIDIA **LLaMA-Mesh**(LLaMA 3.1 8B 파인튜닝)를 이 워크스테이션에서 로컬로 실행한다.
LLM이 **정점(v)·면(f)을 텍스트로 직접 생성** → OBJ로 저장 → **Unity가 OBJ를 네이티브 임포트**하므로
Blender/FBX 변환 없이 바로 씬에 넣는다.

## 두 백엔드
| | **(A) Docker ROCm 서버** (권장) | (B) llama.cpp Vulkan |
|---|---|---|
| 실행 | 모델을 **별도 프로세스로 상주**(FastAPI), 요청은 HTTP | 프리빌트 `llama-cli` 단발 |
| 백엔드 | transformers + gfx1151 torch(HIP), `/dev/dxg` | llama.cpp Vulkan(GGUF) |
| 장점 | 메인 세션/머신 부담 분리, 반복 생성 시 로드 1회, hunyuan3d 와 동일 검증 패턴 | 초경량, Docker 불필요 |
| 가중치 | HF `Zhengyi/LLaMA-Mesh`(~16GB fp16) → `G:\Models\hf-cache` | GGUF Q6_K(~6.6GB) → `G:\Models\LLaMA-Mesh` |
| 적합 | 세션 중 여러 번 생성, 안정 운영 | 가끔 한두 번, 최소 셋업 |

> gfx1151 GPU 접근은 hunyuan3d 와 동일하게 **호스트 WSL ROCm(librocdxg/libhsakmt) 마운트 + `/dev/dxg`**
> 로 살린다(entrypoint 가 LD 경로 구성). attention 은 안전하게 **eager**(SDPA 커널 이슈 회피).

---

## (A) Docker ROCm 서버 — 권장

```powershell
$d = ".claude/skills/llama-mesh-local/scripts/docker.ps1"

pwsh -File $d build                 # ① 이미지 빌드 (최초 1회, torch gfx1151 + transformers)
pwsh -File $d diag                  # ② GPU 점검 (gfx1151 인식·matmul)
pwsh -File $d up                    # ③ 서버 상주 시작 (모델 로드 ~1-2분, 최초 HF ~16GB → G:\Models\hf-cache)

# ④ 생성 — 텍스트 → OBJ (서버가 안 떠 있으면 자동 up)
pwsh -File $d gen --prompt "a simple wooden chair" --out design/blend/out/chair.obj
pwsh -File $d gen --prompt "a low-poly sword" --out sword.obj --tokens 3000 --temp 0.5 --unity

pwsh -File $d status                # 헬스 확인
pwsh -File $d logs                  # 서버 로그
pwsh -File $d stop                  # 정지·제거 (그 후 `wsl --shutdown` 으로 GPU 완전 회수)
```

- `--unity` : 결과 .obj 를 `SparkleHDRP/Assets/GeneratedMeshes/` 로 복사(Unity 네이티브 임포트).
- 게이트 모델이면 `$env:HF_TOKEN` 설정 후 `up`.
- 흐름: `gen` → HTTP POST `/gen` → 서버가 v/f 원문 생성 → 호스트 `mesh_from_llm.py` 가 유효 OBJ 로 정리.

## (B) llama.cpp Vulkan — 초경량 단발

```powershell
pwsh -File .claude/skills/llama-mesh-local/scripts/install.ps1        # llama.cpp Vulkan + GGUF
$run = ".claude/skills/llama-mesh-local/scripts/gen.ps1"
pwsh -File $run -Prompt "a simple wooden chair" -Out design/blend/out/chair.obj
pwsh -File $run -Prompt "a chair" -Out chair.obj -UnityImport
```

---

## Unity 직결
Unity는 `.obj`를 모델 에셋으로 자동 인식한다(텍스처 없음 → 머티리얼은 Unity/Blender에서 부여).

## 참고
- 좌표는 LLaMA-Mesh가 이산 그리드로 양자화 → 저폴리·각진 형태. 정밀 유기체보다 **가구·도구·간단 오브젝트**에 적합.
- 품질 부족 시: 프롬프트 구체화, 토큰 수↑, 온도↓(0.5~0.7), 재생성.
- gfx1151 GPU 함정(마운트/attention/장치 숨김)은 [[hunyuan3d-local-rocm]] 메모리 참조.
