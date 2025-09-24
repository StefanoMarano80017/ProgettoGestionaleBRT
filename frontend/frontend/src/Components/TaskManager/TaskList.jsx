import TaskItem from "./TaskItem";

export default function TaskList({ tasks, employees }) {
  return (
    <div style={{ marginTop: 16 }}>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} employees={employees} />
      ))}
    </div>
  );
}
