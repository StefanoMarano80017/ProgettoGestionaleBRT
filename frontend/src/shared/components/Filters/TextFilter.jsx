import React from "react";
import { TextField } from "@mui/material";

// Migrated from Components/DataGridDashboard/Filters/TextFilter.jsx
const TextFilter = ({ textFilter, setTextFilter, placeholder = "Cerca Progetti/Task" }) => (
	<TextField
		label={placeholder}
		size="small"
		value={textFilter}
		onChange={(e) => setTextFilter(e.target.value)}
		fullWidth
	/>
);

export default TextFilter;
