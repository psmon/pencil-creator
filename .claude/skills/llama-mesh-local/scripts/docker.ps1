<#
  LLaMA-Mesh Docker(ROCm/WSL2) 서버 매니저 — 별도 프로세스로 모델 상주.
  텍스트 → (HTTP) LLaMA-Mesh 서버 → v/f 원문 → mesh_from_llm.py → .obj → (선택) Unity.

  usage:
    docker.ps1 build                                  # 이미지 빌드 (최초 1회)
    docker.ps1 diag                                   # 컨테이너 GPU 점검(gfx1151)
    docker.ps1 up                                     # 서버 상주 시작(모델 로드 ~1-2분, HF 최초 ~16GB)
    docker.ps1 status                                 # 서버 헬스 확인
    docker.ps1 gen --prompt "a wooden chair" --out design/blend/out/chair.obj
    docker.ps1 gen --prompt "a low-poly sword" --out sword.obj --tokens 3000 --temp 0.5 --unity
    docker.ps1 logs                                   # 서버 로그
    docker.ps1 stop                                   # 서버 정지·제거 (+ wsl --shutdown 안내로 GPU 회수)

  요구: WSL2(Ubuntu) + Docker Desktop + /dev/dxg. 가중치는 G:\Models\hf-cache 에 지속.
#>
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir  = Split-Path -Parent $ScriptDir
$DockerCtx = Join-Path $SkillDir 'docker'
$Image     = 'llama-mesh-rocm:latest'
$Container = 'llama-mesh-server'
$Port      = 8080
# HF 가중치 캐시 = Docker 네임드 볼륨(=docker 디스크가 G: 라 물리적으론 G:, 단 native ext4 라 빠름).
# G:\Models 로의 drvfs 바인드마운트는 대용량(16GB) 다운로드가 정체/행 → 네임드 볼륨으로 회피.
$HfVolume  = 'llama-hf-cache'
$UnityDir  = 'G:\Unity\Projects\SparkleHDRP\Assets\GeneratedMeshes'

function To-WslPath([string]$winPath) {
  $p = (Resolve-Path $winPath -ErrorAction SilentlyContinue)?.Path
  if (-not $p) { $p = $winPath }
  $p = $p -replace '\\','/'
  if ($p -match '^([A-Za-z]):/(.*)$') { return "/mnt/$($matches[1].ToLower())/$($matches[2])" }
  return $p
}

# GPU 패스스루 + 호스트 WSL ROCm 런타임 마운트 (hunyuan 과 동일 패턴)
$hostRocmRoot = "$(wsl -- bash -lc 'readlink -f /opt/rocm 2>/dev/null')".Trim()
$hostHsakmt   = "$(wsl -- bash -lc 'find /usr/lib/x86_64-linux-gnu -name libhsakmt.so.1 2>/dev/null | head -1')".Trim()
$GpuFlags = @('--device=/dev/dxg','-v','/usr/lib/wsl:/usr/lib/wsl',
              '-v', "${HfVolume}:/hfcache")
if ($hostRocmRoot) { $GpuFlags += @('-v', "${hostRocmRoot}:/opt/rocm-host:ro") }
else { Write-Warning "[lm-docker] 호스트 WSL ROCm 미탐지 — GPU 불가(WSL 내 ROCm 확인)" }
if ($hostHsakmt)   { $GpuFlags += @('-v', "${hostHsakmt}:/opt/wsl-hsakmt/libhsakmt.so.1:ro") }

$argv = @($args)
if ($argv.Count -lt 1) { throw "usage: docker.ps1 <build|diag|up|status|gen|logs|stop> [args]" }
$Command = [string]$argv[0]
$Rest = if ($argv.Count -gt 1) { $argv[1..($argv.Count-1)] } else { @() }

function Parse-Rest {
  $h = @{ tokens = 4096; temp = 0.6 }
  for ($i=0; $i -lt $Rest.Count; $i++) {
    switch ($Rest[$i]) {
      '--prompt' { $h.prompt = $Rest[++$i] }
      '--out'    { $h.out    = $Rest[++$i] }
      '--tokens' { $h.tokens = [int]$Rest[++$i] }
      '--temp'   { $h.temp   = [double]$Rest[++$i] }
      '--unity'  { $h.unity  = $true }
      '--raw'    { $h.raw    = $true }
    }
  }
  return $h
}

function Wait-Ready([int]$timeoutSec = 240) {
  for ($t=0; $t -lt $timeoutSec; $t += 5) {
    try {
      $r = Invoke-RestMethod "http://localhost:$Port/health" -TimeoutSec 4 -EA Stop
      if ($r.ready) { return $true }
      if ($r.error) { throw "서버 로드 실패: $($r.error)" }
    } catch {}
    Start-Sleep 5
  }
  return $false
}

