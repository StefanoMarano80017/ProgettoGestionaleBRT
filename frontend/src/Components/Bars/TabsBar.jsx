import React, { useRef, useState, useEffect } from "react";
import { Box, Fab, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import SortableChip from "./SortableChip";

export default function TabsBar({
  tabs,
  setTabs,
  activeTabId,
  setActiveTabId,
}) {
  const scrollContainerRef = useRef(null);
  const [showArrows, setShowArrows] = useState(false);

  // controlla overflow orizzontale
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setShowArrows(el.scrollWidth > el.clientWidth);
    };

    checkOverflow();
    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, [tabs]);

  const generateTestData = (count = 5) => {
    const columns = [
      { field: "id", headerName: "ID", width: 70 },
      { field: "name", headerName: "Nome", flex: 1 },
      { field: "age", headerName: "Età", width: 100 },
    ];

    const names = [
      "Mario",
      "Luca",
      "Giulia",
      "Anna",
      "Paolo",
      "Chiara",
      "Marco",
      "Elisa",
    ];
    const surnames = ["Rossi", "Bianchi", "Verdi", "Neri", "Gialli", "Blu"];

    const rows = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `${names[Math.floor(Math.random() * names.length)]} ${
        surnames[Math.floor(Math.random() * surnames.length)]
      }`,
      age: Math.floor(Math.random() * 40) + 20, // età tra 20 e 60
    }));

    return { columns, rows };
  };

  const handleAdd = () => {
    const { columns, rows } = generateTestData(80);

    const newTab = {
      id: `tab-${tabs.length + 1}`,
      label: `Tab ${tabs.length + 1}`,
      rows,
      columns,
    };

    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleRemove = (id) => {
    const filtered = tabs.filter((t) => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id && filtered.length) setActiveTabId(filtered[0].id);
    else if (!filtered.length) setActiveTabId(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = tabs.findIndex((t) => t.id === active.id);
      const newIndex = tabs.findIndex((t) => t.id === over.id);
      setTabs(arrayMove(tabs, oldIndex, newIndex));
    }
  };

  const scrollBy = (offset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 1,
      }}
    >
      {/* Freccia sinistra */}
      {showArrows && (
        <IconButton onClick={() => scrollBy(-150)} sx={{ flexShrink: 0 }}>
          <ArrowBackIosIcon />
        </IconButton>
      )}

      {/* Zona chip scrollabile */}
      <Box
        ref={scrollContainerRef}
        sx={{
          display: "flex",
          gap: 1,
          overflow: "hidden",
          flexGrow: 1,
        }}
      >
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <SortableContext
            items={tabs.map((t) => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map((tab) => (
              <SortableChip
                key={tab.id}
                tab={tab}
                active={tab.id === activeTabId}
                onClick={() => setActiveTabId(tab.id)}
                onDelete={() => handleRemove(tab.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Box>

      {/* Freccia destra */}
      {showArrows && (
        <IconButton onClick={() => scrollBy(150)} sx={{ flexShrink: 0 }}>
          <ArrowForwardIosIcon />
        </IconButton>
      )}

      {/* Bottoni aggiungi e altro */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", ml: 1 }}>
        <Fab variant="extended" size="small" onClick={handleAdd}>
          <AddIcon sx={{ mr: 1 }} />
          Aggiungi
        </Fab>
        <IconButton aria-label="more">
          <MoreVertIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
