<#
  hy3d.py 얇은 래퍼 — venv(Python 3.12)로 런타임 실행.

  usage:
    run.ps1 serve
    run.ps1 gen --image ref.png --out out.glb [--skip-paint] [--no-server]
    run.ps1 gen --prompt "a cute fox" --out fox.glb
    run.ps1 load [--skip-paint] | run.ps1 status | run.ps1 unload | run.ps1 stop

  주의: param() 고급 바인딩을 쓰지 않는다. PowerShell이 --out/--image 같은 인자를
        공통 파라미터(-OutVariable 등)로 부분매칭해 충돌하기 때문. $args 로 원시 수집한다.
  설치 경로 변경: 환경변수 HY3D_INSTALL_DIR 로 지정.
#>
$ErrorActionPreference = 'Stop'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$Hy3d       = Join-Path $ScriptDir 'hy3d.py'
$InstallDir = if ($env:HY3D_INSTALL_DIR) { $env:HY3D_INSTALL_DIR } else { "$env:LOCALAPPDATA\hunyuan3d-local" }
$CfgPath    = Join-Path $InstallDir 'config.json'

$argv = @($args)
if ($argv.Count -lt 1) {
  throw "usage: run.ps1 <serve|serve-fg|gen|load|unload|status|stop> [args]"
}
$Command = [string]$argv[0]
$Rest    = if ($argv.Count -gt 1) { $argv[1..($argv.Count - 1)] } else { @() }

if (-not (Test-Path $CfgPath)) {
  throw "config.json 없음: $CfgPath — 먼저 install.ps1 -Stage all 실행"
}
$cfg = Get-Content $CfgPath -Raw | ConvertFrom-Json
$VenvPy = $cfg.venv_python
if (-not (Test-Path $VenvPy)) { throw "venv python 없음: $VenvPy" }

# HIP 장치 가시성: 시스템이 -1(숨김)로 걸어뒀으면 8060S 를 다시 노출
if (-not $env:HIP_VISIBLE_DEVICES -or $env:HIP_VISIBLE_DEVICES -eq '-1') {
  $env:HIP_VISIBLE_DEVICES = '0'
}

$host_ = $cfg.server.host
$port  = [int]$cfg.server.port
$pingUrl = "http://${host_}:${port}/ping"

function Test-Server {
  try { (Invoke-WebRequest -Uri $pingUrl -TimeoutSec 1 -UseBasicParsing).StatusCode -eq 200 }
  catch { $false }
}

switch ($Command) {

  'serve' {
    if (Test-Server) { Write-Host "[hy3d] 서버 이미 실행 중 ($pingUrl)"; break }
    Write-Host "[hy3d] 서버 백그라운드 기동…"
    $logDir = Join-Path $InstallDir 'logs'
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    $out = Join-Path $logDir 'server.out.log'
    $err = Join-Path $logDir 'server.err.log'
    Start-Process -FilePath $VenvPy -ArgumentList @($Hy3d, 'serve') `
      -WorkingDirectory $ScriptDir -WindowStyle Hidden `
      -RedirectStandardOutput $out -RedirectStandardError $err | Out-Null
    $ok = $false
    for ($i = 0; $i -lt 30; $i++) {
      Start-Sleep -Milliseconds 500
      if (Test-Server) { $ok = $true; break }
    }
    if ($ok) { Write-Host "[hy3d] 서버 준비됨: http://${host_}:${port}  (로그: $out)" }
    else     { Write-Warning "[hy3d] 서버 응답 없음 — 로그 확인: $err" }
  }

  'serve-fg' { & $VenvPy $Hy3d serve @Rest }

  default    { & $VenvPy $Hy3d $Command @Rest }
}
