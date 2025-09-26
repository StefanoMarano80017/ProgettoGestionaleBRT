// DynamicTabDataGrid.jsx
import React, { useState } from "react";
import TabsBar from "../Bars/TabsBar"; // presuppone la TabsBar già implementata
import { Box, Card, CardContent, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

export default function DynamicTabDataGrid({ fullViewport = true }) {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        // Per evitare scroll della pagina, di default occupiamo la viewport:
        // se preferisci usare l'altezza del genitore, passa fullViewport={false}
        height: fullViewport ? "100vh" : "100%",
        overflow: "hidden",
      }}
    >
      {/* Barra dei tab (gestisce add/remove/drag) */}
      <TabsBar
        tabs={tabs}
        setTabs={setTabs}
        activeTabId={activeTabId}
        setActiveTabId={setActiveTabId}
      />

      {/* Area DataGrid: il contenitore flex deve avere minHeight: 0 */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {activeTab ? (
          // wrapper con minHeight:0 per consentire al DataGrid di ridursi
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <DataGrid
              rows={activeTab.rows}
              columns={activeTab.columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              showToolbar 
              // imposta il grid a riempire lo spazio del wrapper
              sx={{
                height: "100%",
                width: "100%",
                // la virtual scroller (il corpo del grid) diventa l'unica area scrollabile
                "& .MuiDataGrid-virtualScroller": {
                  overflow: "auto",
                },
                // assicura che il contenuto interno non imponga min-height
                "& .MuiDataGrid-main": {
                  minHeight: 0,
                },
                // opzionale: mantieni header fisso visualmente corretto
                "& .MuiDataGrid-columnHeaders": {
                  flex: "0 0 auto",
                },
              }}
              // evita che il DataGrid auto-calcoli altezza (lasciamo al CSS)
              autoHeight={false}
              disableSelectionOnClick
            />
          </Box>
        ) : (
          <Card
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 0,
            }}
          >
            <CardContent>
              <Typography variant="h6" align="center">
                Nessuna tab presente. Premi "+ Aggiungi" per creare una nuova tab.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
