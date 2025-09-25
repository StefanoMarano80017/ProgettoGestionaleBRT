import React from "react";
import Box from "@mui/material/Box";

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

function darkenColor(hex, factor = 0.2) {
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * (1 - factor));
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * (1 - factor));
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * (1 - factor));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * props:
 * - size: dimensione
 * - name, surname: usati per calcolare le iniziali e colore
 * - text: testo arbitrario (es. "+3"), se presente sovrascrive le iniziali
 * - backgroundColor, borderColor: opzionali, sovrascrivono i colori calcolati
 */
export function AvatarInitials({ size = 40, name = "", surname = "", text, backgroundColor, borderColor, style, ...rest }) {
  const displayText = text != null ? text : `${name[0] || ""}${surname[0] || ""}`.toUpperCase();
  const bgColor = backgroundColor || stringToColor(name + surname);
  const bColor = borderColor || darkenColor(bgColor, 0.3);
  const borderWidth = Math.max(2, Math.round(size * 0.1));

  return (
    <Box
      component="div"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        border: `${borderWidth}px solid ${bColor}`,
        width: size,
        height: size,
        overflow: "hidden",
        fontWeight: "bold",
        fontSize: Math.round(size * 0.4),
        color: "#fff",
        backgroundColor: bgColor,
        userSelect: "none",
        lineHeight: 1,
      }}
      style={style}
      {...rest}
    >
      {displayText}
    </Box>
  );
}
