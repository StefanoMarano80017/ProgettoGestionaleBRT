import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { AvatarInitials } from "./AvatarInitials";

const UserCard = ({ firstName, lastName, avatarUrl }) => {
  return (
    <Card variant="outlined" sx={{ display: "flex", alignItems: "center", p: 1, maxWidth: 300 }}>
      <AvatarInitials 
        name = {firstName} 
        surname = {lastName}
      />
      <CardContent sx={{ p: 0 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {firstName} {lastName}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default UserCard;
