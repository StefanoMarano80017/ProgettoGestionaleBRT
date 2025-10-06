import React, { useState } from "react";
import {
	MenuItem,
	Checkbox,
	ListItemIcon,
	ListItemText,
	Box,
	Divider,
	Typography,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	OutlinedInput,
} from "@mui/material";
import { AvatarInitials } from "@shared/components/Avatar/AvatarInitials";
import { JoinLeft, JoinInner, Search } from "@mui/icons-material";
import ColorDot from "@shared/components/Filters/ColorDot"; // updated path after migration

const EmployeeFilter = ({
	employees,
	employeeFilter,
	setEmployeeFilter,
	mode,
	setMode,
}) => {
	const [search, setSearch] = useState("");

	const toggleEmployee = (id) => {
		setEmployeeFilter((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
		);
	};

	const filteredEmployees = employees.filter((emp) =>
		emp.name.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<Box sx={{ px: 2, py: 1 }}>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					mb: 1,
				}}
			>
				<Typography variant="subtitle2">
					<ColorDot color="secondary" /> Dipendenti
				</Typography>

				<ToggleButtonGroup
					value={mode}
					exclusive
					onChange={(e, newMode) => newMode && setMode(newMode)}
					size="small"
				>
					<ToggleButton value="some">
						Some
						<Tooltip title="Mostra i task che contengono almeno un dipendente selezionato">
							<JoinLeft fontSize="small" />
						</Tooltip>
					</ToggleButton>
						<ToggleButton value="every">
							Every
							<Tooltip title="Mostra solo i task che contengono tutti i dipendenti selezionati">
								<JoinInner fontSize="small" />
							</Tooltip>
						</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			<OutlinedInput
				size="small"
				placeholder="Cerca dipendente..."
				startAdornment={<Search fontSize="small" sx={{ mr: 1 }} />}
				fullWidth
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				sx={{ mb: 1 }}
			/>

			<Divider sx={{ my: 1 }} />

			<Box sx={{ Height: 100, overflowY: "auto" }}>
				{filteredEmployees.map((emp) => (
					<MenuItem key={emp.id} onClick={() => toggleEmployee(emp.id)}>
						<ListItemIcon>
							<Checkbox checked={employeeFilter.includes(emp.id)} />
						</ListItemIcon>
						<ListItemText
							primary={
								<Box display="flex" alignItems="center" gap={1}>
									<AvatarInitials
										name={emp.name.split(" ")[0] || ""}
										surname={emp.name.split(" ")[1] || ""}
										size={24}
									/>
									{emp.name}
								</Box>
							}
						/>
					</MenuItem>
				))}
			</Box>
		</Box>
	);
};

export default EmployeeFilter;
