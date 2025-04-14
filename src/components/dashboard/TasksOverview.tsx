import { useApp } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, ListTodo, AlertCircle } from "lucide-react";
import { isToday, isThisWeek } from "@/lib/utils";

const TasksOverview = () => {
  const { tasks } = useApp();
  
  // Calculate task statistics
  const completedTasks = tasks.filter(task => task.status === "completed");
  const pendingTasks = tasks.filter(task => task.status === "pending");
  
  // Get overdue tasks - tasks that are pending and were created more than 24 hours ago
  const overdueTasks = tasks.filter(task => {
    if (task.status !== "pending") return false;
    const createdDate = new Date(task.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 1;
  });

  return (
    <div className="space-y-4">
      {/* Updated to center the text */}
      <h2 className="text-xl font-bold text-center">Tasks Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
            <div className="mt-2 text-3xl font-bold">{completedTasks.length}</div>
            <div className="text-sm text-muted-foreground">Completed Tasks</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-8 w-8 mx-auto text-yellow-500" />
            <div className="mt-2 text-3xl font-bold">{pendingTasks.length}</div>
            <div className="text-sm text-muted-foreground">Pending Tasks</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <ListTodo className="h-8 w-8 mx-auto text-purple-500" />
            <div className="mt-2 text-3xl font-bold">{tasks.length}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-red-500" />
            <div className="mt-2 text-3xl font-bold">{overdueTasks.length}</div>
            <div className="text-sm text-muted-foreground">Overdue Tasks</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TasksOverview;