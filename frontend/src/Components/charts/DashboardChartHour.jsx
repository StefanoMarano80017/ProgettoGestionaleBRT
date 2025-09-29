import ChartWithCard from "./ChartWithCard";
import { useProjects } from "../../Hooks/useProject";
import { Box } from "@mui/material";

export default function DashboardCoordinatore() {
  const { data: projects } = useProjects();

  return <Box>
    {projects && <ChartWithCard projects={projects} />}
    </Box>;
}
