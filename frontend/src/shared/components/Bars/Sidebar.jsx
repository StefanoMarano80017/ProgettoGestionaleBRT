import { Box, List, Divider, Avatar, Typography, Button, alpha } from '@mui/material';
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import useAuth from '@/domains/auth/hooks/useAuth';
import { PAGES as pages } from '@/Routes/pagesConfig';
import LogoGestionale from '@/assets/LogoGestionale.png';
import { getInitials, renderIcon } from './sidebarUtils';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Sidebar({ userName, onLogout, collapsed = false }) {
	const location = useLocation();
	const { user, logout } = useAuth();
	const displayName = useMemo(() => (user ? `${user.nome} ${user.cognome}` : userName || 'Ospite'), [user, userName]);
	const initials = useMemo(() => getInitials(displayName), [displayName]);
	
	return (
		<Box 
			sx={{ 
				width: collapsed ? 80 : 120, 
				transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
				bgcolor: 'background.paper',
				height: '100vh', 
				display: 'flex', 
				flexDirection: 'column',
				borderRight: 1,
				borderColor: 'divider',
				position: 'relative',
				boxShadow: (theme) => `2px 0 12px ${alpha(theme.palette.common.black, 0.04)}`,
			}}
		>
			{/* Logo Section with subtle background */}
			<Box 
				sx={{ 
					p: 1.5, 
					display: 'flex', 
					justifyContent: 'center', 
					alignItems: 'center',
					bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
					borderBottom: 1,
					borderColor: 'divider',
					minHeight: 60,
				}}
			>
				<img 
					src={LogoGestionale} 
					alt="Logo" 
					style={{ 
						maxWidth: '49%', 
						height: 'auto',
						transition: 'transform 0.3s ease',
					}} 
				/>
			</Box>

			{/* Navigation Items */}
			<List 
				sx={{ 
					flexGrow: 1, 
					display: 'flex', 
					flexDirection: 'column',
					gap: 0.5,
					px: 1.5,
					py: 2,
				}}
			>
				{pages.map(page => (
					<SidebarItem
						key={page.text}
						icon={renderIcon(page.icon, { fontSize: 24 })}
						text={page.text}
						path={page.path}
						selected={location.pathname === page.path}
					/>
				))}
			</List>

			{/* User Section */}
			<Box 
				sx={{ 
					display: 'flex', 
					flexDirection: 'column', 
					alignItems: 'center', 
					gap: 1.5,
					px: 1.5,
					py: 2.5,
					borderTop: 1,
					borderColor: 'divider',
					bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
				}}
			>
				{/* User Avatar with hover effect */}
				<Box
					sx={{
						position: 'relative',
						'&:hover .user-avatar': {
							transform: 'scale(1.05)',
							boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.customGreen.main, 0.3)}`,
						},
					}}
				>
					<Avatar 
						className="user-avatar"
						sx={{ 
							width: 48, 
							height: 48, 
							bgcolor: 'customGreen.main',
							cursor: 'pointer',
							transition: 'all 0.3s ease',
							border: 2,
							borderColor: 'background.paper',
							boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.customGreen.main, 0.2)}`,
						}}
					>
						<Typography 
							variant="subtitle1" 
							sx={{ 
								fontWeight: 600,
								color: 'white',
							}}
						>
							{initials}
						</Typography>
					</Avatar>
				</Box>

				{/* User Name */}
				<Typography 
					variant="caption" 
					sx={{ 
						fontWeight: 500,
						textAlign: 'center',
						maxWidth: '100%',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						lineHeight: 1.3,
						color: 'text.secondary',
					}}
				>
					{displayName}
				</Typography>

				{/* Logout Button */}
				<Button 
					size="small" 
					variant="outlined"
					startIcon={<LogoutIcon fontSize="small" />}
					onClick={onLogout || logout}
					sx={{
						fontSize: '0.75rem',
						py: 0.75,
						px: 2,
						borderRadius: 2,
						textTransform: 'none',
						fontWeight: 500,
						borderColor: 'divider',
						color: 'text.secondary',
						'&:hover': {
							borderColor: 'error.main',
							bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
							color: 'error.main',
							transform: 'translateY(-1px)',
						},
						transition: 'all 0.2s ease',
					}}
				>
					Logout
				</Button>
			</Box>
		</Box>
	);
}