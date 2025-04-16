import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle, ListChecks, AlertCircle, Clock, Timer, Hourglass, TrendingUp, Lightbulb, Gauge, Target } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useMemo } from "react";
import { calculateStats } from "@/lib/utils";
import { motion } from "framer-motion";

// Helper for stat cards with animation
const AnimatedStatCard = ({ icon, value, label, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="stats-card flex flex-col items-center justify-center p-4 rounded-lg border bg-background hover:shadow-lg transition-all"
  >
    {icon}
    <span className={`text-2xl font-bold mt-2 ${color}`}>{value}</span>
    <span className="text-sm text-muted-foreground">{label}</span>
  </motion.div>
);

const StatsTab = () => {
  const { tasks, pomodoroSessions, statsTimeframe } = useApp();

  const stats = useMemo(() => calculateStats(tasks, pomodoroSessions, statsTimeframe), [tasks, pomodoroSessions, statsTimeframe]);

  // Task stats cards
  const tasksCards = [
    {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      value: stats.completedTasks,
      label: "Completed Tasks",
      color: "text-green-500"
    },
    {
      icon: <Circle className="h-8 w-8 text-yellow-500" />,
      value: stats.pendingTasks,
      label: "Pending Tasks",
      color: "text-yellow-500"
    },
    {
      icon: <ListChecks className="h-8 w-8 text-primary" />,
      value: stats.completedTasks + stats.pendingTasks,
      label: "Total Tasks",
      color: "text-primary"
    },
    {
      icon: <AlertCircle className="h-8 w-8 text-red-500" />,
      value: stats.overdueTasks ?? 0,
      label: "Overdue Tasks",
      color: "text-red-500"
    }
  ];

  // Focus stats cards
  const focusCards = [
    {
      icon: <Clock className="h-8 w-8 text-purple-500" />,
      value: stats.focusSessionsCompleted,
      label: "Focus Sessions",
      color: "text-purple-500"
    },
    {
      icon: <Timer className="h-8 w-8 text-green-400" />,
      value: `${stats.totalFocusTime}m`,
      label: "Total Focus Time",
      color: "text-green-400"
    },
    {
      icon: <Hourglass className="h-8 w-8 text-indigo-400" />,
      value: stats.focusSessionsCompleted > 0 ? `${Math.round(stats.totalFocusTime / stats.focusSessionsCompleted)}m` : "0m",
      label: "Avg. Session",
      color: "text-indigo-400"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-emerald-400" />,
      value: (stats.completedTasks + stats.pendingTasks) > 0
        ? `${Math.round((stats.completedTasks / (stats.completedTasks + stats.pendingTasks)) * 100)}%`
        : "0%",
      label: "Task Completion Rate",
      color: "text-emerald-400"
    }
  ];

  // Productivity Insights (example, you can expand logic as needed)
  const insightsCards = [
    {
      icon: <Lightbulb className="h-8 w-8 text-yellow-400" />,
      value: "10:00",
      label: "Peak Performance",
      color: "text-yellow-400"
    },
    {
      icon: <Gauge className="h-8 w-8 text-green-500" />,
      value: "85%",
      label: "Efficiency",
      color: "text-green-500"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-500" />,
      value: "92/100",
      label: "Consistency",
      color: "text-purple-500"
    },
    {
      icon: <Target className="h-8 w-8 text-orange-400" />,
      value: "60%",
      label: "Goal Progress",
      color: "text-orange-400"
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 px-2 md:px-0">
      <h2 className="text-3xl font-bold mb-4 text-white">Statistics</h2>
      {/* Timeframe Selector */}
      {/* ...your timeframe selector here... */}

      {/* Tasks Overview */}
      <Card className="bg-[#18181b] border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-white">Tasks Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tasksCards.map((stat, idx) => (
            <AnimatedStatCard key={stat.label} {...stat} delay={idx * 0.08} />
          ))}
        </CardContent>
      </Card>

      {/* Focus Overview */}
      <Card className="bg-[#18181b] border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-white">Focus Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {focusCards.map((stat, idx) => (
            <AnimatedStatCard key={stat.label} {...stat} delay={idx * 0.08} />
          ))}
        </CardContent>
      </Card>

      {/* Productivity Insights */}
      <Card className="bg-[#18181b] border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-white">Productivity Insights</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {insightsCards.map((stat, idx) => (
            <AnimatedStatCard key={stat.label} {...stat} delay={idx * 0.08} />
          ))}
        </CardContent>
      </Card>

      {/* Productivity Time Chart */}
      <Card className="bg-[#18181b] border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-white">Productivity Pattern</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Place your ProductivityTimeChart here */}
          {/* <ProductivityTimeChart /> */}
          <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
            {/* Chart Placeholder */}
            Chart goes here
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsTab;