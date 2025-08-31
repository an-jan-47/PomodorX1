
import { useState, useEffect } from "react";
import { Task, TaskPriority, TaskDifficulty } from "@/lib/types";
import { useApp } from "@/hooks/useApp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Flag, Zap } from "lucide-react";

interface TaskEditDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskEditDialog = ({ task, open, onOpenChange }: TaskEditDialogProps) => {
  const { editTaskWithParams } = useApp();
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(task.difficulty);

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDueDate(task.dueDate || "");
      setPriority(task.priority);
      setDifficulty(task.difficulty);
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      editTaskWithParams(task.id, {
        title: title.trim(),
        dueDate: dueDate || undefined,
        priority,
        difficulty,
      });
      onOpenChange(false);
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  const getDifficultyColor = (difficulty: TaskDifficulty) => {
    switch (difficulty) {
      case "hard": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "easy": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Task Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date & Time
              </Label>
              <Input
                id="edit-dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Flag className={`h-4 w-4 ${getPriorityColor(priority)}`} />
                  Priority
                </Label>
                <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-green-500" />
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-yellow-500" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-red-500" />
                        High
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${getDifficultyColor(difficulty)}`} />
                  Difficulty
                </Label>
                <Select value={difficulty} onValueChange={(value: TaskDifficulty) => setDifficulty(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        Easy
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="hard">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-red-500" />
                        Hard
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditDialog;
