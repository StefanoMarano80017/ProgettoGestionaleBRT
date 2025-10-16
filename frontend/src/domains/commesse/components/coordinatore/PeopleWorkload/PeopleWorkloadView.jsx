import React from 'react';
import PropTypes from 'prop-types';
import { Virtuoso } from 'react-virtuoso';
import {
  Paper,
  Stack,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Drawer,
  Button,
  Box,
  Card,
  CardContent,
  Tooltip,
  Avatar,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors.js';
import { getAvatarPalette } from '@shared/utils/avatarColors.js';
import LaunchIcon from '@mui/icons-material/Launch';

function EmployeeList({ rows, onCommessaOpen, onOpenTimesheet }) {
  const theme = useTheme();
  const containerSx = {
    flex: 1,
    minHeight: 0,
    height: '100%',
    bgcolor: (t) => (t.palette.mode === 'dark' ? t.palette.background.default : t.palette.grey[100]),
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    p: 2,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  if (rows.length === 0) {
    return (
      <Box sx={containerSx}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            bgcolor: 'action.hover',
            borderRadius: 2,
            px: 3,
            py: 6,
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Nessuna persona disponibile in questo periodo
          </Typography>
        </Box>
      </Box>
    );
  }

  const itemContent = (index) => {
    const row = rows[index];
    if (!row) return null;

    const first = (row.firstName || '').trim();
    const last = (row.lastName || '').trim();
    const nameParts = (row.name || '').trim().split(/\s+/).filter(Boolean);
    const initials = (first || last)
      ? `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
      : nameParts.length === 0
        ? (row.employeeId || '??').slice(0, 2).toUpperCase()
        : nameParts.length === 1
          ? nameParts[0].slice(0, 2).toUpperCase()
          : `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    const seed = [first, last].filter(Boolean).join(' ') || row.name || row.employeeId || 'dipendente';
    const { background: avatarBackground, border: avatarBorder } = getAvatarPalette({
      seed,
      fullName: row.name,
      name: first,
      surname: last,
      firstName: row.firstName,
      lastName: row.lastName,
      nome: row.nome,
      cognome: row.cognome,
      employeeId: row.employeeId,
    });
    const avatarTextColor = theme.palette.getContrastText(avatarBackground);
    const assigned = Array.isArray(row.assigned) ? row.assigned : [];

    return (
      <Box sx={{ pb: index === rows.length - 1 ? 0 : 1.5 }}>
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: 1,
            },
          }}
        >
          <CardContent
            sx={{
              p: 2,
              '&:last-child': { pb: 2 },
              display: 'flex',
              alignItems: 'center',
              minHeight: 86,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <Avatar
                sx={{
                  bgcolor: avatarBackground,
                  color: avatarTextColor,
                  width: 44,
                  height: 44,
                  fontSize: '1rem',
                  fontWeight: 600,
                  border: '2px solid',
                  borderColor: avatarBorder,
                  flexShrink: 0,
                }}
              >
                {initials}
              </Avatar>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 700, flexShrink: 0 }}>
                  {row.name}
                </Typography>
                <Chip
                  size="small"
                  label={row.employeeId}
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5, flexShrink: 0 }}
                />
                <Chip
                  size="small"
                  label={row.company || 'N/D'}
                  color="info"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5, flexShrink: 0 }}
                />
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0, ml: 'auto' }}>
                <Tooltip title="Apri timesheet dipendente">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => onOpenTimesheet?.(row.employeeId)}
                      disabled={!onOpenTimesheet}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <LaunchIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
                {assigned.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Nessuna commessa
                  </Typography>
                ) : (
                  <>
                    {assigned.slice(0, 3).map((commessa) => {
                      const color = getCommessaColor(commessa.code);
                      const background = getCommessaColorLight(commessa.code, 0.12);
                      return (
                        <Tooltip
                          key={`${row.employeeId}-${commessa.id}`}
                          title={`${commessa.label} · ${commessa.hours}h`}
                          arrow
                        >
                          <Chip
                            size="small"
                            label={`${commessa.code} · ${commessa.hours}h`}
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: background,
                              color,
                              borderRadius: 1.5,
                              cursor: 'pointer',
                            }}
                            clickable
                            onClick={() => onCommessaOpen?.(commessa.id)}
                          />
                        </Tooltip>
                      );
                    })}
                    {assigned.length > 3 && (
                      <Tooltip
                        title={assigned.slice(3).map((c) => `${c.label} · ${c.hours}h`).join(', ')}
                        arrow
                      >
                        <Chip
                          size="small"
                          label={`+${assigned.length - 3}`}
                          variant="outlined"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: 1.5,
                          }}
                        />
                      </Tooltip>
                    )}
                  </>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  };

  return (
    <Box sx={containerSx}>
      <Virtuoso
        data={rows}
        style={{ width: '100%', flex: 1, height: '100%' }}
        itemContent={itemContent}
      />
    </Box>
  );
}

EmployeeList.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCommessaOpen: PropTypes.func,
  onOpenTimesheet: PropTypes.func,
};

function PanelContent({
  loading,
  error,
  rows,
  onCommessaOpen,
  onOpenTimesheet,
}) {
  return (
    <Box
      sx={{
        p: 3,
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        minHeight: 0,
      }}
    >
      {loading && (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
          <CircularProgress size={28} />
        </Stack>
      )}
      {error && !loading && (
        <Alert severity="error">{error.message || 'Errore caricamento workload'}</Alert>
      )}
      {!loading && !error && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <EmployeeList
            rows={rows}
            onCommessaOpen={onCommessaOpen}
            onOpenTimesheet={onOpenTimesheet}
          />
        </Box>
      )}
    </Box>
  );
}

PanelContent.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCommessaOpen: PropTypes.func,
  onOpenTimesheet: PropTypes.func,
};

export default function PeopleWorkloadView({
  loading,
  error,
  rows,
  isMobile,
  drawerOpen,
  onToggleDrawer,
  onCloseDrawer,
  onCommessaOpen,
  onOpenTimesheet,
}) {
  if (isMobile) {
    return (
      <Box sx={{ width: '100%' }}>
        <Button variant="outlined" onClick={onToggleDrawer} fullWidth>
          {drawerOpen ? 'Chiudi workload' : 'Apri workload'}
        </Button>
        <Drawer anchor="right" open={drawerOpen} onClose={onCloseDrawer} PaperProps={{ sx: { width: 360 } }}>
          <PanelContent
            loading={loading}
            error={error}
            rows={rows}
            onCommessaOpen={onCommessaOpen}
            onOpenTimesheet={onOpenTimesheet}
          />
        </Drawer>
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        borderRadius: 3, 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        border: '2px solid', 
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <PanelContent
        loading={loading}
        error={error}
        rows={rows}
        onCommessaOpen={onCommessaOpen}
        onOpenTimesheet={onOpenTimesheet}
      />
    </Paper>
  );
}

PeopleWorkloadView.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  isMobile: PropTypes.bool,
  drawerOpen: PropTypes.bool,
  onToggleDrawer: PropTypes.func,
  onCloseDrawer: PropTypes.func,
  onCommessaOpen: PropTypes.func,
  onOpenTimesheet: PropTypes.func,
};
