import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/hooks/useApp";
import { calculateStats } from "@/lib/utils";
import { CheckCircle, Circle, ListChecks, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const TasksStats = () => {
  const { tasks, pomodoroSessions, statsTimeframe } = useApp();

  const stats = useMemo(() => {
    return calculateStats(tasks, pomodoroSessions, statsTimeframe);
  }, [tasks, pomodoroSessions, statsTimeframe]);

  const statsCards = [
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
      value: stats.overdueTasks ?? 0, // Use nullish coalescing operator
      label: "Overdue Tasks",
      color: "text-red-500"
    }
  ];

  return (
    <Card className="animate-in slide-in-from-bottom-5 duration-500 border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Tasks Overview
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
  );
};

export default TasksStats;
