import React from "react";
import { TextField, Box } from "@mui/material";

const DeadlineFilter = ({ createdFrom, setCreatedFrom, completedTo, setCompletedTo }) => {
	return (
		<Box sx={{ display: "flex", gap: 1 }}>
			<TextField
				label="Creati da"
				type="date"
				size="small"
				InputLabelProps={{ shrink: true }}
				value={createdFrom}
				onChange={(e) => setCreatedFrom(e.target.value)}
				fullWidth
			/>
			<TextField
				label="Chiusi entro"
				type="date"
				size="small"
				InputLabelProps={{ shrink: true }}
				value={completedTo}
				onChange={(e) => setCompletedTo(e.target.value)}
				fullWidth
			/>
		</Box>
	);
};

export default DeadlineFilter;
