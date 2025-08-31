import { useApp } from "@/hooks/useApp";
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
      <h2 className="text-xl font-bold text-center">Tasks Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-4 md:pt-6 text-center p-3 md:p-4">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto text-green-500" />
            <div className="mt-2 text-2xl md:text-3xl font-bold">{completedTasks.length}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Completed Tasks</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-4 md:pt-6 text-center p-3 md:p-4">
            <Clock className="h-6 w-6 md:h-8 md:w-8 mx-auto text-yellow-500" />
            <div className="mt-2 text-2xl md:text-3xl font-bold">{pendingTasks.length}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Pending Tasks</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-4 md:pt-6 text-center p-3 md:p-4">
            <ListTodo className="h-6 w-6 md:h-8 md:w-8 mx-auto text-purple-500" />
            <div className="mt-2 text-2xl md:text-3xl font-bold">{tasks.length}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="pt-4 md:pt-6 text-center p-3 md:p-4">
            <AlertCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto text-red-500" />
            <div className="mt-2 text-2xl md:text-3xl font-bold">{overdueTasks.length}</div>
            <div className="text-xs md:text-sm text-muted-foreground">Overdue Tasks</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TasksOverview;
