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
      case 'staged-insert':
        border = `1px solid ${theme.palette.success.main}`;
        backgroundColor = alpha(theme.palette.success.main, 0.06);
        boxShadow = `0 0 0 6px ${alpha(theme.palette.success.main, 0.04)}`;
        break;
      case 'staged-update':
        border = `1px solid ${theme.palette.warning.dark || '#ff9800'}`;
        backgroundColor = alpha(theme.palette.warning.main || '#ffb74d', 0.12);
        boxShadow = `0 0 0 6px ${alpha(theme.palette.warning.main || '#ffb74d', 0.06)}`;
        break;
      case 'staged-delete':
        border = `1px solid ${theme.palette.error.main}`;
        backgroundColor = alpha(theme.palette.error.main, 0.08);
        boxShadow = `0 0 0 6px ${alpha(theme.palette.error.main, 0.04)}`;
        break;
      case 'staged':
        // generic staged fallback: cool-blue outline/background
        border = `1px solid ${theme.palette.info.main}`;
        backgroundColor = alpha(theme.palette.info.main, 0.06);
        boxShadow = `0 0 0 6px ${alpha(theme.palette.info.main, 0.04)}`;
        break;
      case 'prev-incomplete':
        // Previous-month incomplete highlight: soft yellow background + stronger border
        border = `1px solid ${theme.palette.warning.dark || '#ff9800'}`;
        backgroundColor = alpha(theme.palette.warning.main || '#ffb74d', 0.14);
        color = theme.palette.text.primary;
        // subtle glow to draw attention
        boxShadow = `0 0 0 6px ${alpha(theme.palette.warning.main || '#ffb74d', 0.06)}`;
        break;
      case 'admin-warning':
        border = `1px solid ${theme.palette.error.main}`;
        backgroundColor = alpha(theme.palette.error.main, 0.12);
        color = theme.palette.error.main;
        break;
      case 'ferie': {
        // Match legend: customPink/secondary color for both border and background
        const ferieColor = theme.palette.customPink?.main || theme.palette.secondary.main;
        border = `1px solid ${ferieColor}`;
        backgroundColor = alpha(ferieColor, 0.10);
        break;
      }
      case 'non-work-full':
        // Distinct soft gray/neutral background to indicate a full non-work day (committed or staged)
        backgroundColor = alpha(theme.palette.action.disabledBackground || theme.palette.grey[200], 0.12);
        border = `1px solid ${theme.palette.action.disabledBackground || theme.palette.grey[300]}`;
        break;
      case 'non-work-partial':
        // Partial absence (PERMESSO/ROL) - subtle info-colored background
        border = `1px solid ${theme.palette.info.main}`;
        backgroundColor = alpha(theme.palette.info.main, 0.08);
        break;
      case 'malattia':
        // Match legend: success color for both border and background
        border = `1px solid ${theme.palette.success.main}`;
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
