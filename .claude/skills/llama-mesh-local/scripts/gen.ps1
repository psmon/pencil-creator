<#
  LLaMA-Mesh 생성 — 텍스트 프롬프트 → .obj (llama.cpp Vulkan, gfx1151).
  텍스트 → LLM(v/f 출력) → 파서 → 유효 .obj → (선택) Unity Assets 복사.

  usage:
    gen.ps1 -Prompt "a simple wooden chair" -Out design/blend/out/chair.obj
    gen.ps1 -Prompt "a low-poly sword" -Out sword.obj -Tokens 1800 -Temp 0.5
    gen.ps1 -Prompt "a mushroom" -Out m.obj -UnityImport
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$Prompt,
  [string]$Out = "out.obj",
  [int]$Tokens = 1800,
  [double]$Temp = 0.6,
  [switch]$Raw,                       # 좌표 정규화 안 함
  [switch]$UnityImport,               # SparkleHDRP Assets 로 복사
  [string]$UnityDir = "G:\Unity\Projects\SparkleHDRP\Assets\GeneratedMeshes",
  [string]$InstallDir = "$env:LOCALAPPDATA\llama-mesh-local"
)
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# --- config (없으면 기본값: llama.cpp on C:, GGUF on G:) ---
$cfgPath = Join-Path $InstallDir 'config.json'
if (Test-Path $cfgPath) {
  $cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json
  $cli = $cfg.llama_cli; $gguf = $cfg.gguf_path; $ngl = $cfg.gpu_layers
} else {
  $cli = (Get-ChildItem "$InstallDir\llamacpp" -Recurse -Filter 'llama-cli.exe' -EA SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName)
  $gguf = "G:\Models\LLaMA-Mesh\LLaMA-Mesh-Q6_K.gguf"; $ngl = 99
}
if (-not (Test-Path $cli))  { throw "llama-cli 없음: $cli — install.ps1 실행" }
if (-not (Test-Path $gguf)) { throw "GGUF 없음: $gguf — install.ps1 -Prefetch" }

# --- 생성 ---
$raw = Join-Path $env:TEMP ("llamamesh_" + [guid]::NewGuid().ToString('N').Substring(0,8) + ".txt")
$full = "Create a 3D obj file of $Prompt."
Write-Host "[llama-mesh] 생성(Vulkan GPU): $full"
& $cli -m $gguf -ngl $ngl -c 8192 -n $Tokens --temp $Temp --top-p 0.9 --jinja -no-cnv `
  -p $full 2>&1 | Tee-Object -FilePath $raw | Out-Null

# --- 파싱 → .obj ---
$name = [IO.Path]::GetFileNameWithoutExtension($Out)
$py = Join-Path $ScriptDir 'mesh_from_llm.py'
$rawArg = @(); if ($Raw) { $rawArg = @('--raw') }
& py -3.14 $py --in $raw --out $Out --name $name @rawArg
if ($LASTEXITCODE -ne 0) { Write-Warning "메시 추출 실패 — 프롬프트 구체화 or 재생성. 원본: $raw"; exit 1 }
Remove-Item $raw -EA SilentlyContinue

# --- (선택) Unity 직결 ---
if ($UnityImport) {
  New-Item -ItemType Directory -Force -Path $UnityDir | Out-Null
  Copy-Item $Out (Join-Path $UnityDir ([IO.Path]::GetFileName($Out))) -Force
  Write-Host "[llama-mesh] Unity 복사 → $UnityDir (Unity가 .obj 네이티브 임포트)"
}
Write-Host "[llama-mesh] 완료 → $Out" -ForegroundColor Green
