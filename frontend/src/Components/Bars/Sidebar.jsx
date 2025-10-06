import { Box, List, Divider, Avatar, Typography, Button } from '@mui/material';
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import useAuth from '@/domains/auth/hooks/useAuth';
import { PAGES as pages } from '@/Routes/pagesConfig';
import LogoGestionale from '@/assets/LogoGestionale.png';
import { getInitials, renderIcon } from './sidebarUtils';

/**
 * Sidebar navigation component.
 * Displays a vertical list of navigation entries plus the current user avatar/name.
 *
 * Props:
 * - userName?: fallback display name if auth context has no user
 * - onLogout?: optional callback, falling back to AuthContext.logout
 * - collapsed?: shrink variant (currently only affects width)
 */
export default function Sidebar({ userName, onLogout, collapsed = false }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Derive display name from context or prop. Memoize to avoid recalculations.
  const displayName = useMemo(
    () => (user ? `${user.nome} ${user.cognome}` : userName || 'Ospite'),
    [user, userName]
  );
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  return (
    <Box
      sx={{
        width: collapsed ? 60 : 100,
        transition: 'width 0.3s',
        bgcolor: 'customBackground.main',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img src={LogoGestionale} alt="Logo" style={{ maxWidth: '47%', height: 'auto' }} />
      </Box>

      {/* Pages */}
      <List sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {pages.map(page => (
          <SidebarItem
            key={page.text}
            icon={renderIcon(page.icon, { fontSize: 22 })}
            text={page.text}
            path={page.path}
            selected={location.pathname === page.path}
          />
        ))}
      </List>

      {/* User section */}
      <Box
        sx={{
          justifyContent: 'center',
          my: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <SidebarItem
          key={displayName}
          icon={
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'customGreen.main' }}>
              <Typography variant="subtitle2" sx={{ lineHeight: 2, fontWeight: 500 }}>
                {initials}
              </Typography>
            </Avatar>
          }
          text={displayName}
          path={'/timesheet'}
          selected={false}
        />
        <Button size="small" onClick={onLogout || logout}>Logout</Button>
      </Box>
      <Divider />
    </Box>
  );
}
