import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box } from "@mui/material";

export default function ResizableLayout({ topComponent, bottomComponent, defaultSize = 300, minSize = 100 }) {
  const [topHeight, setTopHeight] = useState(defaultSize);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const handleMouseDown = useCallback(() => { dragging.current = true; }, []);
  const handleMouseUp = useCallback(() => { dragging.current = false; }, []);
  const handleMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const containerTop = containerRef.current.getBoundingClientRect().top;
    let newHeight = e.clientY - containerTop;
    if (newHeight < minSize) newHeight = minSize;
    if (newHeight > containerRef.current.clientHeight - minSize)
      newHeight = containerRef.current.clientHeight - minSize;
    setTopHeight(newHeight);
  }, [minSize]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <Box ref={containerRef} sx={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column", userSelect: "none" }}>
      <Box sx={{ height: topHeight, overflow: "auto" }}>{topComponent}</Box>
      {/* Divider */}
      <Box
        sx={{ height: 5, cursor: "row-resize", backgroundColor: "divider" }}
        onMouseDown={handleMouseDown}
      />
      <Box sx={{ flex: 1, overflow: "auto" }}>{bottomComponent}</Box>
    </Box>
  );
}
