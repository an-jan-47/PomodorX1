
import { useState } from "react";
import { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import TaskEditDialog from "./TaskEditDialog";

interface TaskItemProps {
  task: Task;
}

const TaskItem = ({ task }: TaskItemProps) => {
  const { toggleTaskStatus, deleteTask } = useApp();
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <div className="task-item group">
        <Checkbox
          checked={task.status === "completed"}
          onCheckedChange={() => toggleTaskStatus(task.id)}
          className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
        />
        <span
          className={`flex-1 ${
            task.status === "completed" ? "line-through text-muted-foreground" : ""
          }`}
        >
          {task.title}
        </span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:text-destructive"
            onClick={() => deleteTask(task.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>

      <TaskEditDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
};

export default TaskItem;
