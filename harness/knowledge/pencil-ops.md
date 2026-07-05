# Pencil Ops — 환경/운영 노하우

> Pencil(.pen 편집기, Electron 앱) 자체의 운영·트러블슈팅 지식.
> 디자인 품질 평가가 아니라 **작업 환경 복구** 절차를 다룬다.
> Pencil exe: `C:\Users\psmon\AppData\Local\Programs\Pencil\Pencil.exe`

---

## OPS1. 펜슬 창이 화면 밖으로 사라짐 (멀티모니터 위치 복구)

### 증상
- 보조 모니터를 분리/재배치한 뒤 펜슬 창이 안 보임.
- "주모니터로 옮겨줘" 요청. 닫았다 켜도 다시 화면 밖으로 감.

### 근본 원인
- 펜슬은 **종료 시 현재 창 좌표를 `config.json`에 저장**하고, 다음 실행 때 그대로 복원한다.
- 저장 위치(레지스트리 아님, **이 파일이 유일한 출처**):
  ```
  C:\Users\psmon\AppData\Roaming\Pencil\config.json
  ```
  ```json
  "windowBounds": { "x": -3473, "y": 186, "width": 928, "height": 852 }
  ```
- `x`가 음수(예: -1737, -3473)면 존재하지 않는 모니터 좌표 = 화면 밖.
- **악순환**: 창이 화면 밖인 상태로 닫으면 그 off-screen 좌표가 또 저장됨 → 닫아도 안 고쳐짐.

### 진단 절차
1. 메인 창 핸들 찾기 — 펜슬은 헬퍼 프로세스가 여럿이라 `MainWindowHandle != 0` 인 것만 실제 창:
   ```powershell
   Get-Process -Name Pencil | Where-Object { $_.MainWindowHandle -ne 0 } |
     Select-Object Id, MainWindowHandle, @{N='Title';E={$_.MainWindowTitle}}
   ```
   - ⚠️ `Select-Object -First 1` 만 쓰면 핸들 0인 헬퍼를 집어 `GetWindowRect`가 0,0,0,0 반환 → 실패. 반드시 `Where MainWindowHandle -ne 0` 필터.
2. 현재 좌표 확인 → `x`가 음수면 화면 밖 확정.
3. `config.json`의 `windowBounds.x` 값과 대조 (보통 일치 또는 더 큰 음수).

### 즉시 복구 (런타임 — 떠 있는 창 끌어오기)
```powershell
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int X, int Y, int cx, int cy, uint flags);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
}
"@
$p = Get-Process -Name Pencil | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
$h = $p.MainWindowHandle
[Win32]::ShowWindow($h, 9) | Out-Null          # SW_RESTORE (최소화 해제)
[Win32]::SetWindowPos($h, [IntPtr]::Zero, 200, 80, 1000, 700, 0x44) | Out-Null  # NOZORDER|SHOWWINDOW
[Win32]::SetForegroundWindow($h) | Out-Null
```
- 주 모니터 작업영역: `[System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea` (예: 1440×852). 좌표는 그 안쪽으로.
- ⚠️ `Add-Type`은 PowerShell 세션 간 유지 안 됨 — 타입 정의 + 호출을 **한 호출 안에서** 실행.

### 영구 복구 (재발 방지)
런타임 이동만으론 종료 시 또 off-screen이 저장될 수 있다. 확실히 고치려면:
1. 펜슬 종료 (작업 중 .pen 저장 확인).
2. `config.json`의 `windowBounds`를 주 모니터 좌표로 교체:
   ```json
   "windowBounds": { "x": 200, "y": 80, "width": 1000, "height": 700 }
   ```
3. 재실행 → 주 모니터에서 열림.
- ⚠️ **펜슬 실행 중에는 config.json을 고쳐봐야 종료 시 덮어써짐.** 반드시 종료 후 편집.
- 대안(간편): 런타임 이동으로 창을 주 모니터에 둔 **상태에서** 정상 종료하면 좋은 좌표가 저장됨.

### 핵심 교훈
- 멀티모니터 Electron 앱의 창 실종 = 저장된 `windowBounds`가 사라진 모니터 좌표를 가리킴.
- 위치 출처를 **먼저 조사**(config/레지스트리)한 뒤 고쳐야 재발을 막는다. 런타임 이동은 임시방편.