switch ($Command) {

  'build' {
    $ctxWsl = To-WslPath $DockerCtx
    Write-Host "[lm-docker] 이미지 빌드: $Image  (context: $ctxWsl)"
    wsl -- bash -lc "cd '$ctxWsl' && DOCKER_BUILDKIT=1 docker build -t $Image ."
  }

  'diag' {
    Write-Host "[lm-docker] 컨테이너 GPU 점검(gfx1151)"
    wsl -- docker run --rm @GpuFlags $Image --diag
  }

  'up' {
    wsl -- bash -lc "docker rm -f $Container 2>/dev/null" | Out-Null
    Write-Host "[lm-docker] 서버 상주 시작 (모델 로드 ~1-2분, 최초 HF 다운로드 ~16GB → 볼륨 $HfVolume)"
    # xet 비활성 → 표준 resumable https(대용량 shard 안정). HF_TOKEN 있으면 레이트리밋 완화.
    $envArgs = @('-e','HF_HUB_DISABLE_XET=1','-e','HF_HUB_ENABLE_HF_TRANSFER=0')
    if ($env:HF_TOKEN) { $envArgs += @('-e', "HF_TOKEN=$($env:HF_TOKEN)") }
    wsl -- docker run -d --name $Container -p "${Port}:8080" @GpuFlags @envArgs $Image
    if (Wait-Ready) { Write-Host "[lm-docker] ✅ 서버 준비됨 → http://localhost:$Port" -ForegroundColor Green }
    else { Write-Warning "[lm-docker] 준비 대기 초과 — 'docker.ps1 logs' 로 확인"; }
  }

  'status' {
    wsl -- docker ps --filter "name=$Container" --format '{{.Names}}  {{.Status}}  {{.Ports}}' 2>&1
    try { Invoke-RestMethod "http://localhost:$Port/health" -TimeoutSec 5 | ConvertTo-Json -Compress } catch { Write-Warning "헬스 응답 없음" }
  }

  'logs' { wsl -- docker logs --tail 60 $Container 2>&1 }

  'gen' {
    $h = Parse-Rest
    if (-not $h.prompt) { throw "--prompt 필요" }
    if (-not $h.out)    { $h.out = "out.obj" }
    # 서버 가동 확인(없으면 자동 up)
    if (-not (Wait-Ready 5)) {
      Write-Host "[lm-docker] 서버 미가동 → up 실행"
      & $PSCommandPath up
      if (-not (Wait-Ready)) { throw "서버 시작 실패 — logs 확인" }
    }
    Write-Host "[lm-docker] 생성(HTTP): $($h.prompt)"
    $body = @{ prompt=$h.prompt; max_tokens=$h.tokens; temperature=$h.temp } | ConvertTo-Json
    $resp = Invoke-RestMethod "http://localhost:$Port/gen" -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 1800
    if (-not $resp.ok) { throw "생성 실패: $($resp.error)" }

    $raw = Join-Path $env:TEMP ("llamamesh_" + [guid]::NewGuid().ToString('N').Substring(0,8) + ".txt")
    $resp.text | Set-Content $raw -Encoding UTF8
    $name = [IO.Path]::GetFileNameWithoutExtension($h.out)
    $py = Join-Path $ScriptDir 'mesh_from_llm.py'
    $rawArg = @(); if ($h.raw) { $rawArg = @('--raw') }
    & py -3.14 $py --in $raw --out $h.out --name $name @rawArg
    if ($LASTEXITCODE -ne 0) { Write-Warning "메시 추출 실패 — 프롬프트 구체화/재생성. 원본: $raw"; exit 1 }
    Remove-Item $raw -EA SilentlyContinue

    if ($h.unity) {
      New-Item -ItemType Directory -Force -Path $UnityDir | Out-Null
      Copy-Item $h.out (Join-Path $UnityDir ([IO.Path]::GetFileName($h.out))) -Force
      Write-Host "[lm-docker] Unity 복사 → $UnityDir"
    }
    Write-Host "[lm-docker] 완료 → $($h.out)" -ForegroundColor Green
  }

  'stop' {
    wsl -- docker rm -f $Container 2>&1 | Out-Null
    Write-Host "[lm-docker] 서버 정지·제거됨."
    Write-Host "[lm-docker] GPU/통합메모리 완전 회수: wsl --shutdown"
  }

  default { throw "알 수 없는 명령: $Command" }
}
