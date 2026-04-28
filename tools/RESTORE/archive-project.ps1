# archive-project.ps1
# QC-FLOW project archive (ZIP), excluding .gitignore entries
# Output: qc-flow-YY-MM-DD.zip (overwrites if same date)

$projectRoot = (git -C $PSScriptRoot rev-parse --show-toplevel 2>$null)
if (-not $projectRoot) {
    Write-Host "ERROR: git root not found." -ForegroundColor Red
    return
}

$date = Get-Date -Format "yy-MM-dd"
$archiveName = "qc-flow-$date.zip"
$archivePath = Join-Path $projectRoot $archiveName

if (Test-Path $archivePath) {
    Write-Host "Overwriting: $archiveName" -ForegroundColor Yellow
    Remove-Item $archivePath -Force
}

# Step 1: git archive (tracked files, respects .gitignore, handles unicode)
Write-Host "Archiving tracked files via git archive..."
git -C $projectRoot archive --format=zip --prefix="" -o "$archivePath" HEAD

if (-not (Test-Path $archivePath)) {
    Write-Host "ERROR: git archive failed." -ForegroundColor Red
    return
}

# Step 2: add untracked (not ignored) files via 7z if available
$untracked = @(git -C $projectRoot ls-files --others --exclude-standard)
if ($untracked.Count -gt 0) {
    $sevenZ = Get-Command 7z -ErrorAction SilentlyContinue
    if ($sevenZ) {
        Write-Host "Adding $($untracked.Count) untracked files via 7z..."
        Push-Location $projectRoot
        foreach ($f in $untracked) {
            7z a "$archivePath" "$f" 2>&1 | Out-Null
        }
        Pop-Location
    } else {
        Write-Host "WARN: $($untracked.Count) untracked files skipped (install 7z to include)" -ForegroundColor Yellow
        foreach ($f in $untracked) { Write-Host "  - $f" -ForegroundColor DarkGray }
    }
}

$sizeBytes = (Get-Item $archivePath).Length
$sizeMB = [Math]::Round($sizeBytes / 1048576, 2)
Write-Host "Done: $archiveName - $sizeMB MB" -ForegroundColor Green
