import * as React from "react";
import { Box, Card,CardHeader, CardContent, CardActions, Typography, Paper, IconButton, List, ListItem, ListItemText, Divider, Pagination } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function CommesseList({ selectedDate }) {
  const [commesse, setCommesse] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const pageSize = 5; // numero di commesse per pagina

  const handleRemoveCommessa = (index) => {
    const updated = [...commesse];
    updated.splice(index, 1);
    setCommesse(updated);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const startIndex = (page - 1) * pageSize;
  const pagedCommesse = commesse.slice(startIndex, startIndex + pageSize);
  const pageCount = Math.ceil(commesse.length / pageSize);

  return (
    <Card
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header */}
      <CardHeader
        title={
          selectedDate
            ? selectedDate.toLocaleDateString("it-IT", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Seleziona un giorno"
        }
      />

      {/* Lista scrollabile */}
      <CardContent
        sx={{
          flex: "1 1 auto",
          overflowY: "auto",
          pt: 0,
          pb: 0,
          minHeight: 0,
          maxHeight: "calc(100% - 120px)",
        }}
      >
        {commesse.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100px"
            p={2}
          >
            <Paper
              sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}
              variant="outlined"
            >
              <InfoOutlinedIcon color="info" />
              <Typography>Nessuna commessa aggiunta</Typography>
            </Paper>
          </Box>
        ) : (
          <List dense>
            {pagedCommesse.map((c, idx) => (
              <React.Fragment key={startIndex + idx}>
                <ListItem
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleRemoveCommessa(startIndex + idx)}
                    >
                      <CloseIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${c.commessa} - Ore: ${c.ore}`}
                    secondary={c.descrizione}
                    primaryTypographyProps={{
                      style: { wordBreak: "break-word", whiteSpace: "normal" },
                    }}
                    secondaryTypographyProps={{
                      style: { wordBreak: "break-word", whiteSpace: "normal" },
                    }}
                  />
                </ListItem>
                {idx < pagedCommesse.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>

      {/* Footer: Pagination */}
      {commesse.length > pageSize && (
        <CardActions sx={{ justifyContent: "center", py: 1 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="small"
          />
        </CardActions>
      )}
    </Card>
  );
}
