#!/usr/bin/env pwsh
<#
Idempotent refactor script (PowerShell)
Creates directories and moves files using git mv when source exists and destination doesn't.
Run from the frontend folder: .\scripts\refactor_structure.ps1
#>
Set-StrictMode -Version Latest
Write-Output "Running refactor script (PowerShell)"

$root = Resolve-Path "$(Join-Path $PSScriptRoot '..')"
Write-Output "Workspace root: $root"

function Ensure-Dir($p) {
    if (-not (Test-Path $p)) {
        New-Item -ItemType Directory -Path $p -Force | Out-Null
        Write-Output "mkdir $p"
    }
}

Push-Location $root

Write-Output "Creating target directory structure..."
@(
    'src/app/layouts',
    'src/app/providers',
    'src/routes',
    'src/domains/auth/hooks',
    'src/domains/auth/services',
    'src/domains/timesheet/pages',
    'src/domains/timesheet/components/calendar',
    'src/domains/timesheet/components/panels',
    'src/domains/timesheet/components/staging',
    'src/domains/timesheet/hooks/staging',
    'src/domains/timesheet/hooks/dayEntry',
    'src/domains/timesheet/models',
    'src/domains/timesheet/services',
    'src/domains/commesse/pages',
    'src/domains/commesse/components',
    'src/domains/commesse/models',
    'src/domains/commesse/services',
    'src/domains/accordi-quadro/pages',
    'src/domains/accordi-quadro/models',
    'src/domains/accordi-quadro/services',
    'src/domains/gare/pages',
    'src/domains/gare/hooks',
    'src/domains/gare/models',
    'src/domains/tags/components',
    'src/domains/tags/hooks',
    'src/domains/tags/models',
    'src/shared/components/Avatar',
    'src/shared/components/Bars',
    'src/shared/components/Buttons',
    'src/shared/components/BadgeCard',
    'src/shared/components/Calendar',
    'src/shared/dialogs',
    'src/shared/hooks',
    'src/shared/utils',
    'src/shared/theme'
) | ForEach-Object { Ensure-Dir $_ }

function Move-IfExists($src, $dst) {
    if (Test-Path $src -PathType Any) {
        if (-not (Test-Path $dst -PathType Any)) {
            git mv $src $dst
            if ($LASTEXITCODE -eq 0) { Write-Output "git mv $src -> $dst" } else { Write-Warning "git mv failed for $src -> $dst" }
        } else {
            Write-Output "skip (exists) $dst"
        }
    } else {
        Write-Output "skip (missing) $src"
    }
}

Write-Output "Attempting git mv moves (only when source exists and destination missing)..."

# Mapping (non-exhaustive; safe - only moves if source exists)
Move-IfExists 'src/Pages/Timesheet' 'src/domains/timesheet/pages'
Move-IfExists 'src/Components/Calendar' 'src/domains/timesheet/components/calendar'
Move-IfExists 'src/Components/Timesheet/StagedChangesPanel.jsx' 'src/domains/timesheet/components/staging/StagedChangesPanel.jsx'
Move-IfExists 'src/Components/Timesheet/TimesheetStagingBar.jsx' 'src/domains/timesheet/components/staging/TimesheetStagingBar.jsx'
Move-IfExists 'src/Components/Timesheet/EditEntryDialog.jsx' 'src/shared/dialogs/EditEntryDialog.jsx'
Move-IfExists 'src/Components/Timesheet/SegnalazioneDialog.jsx' 'src/shared/dialogs/SegnalazioneDialog.jsx'
Move-IfExists 'src/Components/Calendar/DayEntryPanel.jsx' 'src/domains/timesheet/components/panels/DayEntryPanel.jsx'
Move-IfExists 'src/Hooks/Timesheet' 'src/domains/timesheet/hooks'
Move-IfExists 'src/Hooks/useAuth.js' 'src/domains/auth/hooks/useAuth.js'
Move-IfExists 'src/Services/projectService.js' 'src/domains/timesheet/services/projectService.js'
Move-IfExists 'src/Services/api.js' 'src/domains/timesheet/services/api.js'
Move-IfExists 'src/Services/userService.js' 'src/domains/auth/services/userService.js'
Move-IfExists 'src/Layouts' 'src/app/layouts'
Move-IfExists 'src/Theme' 'src/shared/theme'
Move-IfExists 'src/Utils' 'src/shared/utils'
Move-IfExists 'src/Components/Bars' 'src/shared/components/Bars'
Move-IfExists 'src/Components/Buttons' 'src/shared/components/Buttons'
Move-IfExists 'src/Components/BadgeCard' 'src/shared/components/BadgeCard'
Move-IfExists 'src/Components/Calendar/TileLegend.jsx' 'src/shared/components/Calendar/TileLegend.jsx'
Move-IfExists 'src/Components/Avatar' 'src/shared/components/Avatar'

Write-Output "Refactor script finished. Review 'git status' and run 'git add -A; git commit -m "refactor: moves"' when ready."

Pop-Location
