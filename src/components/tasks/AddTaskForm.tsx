
import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Flag, Zap } from "lucide-react";
import { TaskPriority, TaskDifficulty } from "@/lib/types";
import { DateTimePicker } from "@/components/ui/date-time-picker";

const AddTaskForm = () => {
  const [taskTitle, setTaskTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [difficulty, setDifficulty] = useState<TaskDifficulty>("medium");
  const { addTaskWithParams } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      addTaskWithParams({
        title: taskTitle.trim(),
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        priority,
        difficulty,
      });
      setTaskTitle("");
      setDueDate(undefined);
      setPriority("medium");
      setDifficulty("medium");
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Task
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="What needs to be done?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date & Time
            </Label>
            <DateTimePicker
              date={dueDate}
              onDateChange={setDueDate}
              placeholder="Select due date and time"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flag className={`h-4 w-4 ${getPriorityColor(priority)}`} />
                Priority
              </Label>
              <Select value={priority} onValueChange={(value: TaskPriority) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
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
                  <SelectValue placeholder="Select difficulty" />
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

          <Button type="submit" disabled={!taskTitle.trim()} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddTaskForm;
