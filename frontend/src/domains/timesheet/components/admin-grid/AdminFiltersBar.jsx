import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Paper,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { ROLES } from '@mocks/UsersMock';
import CalendarHeader from '@domains/timesheet/components/calendar/CalendarHeader';

/**
 * AdminFiltersBar
 * Pure presentational component for filtering employees in admin timesheet grid
 */
export function AdminFiltersBar({
  value,
  onChange,
  month,
  year,
  onMonthPrev,
  onMonthNext,
  onToday,
  onDateSelect
}) {
  const handleFieldChange = (field) => (event) => {
    onChange({ ...value, [field]: event.target.value });
  };

  const handleRoleChange = (event) => {
    const {
      target: { value: selectedValue },
    } = event;
    onChange({
      ...value,
      roles: typeof selectedValue === 'string' ? selectedValue.split(',') : selectedValue,
    });
  };

  const roleOptions = [
    { value: 'all', label: 'Tutti' },
    { value: ROLES.DIPENDENTE, label: 'Dipendente' },
    { value: ROLES.OPERAIO, label: 'Operaio' },
    { value: ROLES.PM_CAMPO, label: 'PM Campo' },
    { value: ROLES.COORDINATORE, label: 'Coordinatore' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'staged', label: 'Solo con modifiche' },
    { value: 'non-work', label: 'Con assenze' }
  ];

  const aziendaOptions = [
    { value: 'all', label: 'Tutte' },
    { value: 'BRT', label: 'BRT' },
    { value: 'INWAVE', label: 'INWAVE' },
    { value: 'STEP', label: 'STEP' }
  ];

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack spacing={2}>
        {/* Month Navigation with Calendar Picker */}
        <CalendarHeader
          month={month}
          year={year}
          onPrevMonth={onMonthPrev || (() => {})}
          onNextMonth={onMonthNext || (() => {})}
          onDateSelect={onDateSelect}
          onToday={onToday}
          sx={{ mb: 0 }}
        />

        {/* Filters Row */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(5, 1fr)'
            },
            gap: 2
          }}
        >
          {/* Search */}
          <TextField
            size="small"
            placeholder="Cerca nome/cognome..."
            value={value.search || ''}
            onChange={handleFieldChange('search')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {/* Roles */}
          <FormControl size="small" fullWidth>
            <InputLabel>Ruoli</InputLabel>
            <Select
              multiple
              value={value.roles || ['all']}
              onChange={handleRoleChange}
              input={<OutlinedInput label="Ruoli" />}
              renderValue={(selected) => {
                if (selected.includes('all')) return 'Tutti';
                return selected.map(r => roleOptions.find(o => o.value === r)?.label || r).join(', ');
              }}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Azienda */}
          <FormControl size="small" fullWidth>
            <InputLabel>Azienda</InputLabel>
            <Select
              value={value.azienda || 'all'}
              onChange={handleFieldChange('azienda')}
              label="Azienda"
            >
              {aziendaOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Commessa Search */}
          <TextField
            size="small"
            placeholder="Filtra per commessa..."
            value={value.commessa || ''}
            onChange={handleFieldChange('commessa')}
          />

          {/* Status */}
          <FormControl size="small" fullWidth>
            <InputLabel>Stato</InputLabel>
            <Select
              value={value.status || 'all'}
              onChange={handleFieldChange('status')}
              label="Stato"
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Stack>
    </Paper>
  );
}

AdminFiltersBar.propTypes = {
  value: PropTypes.shape({
    search: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
    azienda: PropTypes.string,
    commessa: PropTypes.string,
    status: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  month: PropTypes.number.isRequired,
  year: PropTypes.number.isRequired,
  onMonthPrev: PropTypes.func,
  onMonthNext: PropTypes.func,
  onToday: PropTypes.func,
  onDateSelect: PropTypes.func.isRequired
};

export default AdminFiltersBar;
