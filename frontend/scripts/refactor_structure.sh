#!/usr/bin/env bash
# idempotent refactor script: creates directories and moves files using git mv when present
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
echo "Workspace root: $root"

mkdir_p() {
  if [ ! -d "$1" ]; then
    mkdir -p "$1" && echo "mkdir $1"
  fi
}

cd "$root"

echo "Creating target directory structure..."
mkdir_p src/app/layouts
mkdir_p src/app/providers
mkdir_p src/routes
mkdir_p src/domains/auth/hooks
mkdir_p src/domains/auth/services
mkdir_p src/domains/timesheet/pages
mkdir_p src/domains/timesheet/components/calendar
mkdir_p src/domains/timesheet/components/panels
mkdir_p src/domains/timesheet/components/staging
mkdir_p src/domains/timesheet/hooks/staging
mkdir_p src/domains/timesheet/hooks/dayEntry
mkdir_p src/domains/timesheet/models
mkdir_p src/domains/timesheet/services
mkdir_p src/domains/commesse/pages
mkdir_p src/domains/commesse/components
mkdir_p src/domains/commesse/models
mkdir_p src/domains/commesse/services
mkdir_p src/domains/accordi-quadro/pages
mkdir_p src/domains/accordi-quadro/models
mkdir_p src/domains/accordi-quadro/services
mkdir_p src/domains/gare/pages
mkdir_p src/domains/gare/hooks
mkdir_p src/domains/gare/models
mkdir_p src/domains/tags/components
mkdir_p src/domains/tags/hooks
mkdir_p src/domains/tags/models
mkdir_p src/shared/components/Avatar
mkdir_p src/shared/components/Bars
mkdir_p src/shared/components/Buttons
mkdir_p src/shared/components/BadgeCard
mkdir_p src/shared/components/Calendar
mkdir_p src/shared/dialogs
mkdir_p src/shared/hooks
mkdir_p src/shared/utils
mkdir_p src/shared/theme

echo "Attempting git mv moves (only when source exists and destination missing)..."
move_if_exists() {
  src="$1"
  dst="$2"
  if [ -e "$src" ] && [ ! -e "$dst" ]; then
    git mv -k "$src" "$dst" && echo "git mv $src -> $dst"
  else
    if [ ! -e "$src" ]; then
      echo "skip (missing) $src"
    else
      echo "skip (exists) $dst"
    fi
  fi
}

# Mapping (non-exhaustive; safe - only moves if source exists)
move_if_exists src/Pages/Timesheet src/domains/timesheet/pages
move_if_exists src/Components/Calendar src/domains/timesheet/components/calendar
move_if_exists src/Components/Timesheet/StagedChangesPanel.jsx src/domains/timesheet/components/staging/StagedChangesPanel.jsx
move_if_exists src/Components/Timesheet/TimesheetStagingBar.jsx src/domains/timesheet/components/staging/TimesheetStagingBar.jsx
move_if_exists src/Components/Timesheet/EditEntryDialog.jsx src/shared/dialogs/EditEntryDialog.jsx
move_if_exists src/Components/Timesheet/SegnalazioneDialog.jsx src/shared/dialogs/SegnalazioneDialog.jsx
move_if_exists src/Components/Calendar/DayEntryPanel.jsx src/domains/timesheet/components/panels/DayEntryPanel.jsx
move_if_exists src/Hooks/Timesheet src/domains/timesheet/hooks
move_if_exists src/Hooks/useAuth.js src/domains/auth/hooks/useAuth.js
move_if_exists src/Services/projectService.js src/domains/timesheet/services/projectService.js
move_if_exists src/Services/api.js src/domains/timesheet/services/api.js
move_if_exists src/Services/userService.js src/domains/auth/services/userService.js
move_if_exists src/Layouts src/app/layouts
move_if_exists src/Theme src/shared/theme
move_if_exists src/Utils src/shared/utils
move_if_exists src/Components/Bars src/shared/components/Bars
move_if_exists src/Components/Buttons src/shared/components/Buttons
move_if_exists src/Components/BadgeCard src/shared/components/BadgeCard
move_if_exists src/Components/Calendar/TileLegend.jsx src/shared/components/Calendar/TileLegend.jsx
move_if_exists src/Components/Avatar src/shared/components/Avatar

echo "Refactor script finished. Review 'git status' and run 'git add -A && git commit -m "refactor: moves"' when ready."
