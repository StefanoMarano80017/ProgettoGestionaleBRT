import { alpha } from '@mui/material/styles';

export const buildChipStyle = (theme, paletteKey) => ({
  bgcolor: alpha(theme.palette[paletteKey].main, 0.15),
  borderColor: theme.palette[paletteKey].main,
  color: theme.palette[paletteKey].dark,
  '& .MuiChip-deleteIcon': {
    color: theme.palette[paletteKey].main,
    opacity: 0.8,
    '&:hover': { color: theme.palette[paletteKey].dark }
  }
});
