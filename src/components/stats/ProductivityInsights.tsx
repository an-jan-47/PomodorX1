import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useApp } from '@/hooks/useApp';
import { 
  Lightbulb, TrendingUp, Clock, Gauge, Target 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { analyzeFocusPatterns } from '@/lib/statsUtils';

const InsightCard = ({ 
  icon, 
  title, 
  value, 
  description,
  color = "text-primary"
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  color?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`flex items-start gap-4 p-4 rounded-lg border bg-background hover:shadow-md transition-all ${color}`}
  >
    <div className="p-2 rounded-full bg-opacity-20 bg-current">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-2xl font-bold my-1">{value}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </motion.div>
);

const ProductivityInsights = () => {
  const { pomodoroSessions, tasks, statsTimeframe } = useApp();

  const insights = useMemo(() => {
    const focusSessions = pomodoroSessions.filter(s => s.type === "focus" && s.completedAt);
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    
    const { peakHour, consistencyScore } = analyzeFocusPatterns(focusSessions);
    
    // Calculate efficiency (focus minutes vs total available)
    const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration / 60), 0);
    const efficiency = statsTimeframe === "daily" 
      ? totalFocusMinutes / (16 * 60) // 16 waking hours
      : statsTimeframe === "weekly"
        ? totalFocusMinutes / (16 * 60 * 7)
        : totalFocusMinutes / (16 * 60 * 30);
    
    return {
      bestPeriod: peakHour,
      efficiency: Math.min(100, Math.round(efficiency * 100)),
      consistency: consistencyScore,
      tasksPerSession: focusSessions.length > 0 
        ? (completedTasks / focusSessions.length).toFixed(1)
        : "0",
      deepWorkRatio: calculateDeepWorkRatio(focusSessions),
      goalProgress: calculateGoalProgress(focusSessions, statsTimeframe)
    };
  }, [pomodoroSessions, tasks, statsTimeframe]);

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="text-yellow-500" />
          <span>Your Productivity Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard
          icon={<Clock className="w-5 h-5" />}
          title="Peak Performance"
          value={insights.bestPeriod + (statsTimeframe === "daily" ? ":00" : "")}
          description={`Your most productive ${statsTimeframe === "daily" ? "hour" : "day"}`}
          color="text-blue-500"
        />
        
        <InsightCard
          icon={<Gauge className="w-5 h-5" />}
          title="Efficiency Score"
          value={`${insights.efficiency}%`}
          description="Of available time spent in deep work"
          color="text-green-500"
        />
        
        <InsightCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Consistency"
          value={`${insights.consistency}/100`}
          description="How steady your productivity is"
          color="text-purple-500"
        />
        
        <InsightCard
          icon={<Target className="w-5 h-5" />}
          title="Goal Progress"
          value={`${insights.goalProgress}%`}
          description="Towards your weekly target"
          color="text-orange-500"
        />
      </CardContent>
    </Card>
  );
};

// Update helper function types
const calculateDeepWorkRatio = (sessions: { duration: number }[]) => {
  const deepWorkThreshold = 25 * 60;
  const deepWorkSessions = sessions.filter(s => s.duration >= deepWorkThreshold);
  return deepWorkSessions.length > 0 
    ? Math.round((deepWorkSessions.length / sessions.length) * 100)
    : 0;
};

const calculateGoalProgress = (sessions: { duration: number }[], timeframe: string) => {
  const weeklyGoal = 20 * 60;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration / 60), 0);
  
  if (timeframe === "weekly") {
    return Math.min(100, Math.round((totalMinutes / weeklyGoal) * 100));
  }
  return Math.min(100, Math.round((totalMinutes / (weeklyGoal / 4)) * 100));
};

// At the bottom of the file
export default ProductivityInsights;
