<#
.SYNOPSIS
  Hunyuan3D-2.1 로컬 설치 (AMD Strix Halo / Radeon 8060S / gfx1151, ROCm 네이티브 Windows).

.DESCRIPTION
  단계별 설치. cp312 전용 ROCm 휠에 맞춰 uv로 Python 3.12를 프로비저닝하고,
  전용 venv에 gfx1151 PyTorch 휠 → Hunyuan3D-2.1 리포 → 커스텀 옵션(빌드) → 가중치 순으로 설치한다.
  설치물은 저장소 밖(%LOCALAPPDATA%\hunyuan3d-local)에 둔다. 완료 시 config.json 을 생성한다.

.PARAMETER Stage
  all | prereq | python | venv | torch | repo | ops | weights | config | verify

.EXAMPLE
  pwsh -File install.ps1 -Stage all
  pwsh -File install.ps1 -Stage ops     # 커스텀 옵션만 재빌드
#>
[CmdletBinding()]
param(
  [ValidateSet('all','prereq','python','venv','torch','repo','ops','weights','config','verify')]
  [string]$Stage = 'all',
  [string]$InstallDir = "$env:LOCALAPPDATA\hunyuan3d-local",
  [switch]$PrefetchWeights   # -Stage weights 에서 HF 대용량 가중치까지 미리 받음(수 GB)
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# ---- gfx1151 Windows 휠 (scottt/rocm-TheRock, ROCm 6.5.0rc, PyTorch 2.7.0a0, cp312) ----
$WheelBase = 'https://github.com/scottt/rocm-TheRock/releases/download/v6.5.0rc-pytorch'
$Wheels = @(
  "$WheelBase/torch-2.7.0a0+git3f903c3-cp312-cp312-win_amd64.whl",
  "$WheelBase/torchvision-0.22.0+9eb57cd-cp312-cp312-win_amd64.whl",
  "$WheelBase/torchaudio-2.6.0a0+1a8f621-cp312-cp312-win_amd64.whl"
)
$RepoUrl  = 'https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1.git'
$RepoDir  = Join-Path $InstallDir 'Hunyuan3D-2.1'
$VenvDir  = Join-Path $InstallDir 'venv'
$VenvPy   = Join-Path $VenvDir 'Scripts\python.exe'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Log($m)  { Write-Host "`n[hy3d] $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "  OK  $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  !!  $m" -ForegroundColor Yellow }
function Have($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }

function Stage-Prereq {
  Log 'Prerequisite check'
  $missing = @()
  if (Have 'git') { Ok "git $(git --version)" } else { $missing += 'git' }
  if (Have 'uv')  { Ok "uv $(uv --version)" }   else { $missing += 'uv (https://astral.sh/uv)' }

  # GPU
  $gpu = (Get-CimInstance Win32_VideoController | Where-Object { $_.Name -match 'Radeon' } | Select-Object -First 1).Name
  if ($gpu) { Ok "GPU: $gpu" } else { Warn 'AMD Radeon GPU를 못 찾음 — 드라이버 확인 필요' }

  # HIP SDK (custom_rasterizer 빌드에 필요; 없으면 형상-전용 폴백)
  if ($env:HIP_PATH -and (Test-Path $env:HIP_PATH)) {
    Ok "HIP SDK: $env:HIP_PATH"
  } else {
    Warn 'AMD HIP SDK(HIP_PATH) 미탐지 — custom_rasterizer(HIP) 빌드가 실패할 수 있음.'
    Warn '  → 형상-전용(--skip-paint)은 그래도 동작. 설치: AMD HIP SDK for Windows.'
  }

  # MSVC (C++ 빌드툴)
  $vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
  if (Test-Path $vswhere) {
    $vc = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
    if ($vc) { Ok "VS Build Tools: $vc" } else { Warn 'VC++ 빌드툴 미탐지 — 커스텀 옵션 컴파일 실패 가능' }
  } else { Warn 'Visual Studio Installer 미탐지 — VS Build Tools 2022(C++) 설치 권장' }

  if ($missing.Count) { throw "필수 도구 누락: $($missing -join ', ')" }
}

function Stage-Python {
  Log 'Provision Python 3.12 (uv) — gfx1151 휠은 cp312 전용'
  uv python install 3.12
  Ok 'Python 3.12 준비됨 (uv)'
}

function Stage-Venv {
  Log "Create venv (Python 3.12) at $VenvDir"
  New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
  if (-not (Test-Path $VenvPy)) {
    # --seed 로 pip/setuptools/wheel 을 venv에 심는다 (uv venv 기본은 pip 없음)
    uv venv --python 3.12 --seed $VenvDir
  }
  # pip 부트스트랩 보강 (이미 있으면 무해)
  & $VenvPy -m ensurepip --upgrade 2>$null
  & $VenvPy -m pip install --upgrade pip wheel setuptools 2>$null
  if ($LASTEXITCODE -ne 0) {
    Warn 'venv 내 pip 미탐지 → uv pip 로 seed 재시도'
    uv pip install --python $VenvPy --upgrade pip wheel setuptools
  }
  $v = & $VenvPy --version
  Ok "venv: $v"
  if ($v -notmatch '3\.12') { throw "venv Python이 3.12가 아님($v) — gfx1151 휠과 불일치" }
}

function Stage-Torch {
  Log 'Install ROCm gfx1151 PyTorch wheels (torch/vision/audio)'
  foreach ($w in $Wheels) {
    Write-Host "  pip install $w"
    & $VenvPy -m pip install --force-reinstall --no-deps $w
  }
  # torch를 --no-deps 로 깔았으므로 파이썬 런타임 의존성을 명시 설치
  Write-Host "  pip install torch python deps"
  & $VenvPy -m pip install `
    typing_extensions filelock fsspec jinja2 networkx sympy mpmath `
    "numpy<2" pillow hf_xet
  if ($LASTEXITCODE -ne 0) { throw 'torch 의존성 설치 실패' }
  Ok 'ROCm 휠 + 의존성 설치 완료'
}

function Stage-Repo {
  Log 'Clone Hunyuan3D-2.1 + requirements'
  if (-not (Test-Path $RepoDir)) {
    git clone --depth 1 $RepoUrl $RepoDir
  } else { Ok '리포 이미 존재 (git pull 생략)' }

  # Hunyuan3D-2.1 의 requirements.txt 는 Python 3.10/3.11 + CUDA 전제라 3.12+ROCm 에서 다수 핀이 깨진다:
  #   numpy==1.24.4 (3.12 휠 없음), cupy-cuda12x(NVIDIA 전용), bpy/deepspeed(윈도 빌드),
  #   basicsr/realesrgan(신규 torchvision 과 import 충돌) 등.
  # → 형상(shape) 파이프라인에 필요한 것만 큐레이션 설치한다. (텍스처 전용/CUDA 전용은 나중에)

  Log 'Install curated deps for SHAPE pipeline (core=fatal, extra=best-effort)'
  # 핵심 — 모델 코드가 버전에 민감한 것은 원본 핀 유지, 나머지는 최신 cp312 휠
  $core = @(
    'transformers==4.46.0','diffusers==0.30.0','accelerate==1.1.1',
    'huggingface-hub==0.30.2','safetensors==0.4.4',
    'scipy==1.14.1','einops==0.8.0','omegaconf==2.3.0','pyyaml==6.0.2',
    'tqdm==4.66.5','psutil==6.0.0',
    'trimesh==4.4.7','pygltflib==1.16.3',
    'opencv-python==4.10.0.84','imageio==2.36.0','pillow',
    'torchdiffeq'   # flow-matching ODE (형상 샘플러)
  )
  Write-Host "  pip install (core, numpy<2 보존)"
  & $VenvPy -m pip install @core
  if ($LASTEXITCODE -ne 0) { throw 'core deps 설치 실패 — 위 로그 확인' }
  # requirements가 numpy를 2.x로 끌어올렸을 수 있으니 다시 고정
  & $VenvPy -m pip install "numpy<2" | Out-Null
  Ok 'core deps 설치 완료'

  # 베스트에포트 — 있으면 좋고, cp312 휠이 없으면 건너뜀 (형상-전용은 없이도 동작 가능)
  Log 'Install extras (best-effort; 실패해도 형상-전용은 동작)'
  $extras = @('rembg==2.0.65','onnxruntime','scikit-image==0.24.0','xatlas==0.0.9','pymeshlab','open3d','pandas==2.2.2','timm')
  foreach ($e in $extras) {
    & $VenvPy -m pip install $e 2>$null
    if ($LASTEXITCODE -eq 0) { Ok "extra: $e" } else { Warn "extra 건너뜀(설치 실패): $e" }
  }
  & $VenvPy -m pip install "numpy<2" | Out-Null   # extras가 numpy 올렸으면 재고정
  Warn '텍스처(PBR) 전용 의존성(cupy-rocm, bpy, basicsr/realesrgan, deepspeed)은 미설치 — 형상+텍스처 풀은 -Stage ops 및 프리레퀴짓 이후.'
}

function Stage-Ops {
  Log 'Build custom ops: DifferentiableRenderer (CPU C++/MSVC), custom_rasterizer (HIP)'
  & $VenvPy -m pip install pybind11 2>$null | Out-Null

  # 1) DifferentiableRenderer — CPU pybind. 리포의 compile_mesh_painter.sh 는 리눅스 전용
  #    (c++ -fPIC / python3-config) 이라 Windows 에선 MSVC + pybind11.setup_helpers 로 빌드한다.
  $drDir = Join-Path $RepoDir 'hy3dpaint\DifferentiableRenderer'
  if (Test-Path $drDir) {
    $setupWin = Join-Path $drDir 'setup_win.py'
    if (-not (Test-Path $setupWin)) {
@'
# Windows(MSVC) 빌드 — 리눅스용 compile_mesh_painter.sh 대체
from pybind11.setup_helpers import Pybind11Extension, build_ext
from setuptools import setup
setup(name="mesh_inpaint_processor",
      ext_modules=[Pybind11Extension("mesh_inpaint_processor", ["mesh_inpaint_processor.cpp"], cxx_std=14)],
      cmdclass={"build_ext": build_ext})
'@ | Set-Content -Path $setupWin -Encoding UTF8
    }
    Push-Location $drDir
    & $VenvPy setup_win.py build_ext --inplace 2>&1 | Select-Object -Last 3 | Write-Host
    $rc = $LASTEXITCODE
    Pop-Location
    if ($rc -eq 0 -and (Get-ChildItem "$drDir\mesh_inpaint_processor*.pyd" -EA SilentlyContinue)) {
      Ok 'DifferentiableRenderer(mesh_inpaint_processor) 빌드 완료 [MSVC]'
    } else {
      Warn 'DifferentiableRenderer 빌드 실패 — VS Build Tools(C++) 설치 확인'
    }
  } else { Warn "$drDir 없음" }

  # 2) custom_rasterizer — CUDAExtension(.cu) → HIP 컴파일러 필요(AMD HIP SDK).
  $crDir = Join-Path $RepoDir 'hy3dpaint\custom_rasterizer'
  if (Test-Path $crDir) {
    if (-not ($env:HIP_PATH -and (Test-Path $env:HIP_PATH))) {
      Warn 'AMD HIP SDK(HIP_PATH) 미탐지 → custom_rasterizer(.cu) 빌드 건너뜀.'
      Warn '  텍스처(PBR)는 HIP SDK 설치 후 -Stage ops 재실행 필요. 지금은 형상-전용(--skip-paint) 가능.'
    } else {
      Write-Host "  pip install -e $crDir  (HIP 확장 빌드 시도)"
      & $VenvPy -m pip install -e $crDir
      if ($LASTEXITCODE -eq 0) { Ok 'custom_rasterizer 빌드 완료 (텍스처 파이프라인 사용 가능)' }
      else {
        Warn 'custom_rasterizer HIP 빌드 실패 — 텍스처(PBR) 비활성. 형상-전용만 사용.'
        Warn '  원인/우회: references/troubleshooting.md § custom_rasterizer HIP build'
      }
    }
  } else { Warn "$crDir 없음" }
}

function Stage-Weights {
  Log 'Fetch aux weights'
  # RealESRGAN (텍스처 업스케일) — 리포 지정 경로
  $ckptDir = Join-Path $RepoDir 'hy3dpaint\ckpt'
  New-Item -ItemType Directory -Force -Path $ckptDir | Out-Null
  $esr = Join-Path $ckptDir 'RealESRGAN_x4plus.pth'
  if (-not (Test-Path $esr)) {
    $url = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'
    Write-Host "  download RealESRGAN_x4plus.pth"
    Invoke-WebRequest -Uri $url -OutFile $esr
    Ok 'RealESRGAN 받음'
  } else { Ok 'RealESRGAN 이미 있음' }

  if ($PrefetchWeights) {
    Log 'Prefetch Hunyuan3D-2.1 HF weights (수 GB)'
    & $VenvPy -m pip install "huggingface_hub[cli]" | Out-Null
    & $VenvPy -m huggingface_hub.commands.huggingface_cli download tencent/Hunyuan3D-2.1 --local-dir (Join-Path $InstallDir 'weights\Hunyuan3D-2.1')
    Ok 'HF 가중치 프리페치 완료'
  } else {
    Warn 'HF 가중치는 최초 generate 시 자동 다운로드됨 (-PrefetchWeights 로 미리 받기 가능)'
  }
}

function Stage-Config {
  Log 'Write config.json'
  $t2i = @(
    'py','-3.14',
    (Join-Path (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ScriptDir))) 'pencil-design\scripts\image-gen.py'),
    'generate','--prompt','{prompt}, single object, centered, plain background, product shot',
    '--topic','hy3d-t2i','--out','{image_out}','--provider','gemini'
  )
  $cfg = [ordered]@{
    backend      = 'rocm'
    gfx_arch     = 'gfx1151'
    install_dir  = $InstallDir
    venv_python  = $VenvPy
    repo_dir     = $RepoDir
    server       = [ordered]@{ host = '127.0.0.1'; port = 8781 }
    models       = [ordered]@{
      shape_repo = 'tencent/Hunyuan3D-2.1'; shape_subfolder = 'hunyuan3d-dit-v2-1'
      paint_repo = 'tencent/Hunyuan3D-2.1'; paint_subfolder = 'hunyuan3d-paintpbr-v2-1'
    }
    defaults     = [ordered]@{ views = 6; resolution = 512; skip_paint = $false; low_vram = $false }
    t2i_cmd      = $t2i
  }
  $path = Join-Path $InstallDir 'config.json'
  $cfg | ConvertTo-Json -Depth 6 | Set-Content -Path $path -Encoding UTF8
  Ok "config.json → $path"
}

