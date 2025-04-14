
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
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold">Task Management</h2>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Left side - Task management */}
        <div className="space-y-6">
          {/* Add task section */}
          <Card className="p-4">
            <h3 className="text-xl font-medium mb-4">Add New Task</h3>
            <div className="flex gap-2">
              <Input
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              />
              <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
          </Card>
          
          {/* Task list section */}
          <Card>
            <h3 className="text-xl font-medium p-4 pb-2">Your Tasks</h3>
            
            <Tabs 
              defaultValue="pending" 
              onValueChange={(value: string) => setActiveTab(value as "pending" | "completed" | "overdue")}
            >
              <TabsList className="grid w-full grid-cols-3 bg-background border border-border">
                <TabsTrigger 
                  value="pending"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Pending ({pendingTasks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="overdue"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Overdue ({overdueTasks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Completed ({completedTasks.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="p-4">
                {pendingTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No pending tasks. Add a new task to get started!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
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
                            />
                          ) : (
                            <span>{task.title}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(task.id, task.title)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="overdue" className="p-4">
                {overdueTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No overdue tasks. Great job staying on top of things!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {overdueTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
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
                            />
                          ) : (
                            <div className="flex flex-col">
                              <span>{task.title}</span>
                              <span className="text-xs text-destructive">
                                Created {formatDistanceToNow(new Date(task.createdAt))} ago
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(task.id, task.title)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="p-4">
                {completedTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No completed tasks yet. Complete a task to see it here!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {completedTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between border-b border-border pb-2 opacity-70">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={true}
                            onCheckedChange={() => handleToggleStatus(task.id)}
                          />
                          <span className="line-through">{task.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
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
        <div>
          <AITaskAssistant />
        </div>
      </div>
    </div>
  );
};

export default TasksTab;
