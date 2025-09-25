import { styled } from "@mui/material/styles";
import Switch, { switchClasses } from "@mui/material/Switch";

export const ThemeSwitch = styled(Switch)(({ theme }) => {
  const width = 48;
  const height = 24;
  const thumbSize = 20;

  return {
    width,
    height,
    padding: 0,
    [`& .${switchClasses.switchBase}`]: {
      padding: 2,
      [`&.${switchClasses.checked}`]: {
        transform: `translateX(${width - thumbSize - 4}px)`,
        [`& .${switchClasses.thumb}`]: {
          backgroundColor: "#fff",
        },
        [`& + .${switchClasses.track}`]: {
          backgroundColor: "#60A29B",
        },
      },
    },
    [`& .${switchClasses.thumb}`]: {
      width: thumbSize,
      height: thumbSize,
      boxShadow: "none",
    },
    [`& .${switchClasses.track}`]: {
      borderRadius: 12,
      backgroundColor: "#ccc",
      opacity: 1,
    },
  };
});

export default function ThemeSwitchComponent({ checked, onChange }) {
  return <ThemeSwitch checked={checked} onChange={onChange} />;
}