function Stage-Verify {
  Log 'Verify torch(=HIP) sees the GPU'
  # 시스템이 HIP_VISIBLE_DEVICES=-1(숨김)로 걸어뒀으면 8060S 재노출
  if (-not $env:HIP_VISIBLE_DEVICES -or $env:HIP_VISIBLE_DEVICES -eq '-1') {
    $env:HIP_VISIBLE_DEVICES = '0'
  }
  $code = @'
import torch, json
info = {
  "torch": torch.__version__,
  "cuda_available(=HIP)": torch.cuda.is_available(),
  "device_count": torch.cuda.device_count(),
  "device_name": (torch.cuda.get_device_name(0) if torch.cuda.is_available() else None),
  "hip": getattr(torch.version, "hip", None),
}
print(json.dumps(info, indent=2))
assert torch.cuda.is_available(), "torch.cuda(HIP) 사용 불가 — ROCm 휠/드라이버 확인"
x = torch.randn(1024,1024, device="cuda"); y = (x@x).sum().item()
print("matmul on GPU OK:", y is not None)
'@
  $tmp = Join-Path $env:TEMP 'hy3d_verify.py'
  $code | Set-Content -Path $tmp -Encoding UTF8
  & $VenvPy $tmp
  if ($LASTEXITCODE -ne 0) { throw "verify 실패 (exit $LASTEXITCODE) — 위 트레이스백 확인" }
  Ok 'GPU 연산 확인 완료'
}

# ---- orchestrate ----
Write-Host "=== Hunyuan3D-2.1 로컬 설치 (gfx1151 / ROCm) ===" -ForegroundColor Magenta
Write-Host "InstallDir: $InstallDir"

switch ($Stage) {
  'all'     { Stage-Prereq; Stage-Python; Stage-Venv; Stage-Torch; Stage-Repo; Stage-Ops; Stage-Weights; Stage-Config; Stage-Verify }
  'prereq'  { Stage-Prereq }
  'python'  { Stage-Python }
  'venv'    { Stage-Venv }
  'torch'   { Stage-Torch }
  'repo'    { Stage-Repo }
  'ops'     { Stage-Ops }
  'weights' { Stage-Weights }
  'config'  { Stage-Config }
  'verify'  { Stage-Verify }
}

Write-Host "`n[hy3d] Stage '$Stage' 완료." -ForegroundColor Magenta
if ($Stage -in @('all','config')) {
  Write-Host "다음: pwsh -File .claude/skills/hunyuan3d-local/scripts/run.ps1 gen --image <ref.png> --out out.glb" -ForegroundColor Cyan
}
