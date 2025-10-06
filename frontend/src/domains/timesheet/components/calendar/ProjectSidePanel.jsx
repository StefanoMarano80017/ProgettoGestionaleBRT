import * as React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography, Pagination } from '@mui/material';
import { TaskDetailCard } from '@domains/timesheet/components/calendar/TaskDetailCard';

/**
 * ProjectSidePanel
 * Shows a paginated list of task cards for the selected day.
 */
export function ProjectSidePanel({ tasks }) {
  const pageSize = 2; // two cards per page
  const safeTasks = React.useMemo(() => Array.isArray(tasks) ? tasks : [], [tasks]);

  const totalPages = Math.max(1, Math.ceil(safeTasks.length / pageSize));
  const [page, setPage] = React.useState(1); // Pagination is 1-based

  const handleChange = React.useCallback((_, value) => setPage(value), []);

  const currentTasks = React.useMemo(() => safeTasks.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize), [safeTasks, page, pageSize]);

  if (safeTasks.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%' }}>
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>Seleziona un giorno con task</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, flexGrow: 1, maxHeight: 'calc(100% - 60px)' }}>
        {currentTasks.map((task) => (
          <TaskDetailCard key={task.id} task={task} />
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={totalPages} page={page} onChange={handleChange} color="primary" />
      </Box>
    </Box>
  );
}

ProjectSidePanel.propTypes = {
  tasks: PropTypes.array,
};

ProjectSidePanel.displayName = 'ProjectSidePanel';

export default React.memo(ProjectSidePanel);
