import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Line } from "recharts";
import { useApp } from "@/hooks/useApp";
import { StatsTimeframe } from "@/lib/types";
import { motion } from "framer-motion";
import { Clock, Timer, TrendingUp } from "lucide-react";
import ChartSkeleton from "./ChartSkeleton";

type TimeData = {
  label: string;
  value: string;
  count: number;
  focusMinutes: number;
}

const daysOfWeekShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const StatBadge = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className="flex items-center gap-1 text-sm">
    <span className="text-muted-foreground">{icon}</span>
    <span className="font-medium">{label}:</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const ProductivityTimeChart = () => {
  const { pomodoroSessions, statsTimeframe } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pomodoroSessions, statsTimeframe]);

  const getChartTitle = () => {
    switch (statsTimeframe) {
      case "daily": return "Daily Productivity Pattern";
      case "weekly": return "Weekly Productivity Pattern";
      case "monthly": return "Monthly Productivity Pattern";
      default: return "Productivity Pattern";
    }
  };

  const formatXAxisTick = (value: string) => {
    if (statsTimeframe === "daily") return `${value}h`;
    if (statsTimeframe === "weekly") return daysOfWeekShort[parseInt(value)];
    return value;
  };

  const productivityData = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const relevantSessions = pomodoroSessions.filter(session => {
      if (!session.completedAt || session.type !== "focus") return false;
      
      const sessionDate = new Date(session.completedAt);
      
      if (statsTimeframe === "daily") {
        return sessionDate.toDateString() === today.toDateString();
      } else if (statsTimeframe === "weekly") {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return sessionDate >= weekAgo;
      } else {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return sessionDate >= firstDayOfMonth;
      }
    });

    if (statsTimeframe === "daily") {
      const hours: TimeData[] = Array.from({ length: 24 }, (_, i) => ({
        value: i.toString().padStart(2, '0'),
        label: `${i}:00 - ${i + 1}:00`,
        count: 0,
        focusMinutes: 0
      }));
      
      relevantSessions.forEach(session => {
        const date = new Date(session.completedAt);
        const hour = date.getHours();
        hours[hour].count += 1;
        hours[hour].focusMinutes += Math.round(session.duration / 60);
      });
      
      return hours;
    } 
    else if (statsTimeframe === "weekly") {
      const currentDay = now.getDay();
      const days: TimeData[] = Array.from({ length: 7 }, (_, i) => {
        const dayIndex = (currentDay - 6 + i + 7) % 7;
        return {
          value: dayIndex.toString(),
          label: daysOfWeekShort[dayIndex],
          count: 0,
          focusMinutes: 0
        };
      });
      
      relevantSessions.forEach(session => {
        const date = new Date(session.completedAt);
        const dayOfWeek = date.getDay();
        const dayIndex = days.findIndex(day => parseInt(day.value) === dayOfWeek);
        if (dayIndex !== -1) {
          days[dayIndex].count += 1;
          days[dayIndex].focusMinutes += Math.round(session.duration / 60);
        }
      });
      
      return days;
    }
    else {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const days: TimeData[] = Array.from({ length: daysInMonth }, (_, i) => ({
        value: (i + 1).toString(),
        label: `Day ${i + 1}`,
        count: 0,
        focusMinutes: 0
      }));
      
      relevantSessions.forEach(session => {
        const date = new Date(session.completedAt);
        if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
          const dayOfMonth = date.getDate() - 1;
          if (dayOfMonth >= 0 && dayOfMonth < days.length) {
            days[dayOfMonth].count += 1;
            days[dayOfMonth].focusMinutes += Math.round(session.duration / 60);
          }
        }
      });
      
      return days;
    }
  }, [pomodoroSessions, statsTimeframe]);

  if (isLoading) return <ChartSkeleton />;

  return (
    <Card className="w-full h-[500px] border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {getChartTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="w-full h-[300px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={productivityData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="value" 
                tickFormatter={formatXAxisTick}
                tick={{ fontSize: 12 }}
                interval={statsTimeframe === "monthly" ? 2 : "preserveStartEnd"}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Focus Minutes', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { textAnchor: 'middle' } 
                }}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const data = payload[0].payload as TimeData;
                    return (
                      <div className="bg-background border rounded-lg p-4 shadow-xl">
                        <p className="font-bold text-primary">{data.label}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <StatBadge icon={<Clock size={14} />} 
                            label="Sessions" value={data.count} />
                          <StatBadge icon={<Timer size={14} />} 
                            label="Minutes" value={data.focusMinutes} />
                          <StatBadge icon={<TrendingUp size={14} />} 
                            label="Productivity" 
                            value={`${Math.round(data.focusMinutes/60)}h`} />
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="focusMinutes" 
                fill="url(#barGradient)" 
                radius={[4, 4, 0, 0]}
                animationDuration={1000}
                animationEasing="ease"
                style={{
                  filter: 'drop-shadow(0px 2px 8px rgba(99, 102, 241, 0.3))',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductivityTimeChart;
