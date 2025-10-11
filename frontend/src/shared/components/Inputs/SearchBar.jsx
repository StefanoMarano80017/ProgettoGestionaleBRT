import { useState, useRef, useEffect } from "react";
import {
	Box,
	TextField,
	Popper,
	Paper,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	ClickAwayListener,
	Typography,
	InputAdornment,
	alpha,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardIcon from "@mui/icons-material/Keyboard";

export default function SearchBar() {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const inputRef = useRef(null);

	const searchScopes = ["Commesse", "Progetti", "Dipendenti", "Documenti"];

	const handleChange = (e) => {
		const value = e.target.value;
		setQuery(value);
		setOpen(value.length > 0 || open);
	};

	const handleSelect = (scope) => {
		console.log(`Cerca "${query}" in ${scope}`);
		setOpen(false);
		setQuery("");
	};

	const handleClickAway = () => {
		setOpen(false);
	};

	useEffect(() => {
		const handleKeyDown = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setOpen((prev) => {
					if (!prev) inputRef.current?.focus();
					return !prev;
				});
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<ClickAwayListener onClickAway={handleClickAway}>
			<Box sx={{ position: "relative", minWidth: 280 }}>
				<TextField
					fullWidth
					placeholder="Cerca..."
					inputRef={inputRef}
					value={query}
					onChange={handleChange}
					variant="outlined"
					onFocus={() => setOpen(true)}
					size="small"
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon 
									fontSize="small" 
									sx={{ color: 'text.secondary' }} 
								/>
							</InputAdornment>
						),
						endAdornment: (
							<InputAdornment position="end">
								<Box 
									sx={{ 
										display: "flex", 
										alignItems: "center", 
										gap: 0.5,
										bgcolor: (theme) => alpha(theme.palette.action.hover, 0.5),
										px: 1,
										py: 0.25,
										borderRadius: 1,
										border: '1px solid',
										borderColor: 'divider',
									}}
								>
									<KeyboardIcon fontSize="small" sx={{ fontSize: 14 }} />
									<Typography 
										variant="caption" 
										sx={{ 
											fontSize: '0.7rem',
											fontWeight: 500,
											letterSpacing: 0.5,
										}}
									>
										Ctrl+K
									</Typography>
								</Box>
							</InputAdornment>
						),
						sx: { 
							borderRadius: 2,
							bgcolor: (theme) => alpha(theme.palette.action.hover, 0.3),
							'&:hover': {
								bgcolor: (theme) => alpha(theme.palette.action.hover, 0.4),
							},
							'&.Mui-focused': {
								bgcolor: 'background.paper',
							},
							transition: 'all 0.2s ease',
						},
					}}
					sx={{
						'& .MuiOutlinedInput-root': {
							'& fieldset': {
								borderColor: 'divider',
								transition: 'all 0.2s ease',
							},
							'&:hover fieldset': {
								borderColor: 'primary.main',
							},
							'&.Mui-focused fieldset': {
								borderColor: 'primary.main',
								borderWidth: 2,
							},
						},
					}}
				/>
				<Popper
					open={open}
					anchorEl={inputRef.current}
					placement="bottom-start"
					style={{ width: inputRef.current?.offsetWidth, zIndex: 1300 }}
				>
					<Paper 
						elevation={8}
						sx={{
							mt: 0.5,
							border: 1,
							borderColor: 'divider',
							borderRadius: 2,
							overflow: 'hidden',
						}}
					>
						<List dense sx={{ py: 0.5 }}>
							{searchScopes.map((scope) => (
								<ListItem key={scope} disablePadding>
									<ListItemButton 
										onClick={() => handleSelect(scope)}
										sx={{
											py: 1,
											px: 2,
											'&:hover': {
												bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
											},
										}}
									>
										<ListItemText
											primary={
												query.length > 0
													? `Cerca "${query}" in ${scope}`
													: `Cerca in ${scope}`
											}
											primaryTypographyProps={{
												fontSize: '0.875rem',
												fontWeight: 500,
											}}
										/>
									</ListItemButton>
								</ListItem>
							))}
						</List>
					</Paper>
				</Popper>
			</Box>
		</ClickAwayListener>
	);
}