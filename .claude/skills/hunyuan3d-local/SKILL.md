---
name: hunyuan3d-local
description: >
  Tencent Hunyuan3D-2.1을 이 컴퓨터(AMD Strix Halo / Radeon 8060S, gfx1151)에서 로컬로
  설치하고, 텍스트/이미지로 3D 메시(GLB, PBR 텍스처)를 생성한다. 설치(install) → 실행(use) →
  로드/언로드(load/unload, 다 쓰고 VRAM 회수)까지 전 과정을 다룬다. 백엔드는 ROCm 네이티브
  Windows(gfx1151 TheRock 휠). Vulkan은 이 모델에 해당 없음(PyTorch 모델).
  다음 상황에서 사용:
  - "Hunyuan3D 설치해줘", "훈위안3D 로컬로 깔아줘", "텍스트로 3D 모델 만들어줘(로컬)"
  - "AMD GPU로 3D 생성", "Strix Halo에서 3D 메시 생성", "텍스트→3D 로컬 실행"
  - "3D 모델 로드/언로드", "다 쓰고 VRAM 회수해줘", "Hunyuan3D 서버 띄워/내려"
  - Blender MCP의 generate_hunyuan3d_model 대신 로컬 파이프라인을 직접 돌리고 싶을 때
---

# Hunyuan3D Local — AMD Strix Halo (gfx1151) 로컬 3D 생성 스킬

Tencent **Hunyuan3D-2.1**(형상 DiT + PBR 텍스처 페인트)을 이 워크스테이션에서 로컬로 돌린다.
텍스트 또는 참조 이미지 → 3D 메시(`.glb`, PBR) 를 생성하고, **다 쓰고 나면 GPU 메모리를 회수**한다.

## 이 컴퓨터 환경 (확정값)

| 항목 | 값 |
|------|-----|
| GPU | **AMD Radeon 8060S** (Ryzen AI Max+ 395 "Strix Halo", RDNA 3.5, **gfx1151**) |
| 메모리 | **~96GB 통합(Unified)** — iGPU가 대량을 VRAM처럼 사용 → VRAM 병목 없음 |
| 백엔드 | **ROCm 네이티브 Windows** (gfx1151 TheRock/scottt PyTorch 휠) |
| Python | 휠이 **cp312 전용** → 설치 스크립트가 uv로 **Python 3.12**를 프로비저닝 |
| 설치 위치 | `%LOCALAPPDATA%\hunyuan3d-local\` (venv·리포·가중치, **저장소 밖** — 커밋 안 함) |

> ⚠️ **Vulkan은 Hunyuan3D를 못 돌린다.** Hunyuan3D는 PyTorch 모델이고 PyTorch에는 이 파이프라인을
> 돌릴 Vulkan 연산 백엔드가 없다. AMD에서 실제 GPU 가속 경로는 **ROCm**뿐이다. (Vulkan은 llama.cpp류 LLM 전용.)

## 전체 플로우

```
① install  →  ② load(선택)  →  ③ generate(text|image → GLB)  →  ④ unload / 회수
   ps1로 1회       서버 상주       one-shot 또는 서버 호출         VRAM 반납
```

---

## ① 설치 (install)

설치는 PowerShell 스크립트가 담당한다. **단계별(-Stage)** 실행이 가능해 재시도가 쉽다.

```powershell
# 전체 설치 (Python3.12 프로비저닝 → venv → ROCm torch → 리포 → 커스텀옵션 → 가중치)
pwsh -File .claude/skills/hunyuan3d-local/scripts/install.ps1 -Stage all

# 문제 생기면 단계만 재실행:
pwsh -File .claude/skills/hunyuan3d-local/scripts/install.ps1 -Stage torch    # ROCm 휠만
pwsh -File .claude/skills/hunyuan3d-local/scripts/install.ps1 -Stage repo     # 리포 + requirements
pwsh -File .claude/skills/hunyuan3d-local/scripts/install.ps1 -Stage ops      # custom_rasterizer + DifferentiableRenderer 빌드
pwsh -File .claude/skills/hunyuan3d-local/scripts/install.ps1 -Stage weights  # RealESRGAN + (선택) HF 가중치 프리페치
pwsh -File .claude/skills/hunyuan3d-local/scripts/install.ps1 -Stage verify   # torch.cuda(=HIP) 인식 확인
```

설치가 끝나면 `%LOCALAPPDATA%\hunyuan3d-local\config.json` 이 생성된다. (경로/모델ID/백엔드 기록)

### 설치 전 필수 (스크립트가 검사하고 없으면 안내)

- **AMD Adrenalin 드라이버** (최신) — gfx1151 인식
- **Visual Studio Build Tools 2022** (C++ 워크로드) — 커스텀 옵션 컴파일
- **AMD HIP SDK for Windows** — `custom_rasterizer` HIP 빌드용 (없으면 형상-전용 폴백)
- **uv**, **git** — 이미 설치됨(확인 완료)

> 커스텀 옵션 빌드 리스크와 폴백은 `references/troubleshooting.md` 참조.
> `custom_rasterizer`(HIP) 빌드가 실패해도 **형상-전용 GLB**는 생성된다(`--skip-paint`).

---

## ② + ③ + ④ 실행 (use) — 로드/생성/언로드

런타임은 `scripts/hy3d.py` 하나로 조작한다. **두 가지 모드**:

### 모드 A — one-shot (권장, 자동 회수)
프로세스가 끝나면 GPU 메모리가 자동 반납된다. 단발 생성에 적합.

```powershell
# 텍스트 → 3D (내부에서 text→image→3D 체인)
pwsh -File .claude/skills/hunyuan3d-local/scripts/run.ps1 gen `
  --prompt "a cute cartoon fox, standing, game asset" `
  --out design/blend/out/fox.glb

