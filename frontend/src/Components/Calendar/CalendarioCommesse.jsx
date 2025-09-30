import React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { styled } from '@mui/material/styles';
import dayjs from 'dayjs';

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) => prop !== 'dayStatus',
})(({ theme, dayStatus }) => ({
  ...(dayStatus === 'full' && {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    },
    '&.Mui-selected': {
        backgroundColor: theme.palette.success.dark,
    }
  }),
  ...(dayStatus === 'partial' && {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.warning.dark,
    },
    '&.Mui-selected': {
        backgroundColor: theme.palette.warning.dark,
    }
  }),
  ...(dayStatus === 'empty' && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.common.white,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
    '&.Mui-selected': {
        backgroundColor: theme.palette.error.dark,
    }
  }),
}));

const ServerDay = (props) => {
  const { day, dayStatus, ...other } = props;

  return (
    <CustomPickersDay
      {...other}
      day={day}
      dayStatus={dayStatus}
    />
  );
};

const CalendarioCommesse = ({ projectsData }) => {
  const getDayStatus = (day) => {
    const dateStr = day.format('YYYY-MM-DD');
    const dayData = projectsData[dateStr];

    if (!dayData || dayData.length === 0) {
      // Puoi decidere come trattare i giorni non presenti nel mock.
      // Qui li considero "non lavorati" e quindi non colorati.
      return undefined;
    }

    const totalHours = dayData.reduce((acc, curr) => acc + curr.ore, 0);

    if (totalHours === 8) {
      return 'full'; // Verde
    }
    if (totalHours > 0 && totalHours < 8) {
      return 'partial'; // Giallo
    }
    if (totalHours === 0) {
      return 'empty'; // Rosso
    }
    return undefined;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        slots={{
          day: ServerDay,
        }}
        slotProps={{
          day: (day) => ({
            dayStatus: getDayStatus(day),
          }),
        }}
      />
    </LocalizationProvider>
  );
};

export default CalendarioCommesse;