import React from "react";
import { Paper, Stack, Typography, Box } from "@mui/material";
import EntryListItem from "@components/Entries/EntryListItem";

/**
 * EntryListPanel
 * Props:
 * - title: string
 * - items: array of objects
 * - renderItem?: (item) => ReactNode (optional)
 * - actions?: (item) => ReactNode (optional) // slot for edit/delete
 */
export default function EntryListPanel({ title, items = [], actions }) {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>{title}</Typography>
      {!items.length ? (
        <Typography variant="body2">Nessun elemento.</Typography>
      ) : (
        <Stack spacing={1}>
          {items.map((it, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1, borderRadius: 1 }}>
              <EntryListItem
                item={it}
                actions={actions ? actions(it) : undefined}
              />
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
