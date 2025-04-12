import { PomodoroSession } from "@/lib/types";

interface HourlyData {
  value: string;
  focusMinutes: number;
}

export const calculatePeakHours = (hourlyData: HourlyData[]) => {
  const sorted = [...hourlyData].sort((a, b) => b.focusMinutes - a.focusMinutes);
  const peakStart = parseInt(sorted[0]?.value || "0");
  return {
    start: peakStart,
    end: (peakStart + 2) % 24 // 3-hour peak window
  };
};

export const calculateProductivityScore = (
  sessionCount: number, 
  focusMinutes: number,
  tagsCount: number
) => {
  // Score based on:
  // - Focus minutes (50% weight)
  // - Session consistency (30% weight)
  // - Task organization (20% weight - tags)
  const normalizedMinutes = Math.min(300, focusMinutes) / 3; // Max 100
  const normalizedConsistency = Math.min(10, sessionCount) * 3; // Max 30
  const normalizedOrganization = Math.min(5, tagsCount) * 4; // Max 20
  
  return Math.round(normalizedMinutes + normalizedConsistency + normalizedOrganization);
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