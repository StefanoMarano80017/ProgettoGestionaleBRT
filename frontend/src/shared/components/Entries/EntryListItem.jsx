import React from "react";
import { Stack, Chip, Typography, IconButton, Box } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { getCommessaColor } from '@shared/utils/commessaColors';

const getChipProps = (commessa) => {
	if (commessa === "FERIE") return { color: "success", icon: <BeachAccessIcon fontSize="small" /> };
	if (commessa === "MALATTIA") return { color: "secondary", icon: <LocalHospitalIcon fontSize="small" /> };
	if (commessa === "PERMESSO" || commessa === "ROL") return { color: "info", icon: <ScheduleIcon fontSize="small" /> };
	return { color: "default", icon: undefined };
};

export default function EntryListItem({ item = {}, actions, onEdit, onDelete }) {
	const comm = item.commessa || item.name || "-";
	const chipProps = getChipProps(item.commessa);
	// Get color for all entries (special entries get their predefined colors)
	const commessaColor = getCommessaColor(comm);
	
	return (
		<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
			<Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
				{/* Color dot for ALL entries */}
				<Box 
					sx={{ 
						width: 10, 
						height: 10, 
						borderRadius: '50%', 
						backgroundColor: commessaColor,
						flexShrink: 0,
						boxShadow: `0 0 0 2px ${commessaColor}30`,
						border: '1px solid',
						borderColor: 'background.paper'
					}} 
				/>
				<Chip
					size="small"
					label={comm}
					color={chipProps.color}
					icon={chipProps.icon}
					variant="filled"
					sx={{ 
						borderRadius: 1,
						fontWeight: 600,
						boxShadow: `0 0 0 2px ${commessaColor}20`,
						// Override MUI colors with our hash-based colors for consistency
						...(chipProps.color === "default" ? {
							backgroundColor: commessaColor,
							color: 'white',
							'& .MuiChip-label': {
								fontWeight: 600
							}
						} : {})
					}}
				/>
				<Typography variant="body2" sx={{ flex: 1 }} noWrap title={item.descrizione || item.desc || "—"}>
					{item.descrizione || item.desc || "—"}
				</Typography>
			</Stack>
			<Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
				{item.ore !== undefined && (
					<Chip size="small" variant="outlined" label={`${item.ore}h`} />
				)}
				{actions ? (
					actions
				) : (
					<>
						{onEdit && (
							<IconButton size="small" onClick={onEdit}>
								<EditIcon fontSize="small" />
							</IconButton>
						)}
						{onDelete && (
							<IconButton size="small" color="error" onClick={onDelete}>
								<DeleteIcon fontSize="small" />
							</IconButton>
						)}
					</>
				)}
			</Stack>
		</Stack>
	);
}