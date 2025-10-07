import * as React from "react";
import { Box, Breadcrumbs, Tooltip } from "@mui/material";
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
			{ href: "/home", label: pageMeta.home?.label || "Home", icon: renderIcon(pageMeta.home?.icon || HomeOutlinedIcon, { fontSize: "medium" }) },
		];
		if (path === "/" || path === "/home") return items;
		let acc = "";
		segments.forEach((seg) => {
			if (seg === "home") return;
			acc += `/${seg}`;
			const { icon, label } = pageMeta[seg] || {};
			items.push({ href: acc, label: label || seg, icon: renderIcon(icon || FolderOpenIcon, { fontSize: "medium" }) });
		});
		return items;
	}, [location.pathname, pageMeta]);
	return (
		<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", bgcolor: "customBackground.main", pr: 6, pl: 2, py: 1, position: "relative", gap: 1 }}>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				<Breadcrumbs separator={<KeyboardArrowRightIcon />} aria-label="Percorso">
					{crumbs.map((c, idx) => {
						const isLast = idx === crumbs.length - 1;
						const iconColor = isLast
							? (location.pathname.toLowerCase().startsWith("/timesheet")
									? (mode === "light" ? "customBlue3.main" : "customBlue1.main")
									: "primary.main")
							: "text.secondary";
						const iconBox = (
							<Box sx={{ display: "inline-flex", alignItems: "center", color: iconColor, "&:hover": { color: "text.primary" } }}>{c.icon}</Box>
						);
						return isLast ? (
							<Tooltip key={c.href} title={c.label}><span>{iconBox}</span></Tooltip>
						) : (
							<Tooltip key={c.href} title={c.label}>
								<Box component={RouterLink} to={c.href} sx={{ textDecoration: "none" }}>{iconBox}</Box>
							</Tooltip>
						);
					})}
				</Breadcrumbs>
			</Box>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
				<SearchBar />
				<NotificationsMenu />
				<ThemeSwitchComponent checked={mode === "dark"} onChange={toggleTheme} />
			</Box>
		</Box>
	);
}