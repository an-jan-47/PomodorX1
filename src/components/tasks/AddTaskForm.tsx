
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const AddTaskForm = () => {
  const [taskTitle, setTaskTitle] = useState("");
  const { addTask } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      addTask(taskTitle);
      setTaskTitle("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Task</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            type="text"
            placeholder="What needs to be done?"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!taskTitle.trim()}>
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddTaskForm;