# 참조 이미지 → 3D (t2i 건너뜀, 가장 안정적)
pwsh -File .claude/skills/hunyuan3d-local/scripts/run.ps1 gen `
  --image image/ref/fox.png --out design/blend/out/fox.glb

# 형상만 (텍스처 파이프라인 스킵 — AMD에서 가장 견고)
pwsh -File .claude/skills/hunyuan3d-local/scripts/run.ps1 gen `
  --image image/ref/fox.png --out design/blend/out/fox_shape.glb --skip-paint
```

### 모드 B — 서버 상주 (배치, 명시적 회수)
모델을 한 번 로드해 여러 번 생성하고, **다 쓰면 `unload`로 VRAM만 반납**(서버는 유지)하거나
`stop`으로 완전 종료한다. → 사용자가 원한 "로드/언로드(다 사용후 회수)".

```powershell
$run = ".claude/skills/hunyuan3d-local/scripts/run.ps1"

pwsh -File $run serve            # 백그라운드 서버 기동 (localhost:8781)
pwsh -File $run load             # 형상+텍스처 파이프라인을 GPU에 로드
pwsh -File $run status           # 로드 상태 + VRAM 사용량 확인
pwsh -File $run gen --image a.png --out a.glb   # 서버로 생성 (모델 재사용, 빠름)
pwsh -File $run gen --image b.png --out b.glb
pwsh -File $run unload           # ★ VRAM 회수 (서버는 계속 살아있음, 재로드 가능)
pwsh -File $run stop             # 서버 완전 종료 (프로세스 종료 = 전량 반납)
```

> `run.ps1` 은 venv(Python3.12)를 활성화하고 `hy3d.py` 에 인자를 넘기는 얇은 래퍼다.
> 서버는 `unload` 시 `del pipeline → gc.collect() → torch.cuda.empty_cache() → ipc_collect()` 로 회수한다.

---

## 파라미터 요약 (`gen`)

| 플래그 | 설명 | 기본 |
|--------|------|------|
| `--prompt` | 텍스트 프롬프트 (t2i로 참조 이미지 먼저 생성) | — |
| `--image` | 참조 이미지 경로 (있으면 t2i 스킵) | — |
| `--out` | 출력 GLB 경로 | `out.glb` |
| `--skip-paint` | 텍스처 스킵, 형상-전용 GLB | off |
| `--views` | 페인트 멀티뷰 수 (품질/속도) | 6 |
| `--resolution` | 텍스처 해상도 | 512 |
| `--steps` | DiT 확산 스텝 | 모델 기본 |
| `--server` | 실행 중 서버로 위임(모드 B) | 자동감지 |
| `--seed` | 시드 고정 | 랜덤 |

---

## text → 3D 체인 (프로젝트 기존 자산 재사용)

Hunyuan3D-2.1 은 공식적으로 **image→3D**다. 텍스트 입력은 아래 순서로 처리한다:

```
--prompt "..."  →  [t2i: image-gen.py]  →  참조 이미지 PNG  →  Hunyuan3D 형상+텍스처  →  GLB
```

t2i 프론트엔드는 `config.json` 의 `t2i_cmd` 템플릿으로 지정한다.
기본값은 이 프로젝트의 이미지 생성기(`.claude/skills/pencil-design/scripts/image-gen.py`, pythoncore-3.14)를
호출한다. (메모리: 이미지 생성은 pythoncore-3.14로 실행) 참조 이미지가 이미 있으면 `--image` 로 이 단계를 건너뛴다.

---

## Case M 연동

생성한 `.glb` 는 **Case M(Modeling-First) 워크플로우**의 3D 자산으로 바로 투입할 수 있다:
- Blender MCP `import_generated_asset` 또는 blend3d 스킬로 씬 조립 → `design/blend/{scene}.blend` 저장
- 또는 Three.js 웹 재구축(`design/xaml/output/sample{N}/`) 입력 메시로 사용

Blender MCP에 이미 붙어있는 `generate_hunyuan3d_model` 은 **원격/내장 서비스** 경로이고,
이 스킬은 **완전 로컬(ROCm) 경로**다. 오프라인·대량 배치·프라이버시가 필요하면 이 스킬을 쓴다.

---

## 참고 문서

- `references/install-rocm-gfx1151.md` — Strix Halo ROCm 설치 상세 + 알려진 버그/우회
- `references/troubleshooting.md` — 커스텀 옵션 빌드 실패, VRAM, HF 다운로드 등 트러블슈팅
- `scripts/config.example.json` — 설정 예시
