Add-Type -AssemblyName System.Windows.Forms

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;

public class WinAPI {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

    [DllImport("user32.dll")]
    public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool repaint);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    public static List<IntPtr> FoundHandles = new List<IntPtr>();
    public static string SearchTitle = "";

    public static bool Callback(IntPtr hWnd, IntPtr lParam) {
        StringBuilder sb = new StringBuilder(256);
        GetWindowText(hWnd, sb, sb.Capacity);
        if (sb.ToString().Contains(SearchTitle)) {
            FoundHandles.Add(hWnd);
        }
        return true;
    }

    public static void FindWindows(string title) {
        SearchTitle = title;
        FoundHandles.Clear();
        EnumWindows(Callback, IntPtr.Zero);
    }
}
"@

[WinAPI]::FindWindows(".pen")
$handles = [WinAPI]::FoundHandles

if ($handles.Count -eq 0) {
    Write-Host "Pencil window not found."
    return
}

$cursorPos = [System.Windows.Forms.Cursor]::Position
$screen = [System.Windows.Forms.Screen]::FromPoint($cursorPos)
$wa = $screen.WorkingArea

$winW = [Math]::Min(1200, [int]($wa.Width * 0.8))
$winH = [Math]::Min(800,  [int]($wa.Height * 0.8))
$posX = $wa.X + [int](($wa.Width  - $winW) / 2)
$posY = $wa.Y + [int](($wa.Height - $winH) / 2)

foreach ($h in $handles) {
    $sb = New-Object System.Text.StringBuilder 256
    [WinAPI]::GetWindowText($h, $sb, $sb.Capacity) | Out-Null
    Write-Host "Moving: $($sb.ToString()) -> $($screen.DeviceName) ($posX,$posY) ${winW}x${winH}"

    [WinAPI]::ShowWindow($h, 9)          | Out-Null
    [WinAPI]::MoveWindow($h, $posX, $posY, $winW, $winH, $true) | Out-Null
    [WinAPI]::SetForegroundWindow($h)    | Out-Null
}

$configPath = "$env:APPDATA\Pencil\config.json"
if (Test-Path $configPath) {
    $raw = Get-Content $configPath -Raw -Encoding UTF8
    $raw = $raw -replace '("x"\s*:\s*)-?\d+', "`${1}$posX"
    $raw = $raw -replace '("y"\s*:\s*)-?\d+', "`${1}$posY"
    $raw = $raw -replace '("width"\s*:\s*)\d+', "`${1}$winW"
    $raw = $raw -replace '("height"\s*:\s*)\d+', "`${1}$winH"
    [System.IO.File]::WriteAllText($configPath, $raw, [System.Text.UTF8Encoding]::new($false))
    Write-Host "config.json saved: ($posX,$posY) ${winW}x${winH}"
}
