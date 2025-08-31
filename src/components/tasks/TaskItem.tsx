
import { useState } from "react";
import { Task } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Calendar, Flag, Zap } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import TaskEditDialog from "./TaskEditDialog";
import { formatDistanceToNow } from "date-fns";

interface TaskItemProps {
  task: Task;
}

const TaskItem = ({ task }: TaskItemProps) => {
  const { toggleTaskStatus, deleteTask } = useApp();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "hard": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "easy": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === "pending";

  return (
    <>
      <div className="task-item group p-3 border rounded-lg space-y-2 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === "completed"}
            onCheckedChange={() => toggleTaskStatus(task.id)}
            className="data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground mt-1"
          />
          <div className="flex-1 min-w-0">
            <span
              className={`text-sm font-medium ${
                task.status === "completed" ? "line-through text-muted-foreground" : ""
              } ${isOverdue ? "text-red-600" : ""}`}
            >
              {task.title}
            </span>
            
            {/* Task metadata */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={getPriorityColor(task.priority)} variant="secondary">
                <Flag className="h-3 w-3 mr-1" />
                {task.priority}
              </Badge>
              <Badge className={getDifficultyColor(task.difficulty)} variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                {task.difficulty}
              </Badge>
              
              {task.dueDate && (
                <Badge variant={isOverdue ? "destructive" : "outline"}>
                  <Calendar className="h-3 w-3 mr-1" />
                  {isOverdue ? "Overdue" : "Due"} {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                </Badge>
              )}
            </div>
          </div>
          
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
