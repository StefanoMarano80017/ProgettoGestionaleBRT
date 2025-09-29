import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Box,
  IconButton,
} from "@mui/material";


function BadgeCard({
  avatar,
  title,
  actionIcon,
  companyId,
  companyLogo,
  holderName,
}) {
  return (
    <Card
      sx={{
        width: 350,
        height: 200,
        borderRadius: 3,
        backgroundColor: "#ffffffff", // white background
        boxShadow: 3,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Header section */}
      <CardHeader
        avatar={<Avatar > {avatar}</Avatar>}
        title={<Typography variant="subtitle1" color="black" >{title}</Typography>}
        action={actionIcon ? <IconButton>{actionIcon}</IconButton> : null}
      />

      {/* Body */}
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="black">
          ID: {companyId}
        </Typography>
        {companyLogo && (
          <Box
            component="img"
            src={companyLogo}
            alt="Company Logo"
            sx={{
              width: 80,
              height: "auto",
              mt: 1,
            }}
          />
        )}
      </CardContent>

      {/* Footer */}
      <Box sx={{ textAlign: "center", p: 1 }}>
        <Typography variant="h6" fontWeight="bold" color="black">
          {holderName}
        </Typography>
      </Box>
    </Card>
  );
}

export default BadgeCard;
