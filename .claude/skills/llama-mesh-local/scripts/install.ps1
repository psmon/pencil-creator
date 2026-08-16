<#
.SYNOPSIS
  LLaMA-Mesh 로컬 설치 — llama.cpp Vulkan 프리빌트 다운로드 (+ 선택 GGUF 프리페치).
  AMD Radeon 8060S(gfx1151) Vulkan 백엔드. Docker/ROCm 불필요.

.PARAMETER Prefetch   GGUF(Q6_K)를 미리 받는다(~6.6GB). 생략 시 최초 gen 때 자동 다운로드.
.PARAMETER Quant      GGUF 양자화(Q4_K_M/Q6_K/Q8_0). 기본 Q6_K.
#>
[CmdletBinding()]
param(
  [string]$InstallDir = "$env:LOCALAPPDATA\llama-mesh-local",   # llama.cpp 바이너리(작음)만 C:
  [string]$ModelsDir  = "G:\Models\LLaMA-Mesh",                  # ★ 고용량 GGUF는 G:\Models
  [string]$Build = "b10451",
  [ValidateSet('Q4_K_M','Q6_K','Q8_0')][string]$Quant = 'Q6_K',
  [switch]$Prefetch
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

function Log($m){ Write-Host "[llama-mesh] $m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "  OK  $m" -ForegroundColor Green }

New-Item -ItemType Directory -Force -Path $InstallDir, "$InstallDir\llamacpp" | Out-Null

# --- Vulkan 확인 ---
Log 'Vulkan 확인'
$vk = (Get-Command vulkaninfo -EA SilentlyContinue)
if ($vk) {
  $dev = (& vulkaninfo --summary 2>$null | Select-String 'deviceName' | Select-Object -First 1)
  Ok "Vulkan: $dev"
} else { Write-Warning 'vulkaninfo 없음 — AMD 드라이버/Vulkan 런타임 확인 필요' }

# --- llama.cpp Vulkan 프리빌트 ---
$cli = Get-ChildItem "$InstallDir\llamacpp" -Recurse -Filter 'llama-cli.exe' -EA SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
if (-not $cli) {
  Log "llama.cpp Vulkan 다운로드 ($Build)"
  $url = "https://github.com/ggml-org/llama.cpp/releases/download/$Build/llama-$Build-bin-win-vulkan-x64.zip"
  $zip = "$InstallDir\llamacpp.zip"
  Invoke-WebRequest -Uri $url -OutFile $zip
  Expand-Archive -Path $zip -DestinationPath "$InstallDir\llamacpp" -Force
  Remove-Item $zip
  $cli = Get-ChildItem "$InstallDir\llamacpp" -Recurse -Filter 'llama-cli.exe' | Select-Object -First 1 -ExpandProperty FullName
}
Ok "llama-cli: $cli"
& $cli --version 2>&1 | Select-Object -First 1 | ForEach-Object { Ok $_ }

# --- 모델 저장소 (G:\Models — C: 용량 절약) ---
New-Item -ItemType Directory -Force -Path $ModelsDir | Out-Null
$gguf = Join-Path $ModelsDir "LLaMA-Mesh-$Quant.gguf"

# --- config.json ---
$cfg = [ordered]@{
  install_dir = $InstallDir
  models_dir  = $ModelsDir
  llama_cli   = $cli
  gguf_path   = $gguf
  quant       = $Quant
  gpu_layers  = 99
}
$cfg | ConvertTo-Json | Set-Content "$InstallDir\config.json" -Encoding UTF8
Ok "config.json 저장 (모델은 $ModelsDir)"

# --- GGUF 다운로드 (G:로 직접, C: 미사용) ---
if (Test-Path $gguf) {
  Ok "GGUF 이미 존재: $gguf ($([math]::Round((Get-Item $gguf).Length/1GB,2)) GB)"
} elseif ($Prefetch) {
  Log "GGUF 다운로드 → $ModelsDir ($Quant)"
  $url = "https://huggingface.co/bartowski/LLaMA-Mesh-GGUF/resolve/main/LLaMA-Mesh-$Quant.gguf?download=true"
  Invoke-WebRequest -Uri $url -OutFile $gguf
  Ok "GGUF 받음 ($([math]::Round((Get-Item $gguf).Length/1GB,2)) GB)"
} else {
  Write-Host "  !!  GGUF 미다운로드 — 재실행 시 -Prefetch 또는 gen.ps1이 자동 다운로드" -ForegroundColor Yellow
}

Write-Host "`n[llama-mesh] 설치 완료. 사용: gen.ps1 -Prompt '...' -Out out.obj" -ForegroundColor Magenta
