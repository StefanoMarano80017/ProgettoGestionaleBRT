import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { DEBUG_TS } from '@config/debug';
import { Box, Stack, Typography, Button, Tooltip, Alert, Divider, Chip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EntryListItem from "@shared/components/Entries/EntryListItem";
import EditEntryDialog from "@shared/dialogs/EditEntryDialog";
import ConfirmDialog from "@shared/components/ConfirmDialog";
// TileLegend is rendered in the calendar area; monthly summary chips are shown in this panel
import Paper from '@mui/material/Paper';
import { useDayEntryDerived, useConfirmDelete } from '@domains/timesheet/hooks/dayEntry';
import PropTypes from 'prop-types';
import computeDayUsed from '@domains/timesheet/hooks/utils/computeDayUsed.js';
// STUB: moved to panels/DayEntryPanel.jsx. Kept for backward compatibility; will be removed after import rewrite.
export * from '@domains/timesheet/components/panels/DayEntryPanel.jsx';
export { default } from '@domains/timesheet/components/panels/DayEntryPanel.jsx';
// a proprietà (dialog/startAdd/startEdit/commit) che non esistono più nell'API
