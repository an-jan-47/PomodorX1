import { PomodoroSession } from "@/lib/types";

interface HourlyData {
  value: string;
  focusMinutes: number;
}

export const calculateSimplePeakHours = (hourlyData: HourlyData[]) => {
  const sorted = [...hourlyData].sort((a, b) => b.focusMinutes - a.focusMinutes);
  const peakStart = parseInt(sorted[0]?.value || "0");
  return {
    start: peakStart,
    end: (peakStart + 2) % 24 // 3-hour peak window
  };
};

// Add these utility functions to improve accuracy

export const calculateProductivityScore = (
  sessionCount: number,
  focusMinutes: number,
  tagsCount: number
): number => {
  // Improved accuracy with weighted calculations
  const minutesScore = Math.min(50, (focusMinutes / 60) * 25);
  const consistencyScore = Math.min(30, (sessionCount / 4) * 30);
  const organizationScore = Math.min(20, (tagsCount / 3) * 20);
  
  // Add validation to ensure score is between 0-100
  return Math.max(0, Math.min(100, Math.round(
    minutesScore + consistencyScore + organizationScore
  )));
};

// Add new metrics calculation
export const calculateAdvancedMetrics = (sessions: PomodoroSession[]) => {
  const totalSessions = sessions.length;
  if (!totalSessions) return null;

  const completedSessions = sessions.filter(s => s.completedAt).length;
  const totalFocusTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const averageSessionLength = totalFocusTime / totalSessions;
  
  return {
    completionRate: (completedSessions / totalSessions) * 100,
    averageSessionLength,
    focusTimeDistribution: calculateFocusTimeDistribution(sessions),
    productivityTrend: calculateProductivityTrend(sessions),
    consistencyScore: calculateConsistencyScore(sessions)
  };
};

// Add focus time distribution analysis
const calculateFocusTimeDistribution = (sessions: PomodoroSession[]) => {
  const hourlyDistribution = new Array(24).fill(0);
  
  sessions.forEach(session => {
    if (session.completedAt) {
      const hour = new Date(session.completedAt).getHours();
      hourlyDistribution[hour] += session.duration;
    }
  });
  
  return hourlyDistribution;
};

// Add productivity trend analysis
const calculateProductivityTrend = (sessions: PomodoroSession[]) => {
  const dailyProductivity = new Map<string, number>();
  
  sessions.forEach(session => {
    if (session.completedAt) {
      const date = new Date(session.completedAt).toLocaleDateString();
      dailyProductivity.set(date, 
        (dailyProductivity.get(date) || 0) + session.duration
      );
    }
  });
  
  return Array.from(dailyProductivity.entries())
    .sort(([dateA], [dateB]) => 
      new Date(dateA).getTime() - new Date(dateB).getTime()
    );
};

export const calculatePeakHours = (data: HourlyData[]): { start: number; end: number } => {
  // Find the 3-hour window with highest productivity
  let maxProductivity = 0;
  let peakStart = 0;
  let peakEnd = 0;

  for (let i = 0; i < data.length - 2; i++) {
    const windowProductivity = 
      data[i].focusMinutes + 
      data[i + 1].focusMinutes + 
      data[i + 2].focusMinutes;

    if (windowProductivity > maxProductivity) {
      maxProductivity = windowProductivity;
      peakStart = i;
      peakEnd = i + 2;
    }
  }

  return { start: peakStart, end: peakEnd };
};

export const calculateTrendline = (data: HourlyData[]): number[] => {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  data.forEach((point, i) => {
    sumX += i;
    sumY += point.focusMinutes;
    sumXY += i * point.focusMinutes;
    sumXX += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return data.map((_, i) => slope * i + intercept);
};

export const analyzeFocusPatterns = (sessions: PomodoroSession[]) => {
  if (!sessions.length) {
    return {
      dailyAverage: 0,
      peakHour: "N/A",
      consistencyScore: 0
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  
  const recentSessions = sessions.filter(s => 
    s.completedAt && new Date(s.completedAt) > oneWeekAgo
  );
  
  const dailyTotals: Record<string, number> = {};
  const hourlyTotals: Record<string, number> = {};
  
  recentSessions.forEach(session => {
    if (!session.completedAt) return;
    
    const date = new Date(session.completedAt);
    const day = date.toLocaleDateString();
    const hour = date.getHours();
    
    dailyTotals[day] = (dailyTotals[day] || 0) + session.duration;
    hourlyTotals[hour] = (hourlyTotals[hour] || 0) + session.duration;
  });

  const totalDays = Object.keys(dailyTotals).length;
  
  return {
    dailyAverage: totalDays > 0 
      ? Object.values(dailyTotals).reduce((a, b) => a + b, 0) / totalDays 
      : 0,
    peakHour: Object.entries(hourlyTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A",
    consistencyScore: calculateConsistencyScore(Object.values(dailyTotals))
  };
};

const calculateConsistencyScore = (dailyMinutes: number[]) => {
  if (dailyMinutes.length < 3) return 0;
  
  const mean = dailyMinutes.reduce((a, b) => a + b, 0) / dailyMinutes.length;
  const variance = dailyMinutes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyMinutes.length;
  
  // Higher score for lower variance (more consistent)
  return Math.round(Math.max(0, 100 - (Math.sqrt(variance) / mean * 100)));
};