import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PropTypes from 'prop-types';
import { AvatarInitials } from '@components/Avatar/AvatarInitials';

/**
 * TaskDetailCard
 *
 * Displays a task summary card with progress and a scrollable list of sub-items.
 * - props.task: the task object. Expected shape: { id, title, description, progress, items: [{ id?, name, status }] }
 */
/**
 * TaskDetailCard
 *
 * Displays a task summary card with progress and a scrollable list of sub-items.
 */
export function TaskDetailCard({ task }) {
  if (!task) {
    return (
      <Card sx={{ maxWidth: 345, p: 2 }}>
        <CardContent>
          <Typography>Seleziona un task per vedere i dettagli</Typography>
        </CardContent>
      </Card>
    );
  }

  const handleNavigate = React.useCallback(() => {
    // TODO: wire up router/navigation
    // Keep the callback stable to avoid re-renders in IconButton
    console.log('Naviga al task', task?.id);
  }, [task?.id]);

  const handleItemClick = React.useCallback((item) => {
    // small, stable handler for item clicks
    console.log('Clicked:', item?.name, item?.id);
  }, []);

  const progressValue = typeof task.progress === 'number' ? Math.max(0, Math.min(100, task.progress)) : null;

  return (
    <Card sx={{ border: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6">{task.title}</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 120, pr: 1 }}>
          <Chip label={`${task.progress || 0}%`} size="small" />
          <IconButton size="small" onClick={handleNavigate} aria-label="open-task">
            <OpenInNewIcon />
          </IconButton>
        </Box>
      </Box>

      {progressValue !== null && <LinearProgress variant="determinate" value={progressValue} />}

      <CardContent sx={{ p: 0, m: 0 }}>
        <Typography variant="body2" sx={{ py: 2, px: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          {task.description || 'Nessuna descrizione disponibile.'}
        </Typography>

        <List sx={{ width: '100%', maxHeight: 200, overflowY: 'auto' }}>
          {task.items?.map((item, index) => (
            <ListItem
              key={item?.id ?? index}
              button
              onClick={() => handleItemClick(item)}
              sx={{ pt: 0.5, justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <AvatarInitials size={28} fullName={item.name} />
                <Typography variant="body2">{item.name}</Typography>
              </Box>

              <Chip
                label={item.status}
                color={item.status === 'completo' ? 'success' : item.status === 'in corso' ? 'warning' : 'default'}
                size="small"
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

TaskDetailCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.any,
    title: PropTypes.string,
    description: PropTypes.string,
    progress: PropTypes.number,
    items: PropTypes.array,
  }),
};

TaskDetailCard.displayName = 'TaskDetailCard';

export default React.memo(TaskDetailCard);
