import React, { useState } from "react";
import { Box, Typography, TextField, InputAdornment, IconButton, Button } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const Badge = ({ initialId= "", name= "", editable = false, onConfirm }) => {
  const styles = {
    container: {
      width: "90%",
      height: "180px",
      borderRadius: "12px",
      background: "linear-gradient(135deg, #4a90e2, #0052cc)",
      color: "white",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      fontFamily: "Arial, sans-serif",
      boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
      position: "relative",
      overflow: "hidden",
    },
    header: {
      fontSize: "1rem",
      fontWeight: "bold",
      letterSpacing: "1px",
      zIndex: 1,
    },
    body: {
      zIndex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    id: {
      fontSize: "1.2rem",
      fontWeight: "bold",
    },
    name: {
      fontSize: "1rem",
      marginTop: "5px",
    },
  };

  return (
      <Box style={styles.container}>
        <div style={styles.header}>Badge Ingresso</div>
        <div style={styles.body}>
          {editable ? (
            <TextField
              value={id}
              onChange={(e) => setId(e.target.value)}
              size="small"
              variant="standard"
              placeholder="Inserisci ID"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => onConfirm && onConfirm(initialId)}
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          ) : (
            <>
              <div style={styles.id}> ID: {initialId}</div>
              <div style={styles.name}> Nome: {name}</div>
            </>
          )}
        </div>
      </Box>
  );
};

export default Badge;
