import React from 'react';
import { Paper } from '@mui/material';
import { StagedChangesPanel } from './index.js';

/**
 * TimesheetStagingBar
 * Unified wrapper for the staging panel so that both employee and admin pages
 * share identical look & behavior. Eliminates duplicated Paper styling.
 *
 * Props passthrough: all StagedChangesPanel props plus container options.
 */
export default function TimesheetStagingBar({
  elevation = 8,
  sticky = true,
  top = 0,
  zIndex = 20,
  sx = {},
  panelProps = {},
  ...panelDirectProps
}) {
  return (
    <Paper
      elevation={elevation}
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        bgcolor: 'customBackground.main',
        position: sticky ? 'sticky' : 'static',
        top: sticky ? top : undefined,
        zIndex: sticky ? zIndex : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        ...sx,
      }}
    >
      <StagedChangesPanel compact maxVisible={5} showLegend {...panelProps} {...panelDirectProps} />
    </Paper>
  );
}
