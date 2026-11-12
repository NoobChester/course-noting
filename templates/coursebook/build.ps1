param(
    [string]$Target = "All"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Resolve Tectonic binary dynamically (PATH -> local tools -> sibling tools -> winget standard)
$TectonicCmd = Get-Command "tectonic" -ErrorAction SilentlyContinue
if ($TectonicCmd) {
    $Tectonic = $TectonicCmd.Source
} elseif (Test-Path "$ScriptDir\tools\tectonic.exe") {
    $Tectonic = "$ScriptDir\tools\tectonic.exe"
} elseif (Test-Path "$ScriptDir\..\tools\tectonic.exe") {
    $Tectonic = "$ScriptDir\..\tools\tectonic.exe"
} else {
    Write-Warning "Tectonic not found in PATH or tools/. PDF compilation skipped."
    exit 0
}

$OutputDir = "$ScriptDir\output"
$StandaloneOut = "$OutputDir\standalone"
if (-not (Test-Path $StandaloneOut)) {
    New-Item -ItemType Directory -Force -Path $StandaloneOut | Out-Null
}

if ($Target -eq "All" -or $Target -eq "Main") {
    Write-Host "Compiling Master Textbook with Tectonic..."
    & $Tectonic -Z search-path=$ScriptDir --outdir $OutputDir "$ScriptDir\main.tex"
}

if ($Target -eq "All" -or $Target.StartsWith("Ch")) {
    $standaloneFiles = Get-ChildItem -Path "$ScriptDir\standalone" -Filter "*.tex" -ErrorAction SilentlyContinue
    foreach ($file in $standaloneFiles) {
        if ($Target -eq "All" -or $file.BaseName -eq $Target.ToLower()) {
            Write-Host "Compiling Standalone Chapter: $($file.Name)..."
            & $Tectonic -Z search-path=$ScriptDir --outdir $StandaloneOut $file.FullName
        }
    }
}
Write-Host "Compilation complete."
