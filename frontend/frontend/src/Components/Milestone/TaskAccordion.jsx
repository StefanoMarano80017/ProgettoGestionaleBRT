/*
 *   Copyright (c) 2025 Stefano Marano https://github.com/StefanoMarano80017
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Box,
  Stack,
  Fade
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// Componente singolo "Task"
export default function TaskAccordion({ task, children }){
  const [expanded, setExpanded] = useState(false);

  const handleChange = () => setExpanded((prev) => !prev);

  return (
    <Accordion
      expanded={expanded}
      onChange={handleChange}
      sx={{
        borderRadius: 0,
        boxShadow: "none",
        "&:before": { display: "none" }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: expanded ? "grey.100" : "background.paper",
          transition: "background-color 0.3s"
        }}
      >
        <Fade in={!expanded} timeout={300}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ width: "100%", opacity: expanded ? 0.4 : 1 }}
          >
            {/* Titolo */}
            <Typography variant="subtitle1" sx={{ flex: 1 }}>
              {task.title}
            </Typography>

            {/* Utenti */}
            <AvatarGroup max={3}>
              {task.users.map((u, i) => (
                <Avatar key={i} alt={u.name} src={u.avatar} />
              ))}
            </AvatarGroup>

            {/* Tag */}
            <Chip label={task.tag} size="small" color="primary" />

            {/* Data */}
            <Typography variant="body2" color="text.secondary">
              {task.deadline}
            </Typography>

            {/* Progresso */}
            <Box sx={{ minWidth: 100 }}>
              <LinearProgress
                variant="determinate"
                value={task.progress}
                sx={{ borderRadius: 5 }}
              />
            </Box>
          </Stack>
        </Fade>
      </AccordionSummary>

      <AccordionDetails
        sx={{ backgroundColor: "grey.50", p: 0 }}
      >
        <Stack>
          {children}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};