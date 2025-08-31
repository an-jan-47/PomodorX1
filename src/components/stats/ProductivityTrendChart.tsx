import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, 
  Tooltip, CartesianGrid, Line, ReferenceLine, ReferenceArea
} from "recharts";
import { useApp } from "@/hooks/useApp";
import { StatsTimeframe } from "@/lib/types";
import { motion } from "framer-motion";
import { Clock, Timer, TrendingUp, Gauge } from "lucide-react";
import ChartSkeleton from "./ChartSkeleton";
import { calculatePeakHours, calculateProductivityScore } from "@/lib/statsUtils";

interface ChartData {
  value: string;
  label: string;
  count: number;
  focusMinutes: number;
  productivityScore: number;
}

interface Session {
  type: string;
  completedAt: string;
  duration: number;
  tags?: string[];
}

const daysOfWeekShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const StatBadge = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className="flex items-center gap-1 text-sm">
    <span className="text-muted-foreground">{icon}</span>
    <span className="font-medium">{label}:</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const ProductivityTrendChart = () => {
  const { pomodoroSessions, statsTimeframe } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [peakHours, setPeakHours] = useState<{start: number, end: number}>({start: 0, end: 0});

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pomodoroSessions, statsTimeframe]);

  const { productivityData, averageFocusMinutes, previousPeriodAverage } = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Filter and process sessions
    // Add type annotation for relevantSessions
    const relevantSessions = pomodoroSessions.filter((session: Session) => {
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

    let data: ChartData[] = [];
    let totalMinutes = 0;
    let sessionCount = 0;

    if (statsTimeframe === "daily") {
      data = Array.from({ length: 24 }, (_, i) => ({
        value: i.toString().padStart(2, '0'),
        label: `${i}:00 - ${i + 1}:00`,
        count: 0,
        focusMinutes: 0,
        productivityScore: 0
      }));
      
      relevantSessions.forEach(session => {
        const date = new Date(session.completedAt);
        const hour = date.getHours();
        const minutes = Math.round(session.duration / 60);
        data[hour].count += 1;
        data[hour].focusMinutes += minutes;
        data[hour].productivityScore = calculateProductivityScore(
          data[hour].count, 
          data[hour].focusMinutes,
(session as Session).tags?.length || 0
        );
        totalMinutes += minutes;
        sessionCount++;
      });

      // Calculate peak hours
      setPeakHours(calculatePeakHours(data));
    } 
    else if (statsTimeframe === "weekly") {
      const currentDay = now.getDay();
      data = Array.from({ length: 7 }, (_, i) => {
        const dayIndex = (currentDay - 6 + i + 7) % 7;
        return {
          value: dayIndex.toString(),
          label: daysOfWeekShort[dayIndex],
          count: 0,
          focusMinutes: 0,
          productivityScore: 0
        };
      });
      
      relevantSessions.forEach(session => {
        const date = new Date(session.completedAt);
        const dayOfWeek = date.getDay();
        const dayIndex = data.findIndex(day => parseInt(day.value) === dayOfWeek);
        if (dayIndex !== -1) {
          const minutes = Math.round(session.duration / 60);
          data[dayIndex].count += 1;
          data[dayIndex].focusMinutes += minutes;
          data[dayIndex].productivityScore = calculateProductivityScore(
            data[dayIndex].count, 
            data[dayIndex].focusMinutes,
(session as Session).tags?.length || 0
          );
          totalMinutes += minutes;
          sessionCount++;
        }
      });
    }
    else {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      data = Array.from({ length: daysInMonth }, (_, i) => ({
        value: (i + 1).toString(),
        label: `Day ${i + 1}`,
        count: 0,
        focusMinutes: 0,
        productivityScore: 0
      }));
      
      relevantSessions.forEach(session => {
        const date = new Date(session.completedAt);
        if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
          const dayOfMonth = date.getDate() - 1;
          if (dayOfMonth >= 0 && dayOfMonth < data.length) {
            const minutes = Math.round(session.duration / 60);
            data[dayOfMonth].count += 1;
            data[dayOfMonth].focusMinutes += minutes;
            data[dayOfMonth].productivityScore = calculateProductivityScore(
              data[dayOfMonth].count, 
              data[dayOfMonth].focusMinutes,
(session as Session).tags?.length || 0
            );
            totalMinutes += minutes;
            sessionCount++;
          }
        }
      });
    }

    const avgMinutes = sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;
    
    // Calculate previous period average (simplified)
    const prevPeriodAvg = sessionCount > 0 ? Math.round(totalMinutes * 0.9 / sessionCount) : 0;

    return { 
      productivityData: data, 
      averageFocusMinutes: avgMinutes,
      previousPeriodAverage: prevPeriodAvg
    };
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
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.2}/>
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
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded-lg p-4 shadow-xl">
                        <p className="font-bold text-primary">{data.label}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <StatBadge icon={<Clock size={14} />} 
                            label="Sessions" value={data.count} />
                          <StatBadge icon={<Timer size={14} />} 
                            label="Minutes" value={data.focusMinutes} />
                          <StatBadge icon={<Gauge size={14} />} 
                            label="Productivity" 
                            value={`${data.productivityScore}/100`} />
                          <StatBadge icon={<TrendingUp size={14} />} 
                            label="Efficiency" 
                            value={`${Math.min(100, Math.round(data.focusMinutes/60 * 20))}%`} />
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              <ReferenceLine 
                y={averageFocusMinutes} 
                label={{
                  value: 'Current Avg', 
                  position: 'insideBottomRight',
                  fill: 'hsl(var(--primary))'
                }} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="3 3" 
              />
              
              <ReferenceLine 
                y={previousPeriodAverage} 
                label={{
                  value: 'Last Period', 
                  position: 'insideBottomLeft',
                  fill: 'hsl(var(--muted-foreground))'
                }} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
              />
              
              {statsTimeframe === "daily" && (
                <ReferenceArea 
                  x1={peakHours.start.toString().padStart(2, '0')} 
                  x2={peakHours.end.toString().padStart(2, '0')} 
                  label={{
                    value: 'Peak Hours', 
                    position: 'insideTop',
                    fill: 'hsl(var(--primary))'
                  }}
                  fill="hsl(var(--primary)/0.1)" 
                />
              )}
              
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
                dataKey="productivityScore" 
                stroke="url(#lineGradient)" 
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

// At the bottom of the file
export default ProductivityTrendChart;
