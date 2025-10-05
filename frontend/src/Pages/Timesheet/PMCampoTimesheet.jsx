import React from 'react';
import { Box, Container, Typography } from '@mui/material';

// Temporary stub for PMCampoTimesheet
// The original page is large and under rework. Replace with a harmless placeholder
// so routing and role checks can continue without executing heavy logic.
export default function PMCampoTimesheet() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h5" sx={{ mb: 2 }}>Timesheet PM Campo (temporarily disabled)</Typography>
        <Typography variant="body2">This page is being rewritten. For now it is intentionally stubbed to avoid interfering with bug fixes elsewhere.</Typography>
      </Container>
    </Box>
  );
}
