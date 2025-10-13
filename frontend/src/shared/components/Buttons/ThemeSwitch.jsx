import React from 'react';
import { IconButton, Box, alpha } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import PropTypes from 'prop-types';

export function ThemeSwitch({ checked = false, onChange }) {
	const isDark = checked;

	return (
		<IconButton
			onClick={onChange}
			sx={{
				position: 'relative',
				width: 56,
				height: 32,
				borderRadius: 4,
				padding: 0,
				overflow: 'hidden',
				border: '2px solid',
				borderColor: 'divider',
				bgcolor: isDark 
					? 'grey.900'
					: 'primary.main',
				transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				'&:hover': {
					bgcolor: isDark 
						? 'grey.800'
						: 'primary.dark',
					borderColor: isDark ? 'grey.700' : 'primary.light',
					transform: 'scale(1.05)',
				},
				'&:active': {
					transform: 'scale(0.98)',
				},
			}}
		>
			{/* Sliding Circle */}
			<Box
				sx={{
					position: 'absolute',
					top: '50%',
					left: isDark ? 'calc(100% - 26px)' : '4px',
					transform: 'translateY(-50%)',
					width: 22,
					height: 22,
					borderRadius: '50%',
					bgcolor: 'background.paper',
					boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.common.black, 0.3)}`,
					transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 2,
				}}
			>
				{/* Icon inside circle */}
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						animation: 'rotate 0.4s ease-in-out',
						'@keyframes rotate': {
							'0%': { transform: 'rotate(0deg) scale(0)', opacity: 0 },
							'50%': { transform: 'rotate(180deg) scale(1.2)', opacity: 0.5 },
							'100%': { transform: 'rotate(360deg) scale(1)', opacity: 1 },
						},
					}}
				>
					{isDark ? (
						<DarkModeIcon 
							sx={{ 
								fontSize: 14, 
								color: '#FFD700',
							}} 
						/>
					) : (
						<LightModeIcon 
							sx={{ 
								fontSize: 14, 
								color: 'warning.main',
							}} 
						/>
					)}
				</Box>
			</Box>

			{/* Background Icons */}
			<Box
				sx={{
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					px: 0.75,
					zIndex: 1,
				}}
			>
				{/* Sun Icon (left side) */}
				<LightModeIcon
					sx={{
						fontSize: 14,
						color: isDark ? alpha('#FDB813', 0.3) : alpha('#fff', 0.9),
						transition: 'all 0.3s ease',
						opacity: isDark ? 0.3 : 0.9,
						transform: isDark ? 'rotate(0deg) scale(0.8)' : 'rotate(180deg) scale(1)',
					}}
				/>
				
				{/* Moon Icon (right side) */}
				<DarkModeIcon
					sx={{
						fontSize: 14,
						color: isDark ? '#FFD700' : alpha('#1a237e', 0.3),
						transition: 'all 0.3s ease',
						opacity: isDark ? 1 : 0.3,
						transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(0.8)',
					}}
				/>
			</Box>
		</IconButton>
	);
}

ThemeSwitch.propTypes = { 
	checked: PropTypes.bool, 
	onChange: PropTypes.func 
};

export default React.memo(ThemeSwitch);