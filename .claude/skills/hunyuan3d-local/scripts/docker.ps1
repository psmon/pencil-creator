<#
  Hunyuan3D Docker 모드 매니저 (WSL2 + ROCm, PBR 풀 파이프라인).
  네이티브 Windows는 custom_rasterizer HIP 빌드 불가 → Linux 컨테이너에서 PBR 생성.

  usage:
    docker.ps1 build                         # 이미지 빌드 (최초 1회, 오래 걸림)
    docker.ps1 diag                          # 컨테이너 안에서 GPU/custom_rasterizer 점검
    docker.ps1 gen --image ref.png --out m.glb            # 이미지 → PBR 3D
    docker.ps1 gen --prompt "cute idol" --out m.glb        # 텍스트 → (t2i) → PBR 3D
    docker.ps1 gen --image ref.png --out m.glb --skip-paint
    docker.ps1 stop                          # 컨테이너 정리 (+ WSL 종료로 GPU 메모리 완전 회수 안내)

  요구: WSL2(Ubuntu) + Docker + /dev/dxg (rocminfo가 gfx1151 인식). $args 원시 파싱(--out 충돌 회피).
#>
$ErrorActionPreference = 'Stop'
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir   = Split-Path -Parent $ScriptDir
$DockerCtx  = Join-Path $SkillDir 'docker'
$Image      = 'hunyuan3d-rocm:latest'
$WorkWin    = Join-Path $SkillDir 'work'   # 입출력 교환 디렉토리 (Windows)
$ImageGen   = Join-Path (Split-Path (Split-Path $SkillDir)) 'pencil-design\scripts\image-gen.py'

function To-WslPath([string]$winPath) {
  # C:\a\b → /mnt/c/a/b
  $p = (Resolve-Path $winPath -ErrorAction SilentlyContinue)?.Path
  if (-not $p) { $p = $winPath }
  $p = $p -replace '\\','/'
  if ($p -match '^([A-Za-z]):/(.*)$') { return "/mnt/$($matches[1].ToLower())/$($matches[2])" }
  return $p
}

# GPU 패스스루 공통 플래그 (+ 호스트 WSL ROCm 런타임 마운트)
# torch 번들 libhsa 는 네이티브(KFD)용이라 WSL /dev/dxg 를 못 쓴다.
# 호스트의 WSL 패치 ROCm(librocdxg) + WSL libhsakmt 를 컨테이너에 마운트해 GPU 접근을 살린다.
# 호스트 WSL ROCm 루트(예: /opt/rocm-7.2.4) — librocdxg + libamdhip64.so.7 + dev 헤더 + hipcc 겸용.
# GPU 접근(런타임)과 custom_rasterizer 빌드(호스트 ROCm) 둘 다 이 마운트를 쓴다.
$hostRocmRoot = "$(wsl -- bash -lc 'readlink -f /opt/rocm 2>/dev/null')".Trim()
$hostHsakmt   = "$(wsl -- bash -lc 'find /usr/lib/x86_64-linux-gnu -name libhsakmt.so.1 2>/dev/null | head -1')".Trim()
# ~/.cache 전체를 볼륨에 (Hunyuan3D 는 ~/.cache/hy3dgen, HF 는 ~/.cache/huggingface 사용 → 둘 다 지속)
$GpuFlags = @('--device=/dev/dxg','-v','/usr/lib/wsl:/usr/lib/wsl',
              '-v','hy3d-cache:/root/.cache')
if ($hostRocmRoot) { $GpuFlags += @('-v', "${hostRocmRoot}:/opt/rocm-host:ro") }
else { Write-Warning "[hy3d-docker] 호스트 WSL ROCm 미탐지 — GPU/텍스처 불가(WSL 내 ROCm 설치 확인)" }
if ($hostHsakmt)   { $GpuFlags += @('-v', "${hostHsakmt}:/opt/wsl-hsakmt/libhsakmt.so.1:ro") }

$argv = @($args)
if ($argv.Count -lt 1) { throw "usage: docker.ps1 <build|diag|gen|stop> [args]" }
$Command = [string]$argv[0]
$Rest = if ($argv.Count -gt 1) { $argv[1..($argv.Count-1)] } else { @() }

