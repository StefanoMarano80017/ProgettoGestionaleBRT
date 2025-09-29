import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ProgressChip from "../ProgressBar/ProgressChip";

export default function TaskDetailCard({ task }) {
  if (!task) {
    return (
      <Card sx={{ maxWidth: 345, p: 2 }}>
        <CardContent>
          <p>Seleziona un task per vedere i dettagli</p>
        </CardContent>
      </Card>
    );
  }

  const handleNavigate = () => {
    console.log("Naviga al task", task?.id);
  };

  return (
    <Card sx={{ border: 1 }}>
      {/* Header personalizzato */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid #eee",
          gap: 2,
        }}
      >
        {/* Titolo a sinistra */}
        <Typography variant="h6">{task.title}</Typography>

        {/* Progress bar + IconButton a destra */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <ProgressChip
            progress={task.progress || 0}
            status={task.tag || "prova"}
          />
          <IconButton size="small" onClick={handleNavigate}>
            <OpenInNewIcon />
          </IconButton>
        </Box>
      </Box>

      <CardContent sx={{ p: 0, m: 0 }}>
        {/* Descrizione del task */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 2, px: 1, borderBottom: "1px solid #eee" }}
        >
          {task.description || "Nessuna descrizione disponibile."}
        </Typography>

        <List
          sx={{
            width: "100%",
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {task.items?.map((item, index) => (
            <ListItem
              key={index}
              button // rende il ListItem cliccabile
              onClick={() => console.log("Clicked:", item.name)} // sostituisci con la tua funzione
              sx={{
                pt: 0.5,
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "action.hover", // effetto hover
                },
              }}
            >
              {/* Avatar e titolo*/}
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                  {item.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </Avatar>
                <Typography variant="body2">{item.name}</Typography>
              </Box>

              <Chip
                label={item.status}
                color={
                  item.status === "completo"
                    ? "success"
                    : item.status === "in corso"
                    ? "warning"
                    : "default"
                }
                size="small"
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
