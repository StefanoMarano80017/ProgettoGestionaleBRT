import * as React from "react";
import { Box, Card, CardHeader, CardContent, CardActions, Typography, Paper, IconButton, Divider, Pagination, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ConfirmDialog from "../../components/ConfirmDialog";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EntryListItem from "../../components/Entries/EntryListItem";

export default function CommesseList({ selectedDate }) {
  const [commesse, setCommesse] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const pageSize = 5; // numero di commesse per pagina

  const handleRemoveCommessa = (index) => {
    // open confirm dialog
    setDeleteIndex(index);
    setConfirmOpen(true);
  };

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleteIndex, setDeleteIndex] = React.useState(null);

  const doRemoveConfirmed = () => {
    if (deleteIndex == null) return;
    const updated = [...commesse];
    updated.splice(deleteIndex, 1);
    setCommesse(updated);
    setDeleteIndex(null);
    setConfirmOpen(false);
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
          <Stack spacing={1}>
            {pagedCommesse.map((c, idx) => (
              <React.Fragment key={startIndex + idx}>
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <EntryListItem
                    item={{ commessa: c.commessa, descrizione: c.descrizione, ore: c.ore }}
                    actions={(
                      <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveCommessa(startIndex + idx)}>
                        <CloseIcon />
                      </IconButton>
                    )}
                  />
                </Paper>
                {idx < pagedCommesse.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Stack>
        )}
        <ConfirmDialog
          open={confirmOpen}
          title="Rimuovi commessa"
          message="Sei sicuro di voler rimuovere questa commessa?"
          onClose={() => { setConfirmOpen(false); setDeleteIndex(null); }}
          onConfirm={doRemoveConfirmed}
        />
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