function Parse-Rest {
  $h = @{}
  for ($i=0; $i -lt $Rest.Count; $i++) {
    switch ($Rest[$i]) {
      '--image'      { $h.image = $Rest[++$i] }
      '--prompt'     { $h.prompt = $Rest[++$i] }
      '--out'        { $h.out = $Rest[++$i] }
      '--skip-paint' { $h.skip = $true }
      '--views'      { $h.views = $Rest[++$i] }
      '--resolution' { $h.res = $Rest[++$i] }
      '--seed'       { $h.seed = $Rest[++$i] }
    }
  }
  return $h
}

switch ($Command) {

  'build' {
    $ctxWsl = To-WslPath $DockerCtx
    Write-Host "[hy3d-docker] 이미지 빌드: $Image  (context: $ctxWsl)"
    Write-Host "  (torch gfx1151 + Hunyuan3D + custom_rasterizer HIP 빌드 — 수십 분 소요)"
    wsl -- bash -lc "cd '$ctxWsl' && DOCKER_BUILDKIT=1 docker build -t $Image ."
  }

  'diag' {
    Write-Host "[hy3d-docker] 컨테이너 GPU/custom_rasterizer 점검"
    wsl -- docker run --rm @GpuFlags $Image --diag
  }

  'gen' {
    $h = Parse-Rest
    New-Item -ItemType Directory -Force -Path $WorkWin | Out-Null

    # 입력 이미지 확보: --image 직접 or --prompt→t2i(Windows image-gen, JSON 경로 반환)
    if (-not $h.image -and $h.prompt) {
      $fullPrompt = "$($h.prompt), single character, full body, front view, centered, clean plain white background, crisp silhouette, character reference sheet"
      Write-Host "[hy3d-docker] t2i: $fullPrompt"
      $json = & py -3.14 $ImageGen generate --prompt $fullPrompt --topic 'hy3d-t2i' --provider gemini --aspect-ratio '3:4' | Select-Object -Last 1
      $res = $json | ConvertFrom-Json
      if ($res.status -ne 'ok') { throw "t2i 실패: $json" }
      # image-gen은 프로젝트 루트 상대경로 반환
      $projRoot = Split-Path (Split-Path (Split-Path $SkillDir))
      $h.image = Join-Path $projRoot $res.path
      if (-not (Test-Path $h.image)) { throw "t2i 산출 이미지 없음: $($h.image)" }
    }
    if (-not $h.image) { throw "--image 또는 --prompt 필요" }
    if (-not $h.out)   { $h.out = Join-Path $WorkWin 'out.glb' }

    # 입력 이미지를 work 디렉토리로 복사 → 컨테이너 /work 마운트
    $inName = [IO.Path]::GetFileName($h.image)
    $inWork = Join-Path $WorkWin $inName
    if ((Resolve-Path $h.image).Path -ne (Join-Path $WorkWin $inName)) { Copy-Item $h.image $inWork -Force }
    $outName = [IO.Path]::GetFileName($h.out)

    $workWsl = To-WslPath $WorkWin
    $genArgs = @('--image', "/work/$inName", '--out', "/work/$outName")
    if ($h.skip)  { $genArgs += '--skip-paint' }
    if ($h.views) { $genArgs += @('--views', $h.views) }
    if ($h.res)   { $genArgs += @('--resolution', $h.res) }
    if ($h.seed)  { $genArgs += @('--seed', $h.seed) }

    Write-Host "[hy3d-docker] 생성: $($genArgs -join ' ')"
    wsl -- docker run --rm @GpuFlags -v "${workWsl}:/work" $Image @genArgs

    # 결과를 최종 out 경로로
    $producedWork = Join-Path $WorkWin $outName
    if (Test-Path $producedWork) {
      if ((Split-Path $h.out -Parent)) { New-Item -ItemType Directory -Force -Path (Split-Path $h.out -Parent) | Out-Null }
      if ($producedWork -ne $h.out) { Copy-Item $producedWork $h.out -Force }
      $kb = [math]::Round((Get-Item $h.out).Length/1KB,1)
      Write-Host "[hy3d-docker] 완료 → $($h.out)  ($kb KB)"
    } else {
      Write-Warning "[hy3d-docker] 출력 GLB를 찾지 못함: $producedWork"
    }
  }

  'stop' {
    Write-Host "[hy3d-docker] 실행 중 컨테이너 정리"
    wsl -- bash -lc "docker ps -q --filter ancestor=$Image | xargs -r docker stop"
    Write-Host "[hy3d-docker] GPU 메모리까지 완전 회수하려면(WSL 메모리 버그 대응):"
    Write-Host "    wsl --shutdown        # WSL 전체 종료 → 통합메모리 반납"
  }

  default { throw "알 수 없는 명령: $Command" }
}
