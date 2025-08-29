
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AITaskAssistant from "@/components/ai/AITaskAssistant";

const TasksTab = () => {
  const { tasks, addTask, toggleTaskStatus, deleteTask, editTask } = useApp();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "completed" | "overdue">("pending");
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Filter tasks based on active tab
  const pendingTasks = tasks.filter(task => task.status === "pending");
  const completedTasks = tasks.filter(task => task.status === "completed");
  
  // Get overdue tasks - tasks that are pending and were created more than 24 hours ago
  const overdueTasks = tasks.filter(task => {
    if (task.status !== "pending") return false;
    const createdDate = new Date(task.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 1;
  });

  // Add missing handler functions
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle.trim());
      setNewTaskTitle("");
    }
  };

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

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <h2 className="text-xl md:text-2xl font-semibold">Task Management</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Left side - Task management */}
        <div className="flex flex-col gap-3 md:gap-4 h-full">
          {/* Add task section */}
          <Card className="p-3 md:p-4">
            <h3 className="text-base md:text-lg font-medium mb-2 md:mb-3">Add New Task</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddTask} 
                disabled={!newTaskTitle.trim()}
                className="whitespace-nowrap"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Task
              </Button>
            </div>
          </Card>
          
          {/* Task list section */}
          <Card className="flex-1 flex flex-col">
            <h3 className="text-base md:text-lg font-medium p-3 md:p-4 pb-2">Your Tasks</h3>
            
            <Tabs 
              defaultValue="pending" 
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
                    {pendingTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Checkbox 
                            checked={task.status === "completed"}
                            onCheckedChange={() => handleToggleStatus(task.id)}
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
                            <span className="truncate">{task.title}</span>
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
                    ))}
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
                    {overdueTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Checkbox 
                            checked={task.status === "completed"}
                            onCheckedChange={() => handleToggleStatus(task.id)}
                            className="border-destructive"
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
                            <div className="flex flex-col truncate">
                              <span className="truncate">{task.title}</span>
                              <span className="text-xs text-destructive">
                                Created {formatDistanceToNow(new Date(task.createdAt))} ago
                              </span>
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
                    ))}
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
                    {completedTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between border-b border-border pb-2 opacity-70">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Checkbox 
                            checked={true}
                            onCheckedChange={() => handleToggleStatus(task.id)}
                          />
                          <span className="line-through truncate">{task.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-8 w-8 ml-2 flex-shrink-0"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
