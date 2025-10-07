import React, { useState, useMemo, useCallback, useEffect, useRef } from "react"; // eslint-disable-line no-unused-vars
import { DEBUG_TS } from '@config/debug';
import { Box, Stack, Typography, Button, Tooltip, Alert, Divider, Chip } from "@mui/material"; // eslint-disable-line no-unused-vars
import AddIcon from "@mui/icons-material/Add"; // eslint-disable-line no-unused-vars
import EntryListItem from "@shared/components/Entries/EntryListItem"; // eslint-disable-line no-unused-vars
import EditEntryDialog from "@shared/dialogs/EditEntryDialog"; // eslint-disable-line no-unused-vars
import ConfirmDialog from "@shared/components/ConfirmDialog"; // eslint-disable-line no-unused-vars
// TileLegend is rendered in the calendar area; monthly summary chips are shown in this panel
import Paper from '@mui/material/Paper'; // eslint-disable-line no-unused-vars
import { useDayEntryDerived, useConfirmDelete } from '@domains/timesheet/hooks/dayEntry'; // eslint-disable-line no-unused-vars
import PropTypes from 'prop-types'; // eslint-disable-line no-unused-vars
import computeDayUsed from '@domains/timesheet/hooks/utils/computeDayUsed.js'; // eslint-disable-line no-unused-vars
// STUB: moved to panels/DayEntryPanel.jsx. Kept for backward compatibility; will be removed after import rewrite.
export * from '@domains/timesheet/components/panels/DayEntryPanel.jsx';
export { default } from '@domains/timesheet/components/panels/DayEntryPanel.jsx';
// a proprietà (dialog/startAdd/startEdit/commit) che non esistono più nell'API
