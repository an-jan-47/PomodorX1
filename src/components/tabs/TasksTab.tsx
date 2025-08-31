import { useState } from "react";
import { useApp } from "@/hooks/useApp";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash, Calendar, Flag, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Task } from "@/lib/types";
import AITaskAssistant from "@/components/ai/AITaskAssistant";
import AddTaskForm from "@/components/tasks/AddTaskForm";

const TasksTab = () => {
  const { tasks, toggleTaskStatus, deleteTask, editTask } = useApp();
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "overdue">("pending");
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Filter tasks based on active tab
  const pendingTasks = tasks.filter(task => task.status === "pending");
  const completedTasks = tasks.filter(task => task.status === "completed");
  
  // Get overdue tasks - tasks that are pending and have passed their due date
  const overdueTasks = tasks.filter(task => {
    if (task.status !== "pending") return false;
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  });

  const handleStartEdit = (id: string, title: string) => {
    setEditingTask(id);
    setEditValue(title);
  };

  const handleSaveEdit = (id: string) => {
    if (editValue.trim()) {
      editTask(id, editValue.trim());
    }
    setEditingTask(null);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleToggleStatus = (id: string) => {
    toggleTaskStatus(id);
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };

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

  const renderTaskItem = (task: Task) => {
    const isOverdue = (() => {
      if (!task.dueDate || task.status !== "pending") return false;
      try {
        const dueDate = new Date(task.dueDate);
        return !isNaN(dueDate.getTime()) && dueDate < new Date();
      } catch {
        return false;
      }
    })();
    
    return (
      <div key={task.id} className="flex flex-col border-b border-border pb-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Checkbox 
              checked={task.status === "completed"}
              onCheckedChange={() => handleToggleStatus(task.id)}
              className={isOverdue ? "border-destructive" : ""}
            />
            {editingTask === task.id ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit(task.id);
                  if (e.key === "Escape") handleCancelEdit();
                }}
                onBlur={() => handleSaveEdit(task.id)}
                autoFocus
                className="flex-1"
              />
            ) : (
              <div className="flex flex-col flex-1 min-w-0">
                <span className={`truncate ${task.status === "completed" ? "line-through opacity-70" : ""} ${isOverdue ? "text-destructive" : ""}`}>
                  {task.title}
                </span>
                {/* Task metadata */}
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <Badge className={getPriorityColor(task.priority)}>
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
                      {(() => {
                        try {
                          const dueDate = new Date(task.dueDate);
                          if (isNaN(dueDate.getTime())) {
                            return "Invalid date";
                          }
                          return (isOverdue ? "Overdue" : "Due") + " " + formatDistanceToNow(dueDate, { addSuffix: true });
                        } catch (error) {
                          return "Invalid date";
                        }
                      })()}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-1 ml-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleStartEdit(task.id, task.title)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteTask(task.id)}
              className="h-8 w-8"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <h2 className="text-xl md:text-2xl font-semibold">Task Management</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Left side - Task management */}
        <div className="flex flex-col gap-3 md:gap-4 h-full">
          {/* Enhanced Add task section */}
          <AddTaskForm />
          
          {/* Task list section */}
          <Card className="flex-1 flex flex-col">
            <h3 className="text-base md:text-lg font-medium p-3 md:p-4 pb-2">Your Tasks</h3>
            
            <Tabs 
              defaultValue="pending" 
              value={activeTab}
              onValueChange={(value: string) => setActiveTab(value as "pending" | "completed" | "overdue")}
            >
              <TabsList className="grid w-full grid-cols-3 bg-background border border-border">
                <TabsTrigger 
                  value="pending"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-1 md:py-1.5"
                >
                  Pending ({pendingTasks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="overdue"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-1 md:py-1.5"
                >
                  Overdue ({overdueTasks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm py-1 md:py-1.5"
                >
                  Completed ({completedTasks.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="p-3 md:p-4">
                {pendingTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6 md:py-8">
                    No pending tasks. Add a new task to get started!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {pendingTasks.map(renderTaskItem)}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="overdue" className="p-3 md:p-4">
                {overdueTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6 md:py-8">
                    No overdue tasks. Great job staying on top of things!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {overdueTasks.map(renderTaskItem)}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="p-3 md:p-4">
                {completedTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6 md:py-8">
                    No completed tasks yet. Complete a task to see it here!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {completedTasks.map(renderTaskItem)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        
        {/* Right side - AI Assistant */}
        <div className="flex flex-col h-full">
          <AITaskAssistant />
        </div>
      </div>
    </div>
  );
};

export default TasksTab;
