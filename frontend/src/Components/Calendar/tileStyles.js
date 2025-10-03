import { alpha } from "@mui/material/styles";

export function getTileSx(theme, {
  isSelected,
  isHoliday,
  isWeekend,
  isOutOfMonth,
  status,
  hasBg,
  bgcolor,
  isWide,
}) {
  const base = {
    position: "relative",
    cursor: "pointer",
    borderRadius: 1,
    height: "100%",
    px: isWide ? 1.25 : 1,
    transition:
      theme.transitions?.create?.(["border-color", "background-color", "box-shadow"], {
        // softer, smoother animation curve and slightly longer duration
        duration: 280,
        easing: theme.transitions?.easing?.easeInOut || "cubic-bezier(.2,.8,.2,1)",
      }) || "border-color 280ms cubic-bezier(.2,.8,.2,1), background-color 280ms cubic-bezier(.2,.8,.2,1), box-shadow 280ms cubic-bezier(.2,.8,.2,1)",
  };

  let boxShadow;

  // Defaults
  let border = `1px solid ${theme.palette.divider}`;
  let backgroundColor = "transparent";
  let color = theme.palette.text.primary;

  if (isSelected) {
  // Strong primary border, but very subtle transparent fill so icons remain visible
  border = `2px solid ${theme.palette.primary.main}`;
  // even more transparent so center icons contrast even better
  backgroundColor = alpha(theme.palette.primary.main, 0.04);
  // keep text/icon colors readable against the subtle fill
  color = theme.palette.text.primary;
  // add a gentle glow to emphasize selection (subtle and theme-aware)
  // base glow is very light; hover intensifies it
  boxShadow = `0 0 0 4px ${alpha(theme.palette.primary.main, 0.03)}`;
  } else if (isHoliday || status === 'holiday') {
    border = `1px solid ${theme.palette.customRed?.main || theme.palette.error.main}`;
    color = theme.palette.customRed?.main || theme.palette.error.main;
  } else if (isWeekend) {
    border = `1px dashed ${theme.palette.divider}`;
    // keep text color inherited/primary for subtlety
  }

  // Status-based soft backgrounds
  if (!isSelected) {
    switch (status) {
      case 'admin-warning':
        border = `1px solid ${theme.palette.error.main}`;
        backgroundColor = alpha(theme.palette.error.main, 0.12);
        color = theme.palette.error.main;
        break;
      case 'ferie':
        backgroundColor = alpha(theme.palette.customPink?.main || theme.palette.secondary.main, 0.10);
        break;
      case 'malattia':
        backgroundColor = alpha(theme.palette.success.main, 0.12);
        break;
      case 'permesso':
        // keep transparent, let dot/icon communicate
        break;
      case 'complete':
      case 'partial':
      case 'future':
      default:
        break;
    }
  }

  if (hasBg && bgcolor && bgcolor !== "transparent") {
    backgroundColor = bgcolor;
    color = theme.palette.common.white;
  }

  // Out-of-month dimming
  if (isOutOfMonth) {
    border = `1px solid ${theme.palette.action.disabledBackground}`;
    color = theme.palette.text.disabled;
    backgroundColor = backgroundColor === "transparent" ? backgroundColor : alpha(backgroundColor, 0.6);
  }

  // Hover affordance
  const hover = !isSelected
    ? {
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.5),
          backgroundColor: backgroundColor === "transparent"
            ? alpha(theme.palette.primary.main, 0.04)
            : backgroundColor,
        },
      }
    : {
        // when already selected, hovering slightly intensifies the glow
        '&:hover': {
          // stronger glow on hover: wider spread and stronger alpha for emphasis
          boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.12)}`,
        },
      };

  return { ...base, border, backgroundColor, color, ...(boxShadow ? { boxShadow } : {}), ...hover };
}
