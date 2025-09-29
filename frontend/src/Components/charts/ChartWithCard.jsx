import React, { useState, useMemo } from "react";
import { Box, Grid } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import TaskDetailCard from "./TaskDetailCard";

/**
 * Componente Grafico
 * Mostra una barra per ogni task
 */
function MyBarChart({ projects, onBarClick }) {
  const chartData = useMemo(() => {
    const tasks = [];
    projects.forEach((p) => {
      p.tasks.forEach((t) => {
        tasks.push({
          taskTitle: t.title,
          hours: t.total,
          projectId: p.id,
          taskId: t.id,
          projectTitle: p.title,
          taskData: t,
        });
      });
    });
    return tasks;
  }, [projects]);

  const barChartsParams = useMemo(
    () => ({
      series: [
        {
          id: "hours",
          data: chartData.map((d) => d.hours),
          label: "Ore per task",
          highlightScope: { highlight: "item" },
        },
      ],
      xAxis: [
        {
          data: chartData.map((d) => `${d.projectTitle}: ${d.taskTitle}`),
          id: "tasks",
        },
      ],
      height: 400,
      margin: { left: 0 },
    }),
    [chartData]
  );

  return (
    <Box sx={{ width: "100%", minHeight: 400 }}>
      <BarChart
        {...barChartsParams}
        onItemClick={(event, d) => {
          const clickedTask = chartData[d.dataIndex];
          const projectDetails = projects.find(
            (p) => p.id === clickedTask.projectId
          );
          onBarClick({
            project: projectDetails,
            task: clickedTask.taskData,
          });
        }}
      />
    </Box>
  );
}

/**
 * Componente principale
 * @param {Array} projects - dati dei progetti
 */
export default function ChartWithCard({ projects }) {
  const [selectedTaskData, setSelectedTaskData] = useState(null);

  if (!projects) return null;

  return (
    <Box sx={{ width: "100%" }}>
      <Grid
        container
        spacing={2}
        sx={{ justifyContent: "center", alignContent: "center" }}
      >
        {/* Grafico */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <MyBarChart projects={projects} onBarClick={setSelectedTaskData} />
        </Grid>

        {/* Card */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{ display: "flex", flexDirection: "column" }}
        >
          <Box sx={{ flex: 1 }}>
            {selectedTaskData?.task && (
              <TaskDetailCard task={selectedTaskData.task} />
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
