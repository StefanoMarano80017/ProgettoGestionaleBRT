import React, { useState } from "react";
import {
  Breadcrumbs,
  Button,
  Menu,
  MenuItem,
  Box,
  IconButton,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

export default function CustomBreadcrumbs({ items = [] }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Home solo icona
  const homeCrumb = (
    <IconButton
      key="home"
      size="small"
      component="a"
      href="/"
      color="inherit"
      sx={{ mb: 0.2 }}
    >
      <HomeIcon fontSize="small" />
    </IconButton>
  );

  let crumbs = [];
  if (items.length <= 3) {
    crumbs = items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      return (
        <Button
          key={idx}
          size="small"
          variant={isLast ? "contained" : "text"}
          color={isLast ? "primary" : "inherit"}
          component={item.href ? "a" : "button"}
          href={item.href}
          onClick={item.onClick}
        >
          {item.label}
        </Button>
      );
    });
  } else {
    // Condensazione centrale
    const first = (
      <Button
        key="first"
        size="small"
        variant="text"
        color="inherit"
        component={items[0].href ? "a" : "button"}
        href={items[0].href}
        onClick={items[0].onClick}
      >
        {items[0].label}
      </Button>
    );

    const last = (
      <Button
        key="last"
        size="small"
        variant="text"
        color="primary"
        component={items[items.length - 1].href ? "a" : "button"}
        href={items[items.length - 1].href}
        onClick={items[items.length - 1].onClick}
      >
        {items[items.length - 1].label}
      </Button>
    );

    const middle = (
      <Button
        key="ellipsis"
        size="small"
        color="inherit"
        onClick={handleOpenMenu}
      >
        ...
      </Button>
    );

    crumbs = [first, middle, last];
  }

  return (
    <Box>
      <Breadcrumbs separator=">">
        {homeCrumb}
        {crumbs}
      </Breadcrumbs>

      {/* Menu dropdown per elementi centrali */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        {items.slice(1, -1).map((item, idx) => (
          <MenuItem
            key={idx}
            component={item.href ? "a" : "li"}
            href={item.href}
            onClick={() => {
              item.onClick?.();
              handleCloseMenu();
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
