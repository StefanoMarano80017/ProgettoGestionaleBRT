import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography } from '@mui/material';
import { Virtuoso } from 'react-virtuoso';
import AdminRow from './AdminRow';

/**
 * AdminTimesheetGrid
 * Virtualized grid of employees with their monthly timesheet data
 * Uses react-virtuoso for performance with 100+ employees
 */
export function AdminTimesheetGrid({
  year,
  month,
  employees,
  dataMap,
  stagedMeta,
  stagingEntries,
  selectedEmployeeId,
  onSelectEmployee,
  onDayDoubleClick,
  onDaySelect,
  selectedDay,
  highlightedDates
}) {
  // Calculate days in month
  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  // Precompute weekend map once
  const isWeekendMap = useMemo(() => {
    const map = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      map[dateStr] = dayOfWeek === 0 || dayOfWeek === 6;
    }
    return map;
  }, [year, month, daysInMonth]);

  // Generate day headers (Mon, Tue, etc.)
  const dayHeaders = useMemo(() => {
    const headers = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month, d).getDay();
      headers.push({
        day: d,
        dayName: dayNames[dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }
    return headers;
  }, [year, month, daysInMonth]);

  // Calculate total content width (employee column + all day tiles)
  const totalContentWidth = useMemo(() => {
    return 240 + (daysInMonth * 60); // 240px employee info + 60px per day
  }, [daysInMonth]);

  // Memoized item content for Virtuoso
  const itemContent = useCallback((index, employee) => {
    return (
      <AdminRow
        key={employee.id}
        employee={employee}
        year={year}
        month={month}
        dataMap={dataMap}
        stagedMetaForEmp={stagedMeta?.[employee.id] || {}}
        stagingEntries={stagingEntries}
        isSelected={selectedEmployeeId === employee.id}
        onSelectEmployee={onSelectEmployee}
        onDayDoubleClick={onDayDoubleClick}
        daysInMonth={daysInMonth}
        isWeekendMap={isWeekendMap}
        totalWidth={totalContentWidth}
        onDaySelect={onDaySelect}
        selectedDay={selectedDay}
        highlightedDates={highlightedDates}
        rowIndex={index}
      />
    );
  }, [year, month, dataMap, stagedMeta, stagingEntries, selectedEmployeeId, onSelectEmployee, onDayDoubleClick, onDaySelect, selectedDay, highlightedDates, daysInMonth, isWeekendMap, totalContentWidth]);

  // Unified drag-to-scroll functionality for entire grid
  const headerScrollRef = React.useRef(null);
  const contentScrollRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const persistedScrollRef = React.useRef({ left: 0, top: 0 });

  // Sync scroll between header and content (horizontal)
  const syncScroll = useCallback((source) => {
    if (source === 'header' && headerScrollRef.current && contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
    } else if (source === 'content' && headerScrollRef.current && contentScrollRef.current) {
      headerScrollRef.current.scrollLeft = contentScrollRef.current.scrollLeft;
    }
  }, []);


  // Mouse down handler - works on both header and content
  const handleMouseDown = useCallback((e, source) => {
    const scrollElement = source === 'header' ? headerScrollRef.current : contentScrollRef.current;
    if (!scrollElement) return;
    
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    scrollLeftRef.current = scrollElement.scrollLeft;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  // Mouse move handler - syncs both header and content
  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    
    const x = e.pageX;
    const walk = (startXRef.current - x) * 2; // Multiply by 2 for faster scrolling
    const newScrollLeft = scrollLeftRef.current + walk;
    
    // Update both header and content simultaneously
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = newScrollLeft;
    }
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollLeft = newScrollLeft;
      persistedScrollRef.current.left = newScrollLeft;
    }
  }, []);

  React.useLayoutEffect(() => {
    const scroller = contentScrollRef.current;
    const header = headerScrollRef.current;
    if (!scroller) return;

    const { left, top } = persistedScrollRef.current;
    if (typeof left === 'number' && scroller.scrollLeft !== left) {
      scroller.scrollLeft = left;
    }
    if (typeof top === 'number' && scroller.scrollTop !== top) {
      scroller.scrollTop = top;
    }
    if (header && typeof left === 'number' && header.scrollLeft !== left) {
      header.scrollLeft = left;
    }
  }, [selectedDay, highlightedDates, selectedEmployeeId, employees]);

  // Fixed header component
  const FixedHeader = () => (
    <Box
      sx={{
        display: 'flex',
        borderBottom: '2px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 2
      }}
    >
      {/* Left Column Header */}
      <Box
        sx={{
          width: 240,
          flexShrink: 0,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          borderRight: '1px solid',
          borderColor: 'divider',
          background: (theme) => 
            `linear-gradient(135deg, ${theme.palette.customBlue3?.main || theme.palette.primary.main} 0%, ${theme.palette.customBlue2?.main || '#006494'} 50%, ${theme.palette.customBlue1?.main || '#00A6FB'} 100%)`,
          color: '#ffffff',
          position: 'sticky',
          left: 0,
          zIndex: 3,
          boxShadow: '2px 0 4px rgba(0,0,0,0.2)'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff' }}>
          Dipendente
        </Typography>
      </Box>

      {/* Days Header with Unified Drag-to-Scroll */}
      <Box
        ref={headerScrollRef}
        onMouseDown={(e) => handleMouseDown(e, 'header')}
        onScroll={() => syncScroll('header')}
        sx={{
          flexGrow: 1,
          overflowX: 'auto',
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing'
          },
          background: (theme) => 
            `linear-gradient(135deg, ${theme.palette.customBlue3?.main || theme.palette.primary.main} 0%, ${theme.palette.customBlue2?.main || '#006494'} 50%, ${theme.palette.customBlue1?.main || '#00A6FB'} 100%)`,
          '&::-webkit-scrollbar': {
            display: 'none' // Hide scrollbar
          },
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none' // IE/Edge
        }}
      >
        <Box
          sx={{
            display: 'flex',
            minWidth: totalContentWidth - 240 // Total width minus employee column
          }}
        >
          {dayHeaders.map(({ day, dayName, isWeekend }) => (
            <Box
              key={day}
              sx={{
                minWidth: 60,
                p: 0.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isWeekend ? 'rgba(0,0,0,0.1)' : 'transparent',
                color: '#ffffff'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  lineHeight: 1,
                  color: '#ffffff'
                }}
              >
                {dayName}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  mt: 0.5,
                  color: '#ffffff'
                }}
              >
                {day}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );

  if (!employees || employees.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 2
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Nessun dipendente trovato con i filtri selezionati
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[6]
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fixed Header */}
      <FixedHeader />

      {/* Virtuoso grid with single scroller */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0 // Allow flex to control height
        }}
      >
        <Virtuoso
          data={employees}
          itemContent={itemContent}
          style={{ height: '100%' }}
          overscan={5}
          components={{
            Scroller: React.forwardRef(({ onScroll, ...props }, forwardedRef) => (
              <Box
                {...props}
                ref={(node) => {
                  contentScrollRef.current = node;
                  if (typeof forwardedRef === 'function') {
                    forwardedRef(node);
                  } else if (forwardedRef) {
                    forwardedRef.current = node;
                  }
                }}
                onMouseDown={(e) => handleMouseDown(e, 'content')}
                onScroll={(event) => {
                  if (onScroll) {
                    onScroll(event);
                  }
                  syncScroll('content');
                  const node = event.currentTarget;
                  if (node) {
                    persistedScrollRef.current = {
                      left: node.scrollLeft,
                      top: node.scrollTop
                    };
                  }
                }}
                sx={{
                  overflowX: 'auto',
                  overflowY: 'auto',
                  height: '100%',
                  cursor: 'grab',
                  '&:active': {
                    cursor: 'grabbing'
                  },
                  '&::-webkit-scrollbar': {
                    width: 8,
                    height: 0
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'divider',
                    borderRadius: 4
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: 'transparent'
                  },
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              />
            )),
            List: React.forwardRef(({ style, ...props }, ref) => (
              <div
                {...props}
                ref={ref}
                style={{
                  ...style,
                  minWidth: totalContentWidth
                }}
              />
            ))
          }}
        />
      </Box>
    </Paper>
  );
}

AdminTimesheetGrid.propTypes = {
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  employees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nome: PropTypes.string.isRequired,
      cognome: PropTypes.string.isRequired,
      roles: PropTypes.arrayOf(PropTypes.string),
      azienda: PropTypes.string
    })
  ).isRequired,
  dataMap: PropTypes.object,
  stagedMeta: PropTypes.object,
  stagingEntries: PropTypes.object,
  selectedEmployeeId: PropTypes.string,
  onSelectEmployee: PropTypes.func,
  onDayDoubleClick: PropTypes.func.isRequired,
  onDaySelect: PropTypes.func,
  selectedDay: PropTypes.string,
  highlightedDates: PropTypes.instanceOf(Set)
};

export default AdminTimesheetGrid;
