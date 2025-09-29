import { Box, Grid, Paper, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import BadgeCard from "../BadgeCard/Badge"; // your badge component
import CalendarComponent from "../Calendar/CalendarComponent";
import SetOreGiorno from "../Calendar/SetOreGiorno";

export default function TimeSheetDashboard() {
  // Example function for list content
  const listItems = ["Task 1", "Task 2", "Task 3"];

  return (
    <Box sx={{ p: 3, bgcolor: "customBackground.main"}}>
      {/* Top row: Badge + SetOreGiorno */}
      <Grid container spacing={2} alignItems="flex-start">
        <Grid item>
          <BadgeCard
            avatarSrc="MR"
            title="Employee Badge"
            actionIcon={<InfoIcon />}
            companyId="BRT-12345"
            companyLogo="https://static.wixstatic.com/media/618259_08e4c20264204196a4839f310152b7e8~mv2.png/v1/fill/w_222,h_56,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/brt_logo_engineering_white.png"
            holderName="Mario Rossi"
          />
        </Grid>

        <Grid item >
          <Box sx={{ mb: 2 }}>
            <SetOreGiorno />
          </Box>

          {/* Outlined box with list */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "#616161ff",
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {listItems.map((item, index) => (
              <Typography key={index} variant="body1">
                {item}
              </Typography>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Calendar under the badge */}
      <Box >
        <CalendarComponent />
      </Box>
    </Box>
  );
}
