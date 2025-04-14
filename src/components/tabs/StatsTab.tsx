
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import StatsTimeframeSelector from "@/components/stats/StatsTimeframeSelector";
import TasksStats from "@/components/stats/TasksStats";
import PomodoroStats from "@/components/stats/PomodoroStats";
// import ProductivityTrendChart from "@/components/stats/ProductivityTrendChart";
import ProductivityInsights from "@/components/stats/ProductivityInsights";
import SessionDistributionChart from "@/components/stats/SessionDistributionChart";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, ListChecks, AlertCircle } from "lucide-react";

const StatsTab = () => {
  const { pomodoroSessions, tasks, statsTimeframe, setStatsTimeframe } = useApp();
  
  // Calculate task stats
  const completedTasks = tasks.filter(task => task.status === "completed").length;
  const pendingTasks = tasks.filter(task => task.status === "pending").length;
  
  // Get overdue tasks - tasks that are pending and were created more than 24 hours ago
  const overdueTasks = tasks.filter(task => {
    if (task.status !== "pending") return false;
    const createdDate = new Date(task.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 1;
  }).length;
  
  const totalTasks = tasks.length;
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold">Statistics</h2>
      
      <StatsTimeframeSelector />
      
      <h3 className="text-xl font-medium mt-6">Tasks Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stats-card">
          <CardContent className="pt-6 flex flex-col items-center">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-3xl font-bold">{completedTasks}</div>
            <div className="text-sm text-muted-foreground">Completed Tasks</div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardContent className="pt-6 flex flex-col items-center">
            <Clock className="h-8 w-8 text-yellow-500 mb-2" />
            <div className="text-3xl font-bold">{pendingTasks}</div>
            <div className="text-sm text-muted-foreground">Pending Tasks</div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardContent className="pt-6 flex flex-col items-center">
            <ListChecks className="h-8 w-8 text-purple-500 mb-2" />
            <div className="text-3xl font-bold">{totalTasks}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        
        <Card className="stats-card">
          <CardContent className="pt-6 flex flex-col items-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <div className="text-3xl font-bold">{overdueTasks}</div>
            <div className="text-sm text-muted-foreground">Overdue Tasks</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 transition-all duration-300">
        <TasksStats />
        <PomodoroStats />
      </div>
      
      <div className="space-y-6">
        {/* Removed duplicate StatsTimeframeSelector */}
        {/* <ProductivityTrendChart /> */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProductivityInsights />
          <SessionDistributionChart />
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
