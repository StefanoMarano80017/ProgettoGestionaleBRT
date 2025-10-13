import * as React from "react";
import { Box, Breadcrumbs, Tooltip, Typography, Chip, alpha } from "@mui/material";
import SearchBar from "@shared/components/Inputs/SearchBar";
import NotificationsMenu from "@shared/components/NotificationMenu";
import { Link as RouterLink, useLocation } from "react-router-dom";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ThemeSwitchComponent from "@shared/components/Buttons/ThemeSwitch";
import { useThemeContext } from "@shared/hooks/useThemeContext";
import { PAGES } from "@/Routes/pagesConfig";

const renderIcon = (IconOrElement, sx = {}) => {
	const forcedColor = sx?.color ?? "inherit";
	const merged = { ...(IconOrElement?.props?.sx || {}), ...sx, color: forcedColor };
	if (React.isValidElement(IconOrElement)) return React.cloneElement(IconOrElement, { sx: merged });
	const IconComp = IconOrElement;
	return IconComp ? <IconComp sx={merged} /> : null;
};

export default function PageHeader() {
	const location = useLocation();
	const { mode, toggleTheme } = useThemeContext();
	const pageMeta = React.useMemo(() => {
		const meta = {};
		PAGES.forEach(({ path, icon, text }) => {
			const seg = String(path || "").toLowerCase().replace(/^\//, "");
			meta[seg] = { icon, label: text };
		});
		return meta;
	}, []);
	const crumbs = React.useMemo(() => {
		const path = location.pathname.toLowerCase();
		const segments = path.split("/").filter(Boolean);
		const items = [
			{ href: "/home", label: pageMeta.home?.label || "Home", icon: renderIcon(pageMeta.home?.icon || HomeOutlinedIcon, { fontSize: "small" }) },
		];
		if (path === "/" || path === "/home") return items;
		let acc = "";
		segments.forEach((seg) => {
			if (seg === "home") return;
			acc += `/${seg}`;
			const { icon, label } = pageMeta[seg] || {};
			items.push({ href: acc, label: label || seg, icon: renderIcon(icon || FolderOpenIcon, { fontSize: "small" }) });
		});
		return items;
	}, [location.pathname, pageMeta]);
	
	return (
		<Box 
			sx={{ 
				display: "flex", 
				alignItems: "center", 
				justifyContent: "space-between", 
				flexWrap: "wrap", 
				bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
				borderBottom: 1,
				borderColor: 'divider',
				px: 3,
				py: 1.5, 
				position: "sticky",
				top: 0,
				zIndex: 1100,
				gap: 2,
				boxShadow: (theme) => `0 1px 3px ${alpha(theme.palette.common.black, 0.05)}`,
				backdropFilter: 'blur(8px)',
			}}
		>
			{/* Left Section - Breadcrumbs */}
			<Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
				<Breadcrumbs 
					separator={
						<KeyboardArrowRightIcon 
							sx={{ 
								fontSize: 18, 
								color: 'text.disabled',
							}} 
						/>
					} 
					aria-label="Percorso"
					sx={{
						'& .MuiBreadcrumbs-separator': {
							mx: 0.5,
						},
					}}
				>
					{crumbs.map((c, idx) => {
						const isLast = idx === crumbs.length - 1;
						const isTimesheetPath = location.pathname.toLowerCase().startsWith("/timesheet");
						const iconColor = isLast
							? (isTimesheetPath
									? (mode === "light" ? "customBlue3.main" : "customBlue1.main")
									: "primary.main")
							: "text.secondary";
						
						const crumbContent = (
							<Box 
								sx={{ 
									display: "inline-flex", 
									alignItems: "center", 
									gap: 0.75,
									color: iconColor,
									transition: 'all 0.2s ease',
									px: 1.5,
									py: 0.75,
									borderRadius: 1.5,
									bgcolor: isLast 
										? (theme) => alpha(theme.palette.primary.main, 0.08)
										: 'transparent',
									border: '1px solid',
									borderColor: isLast 
										? (theme) => alpha(theme.palette.primary.main, 0.15)
										: 'transparent',
									"&:hover": { 
										color: "primary.main",
										bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
										borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
										transform: isLast ? 'none' : 'translateY(-1px)',
									},
								}}
							>
								{c.icon}
								<Typography 
									variant="body2" 
									sx={{ 
										fontWeight: isLast ? 600 : 500,
										fontSize: '0.875rem',
										letterSpacing: 0.2,
									}}
								>
									{c.label}
								</Typography>
							</Box>
						);
						
						return isLast ? (
							<Tooltip key={c.href} title={c.label}>
								<span>{crumbContent}</span>
							</Tooltip>
						) : (
							<Tooltip key={c.href} title={`Vai a ${c.label}`}>
								<Box 
									component={RouterLink} 
									to={c.href} 
									sx={{ textDecoration: "none" }}
								>
									{crumbContent}
								</Box>
							</Tooltip>
						);
					})}
				</Breadcrumbs>
			</Box>
			
			{/* Right Section - Actions */}
			<Box 
				sx={{ 
					display: "flex", 
					alignItems: "center", 
					gap: 1.5,
					flexShrink: 0,
				}}
			>
				<SearchBar />
				<NotificationsMenu />
				<ThemeSwitchComponent checked={mode === "dark"} onChange={toggleTheme} />
			</Box>
		</Box>
	);
}