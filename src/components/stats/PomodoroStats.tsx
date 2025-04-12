import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import { calculateStats } from "@/lib/utils";
import { Clock, Timer, Hourglass, TrendingUp } from "lucide-react";
import ProductivityTimeChart from "./ProductivityTimeChart";
import { motion } from "framer-motion";

const PomodoroStats = () => {
  const { tasks, pomodoroSessions, statsTimeframe } = useApp();

  const stats = useMemo(() => {
    return calculateStats(tasks, pomodoroSessions, statsTimeframe);
  }, [tasks, pomodoroSessions, statsTimeframe]);

  const formatDetailedFocusTime = () => {
    const totalMinutes = stats.totalFocusTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);
    return parts.join(" ");
  };

  const statsCards = [
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      value: stats.focusSessionsCompleted,
      label: "Focus Sessions",
      color: "text-primary"
    },
    {
      icon: <Timer className="h-8 w-8 text-accent" />,
      value: formatDetailedFocusTime(),
      label: "Total Focus Time",
      color: "text-accent"
    },
    {
      icon: <Hourglass className="h-8 w-8 text-primary" />,
      value: stats.focusSessionsCompleted > 0
        ? Math.round(stats.totalFocusTime / stats.focusSessionsCompleted) + "m"
        : "0m",
      label: "Avg. Session",
      color: "text-primary"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
      value: stats.focusSessionsCompleted > 0 
        ? `${Math.round((stats.completedTasks / stats.focusSessionsCompleted) * 100)}%` 
        : '0%',
      label: "Task Completion Rate",
      color: "text-green-500"
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="animate-in fade-in-50 duration-500 border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Focus Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="stats-card flex flex-col items-center justify-center p-4 rounded-lg border bg-background hover:shadow-md transition-all"
            >
              {stat.icon}
              <span className={`text-2xl font-bold mt-2 ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </CardContent>
      </Card>
      
      <div className="w-full max-w-4xl mx-auto">
        <ProductivityTimeChart />
      </div>
    </div>
  );
};

export default PomodoroStats;