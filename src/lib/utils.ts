
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Task, PomodoroSession, StatsTimeframe, AppStats } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  // Handle NaN, negative, or invalid values
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) {
    return "00:00";
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function isToday(date: string): boolean {
  const today = new Date();
  const compareDate = new Date(date);
  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  );
}

export function isThisWeek(date: string): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const compareDate = new Date(date);
  return compareDate >= startOfWeek && compareDate <= endOfWeek;
}

export function isThisMonth(date: string): boolean {
  const today = new Date();
  const compareDate = new Date(date);
  return (
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  );
}

export const calculateStats = (tasks: Task[], pomodoroSessions: PomodoroSession[], timeframe: StatsTimeframe) => {
  // Get today's date at midnight for consistent comparison
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  // Filter sessions based on timeframe
  const filteredSessions = pomodoroSessions.filter(session => {
    const sessionDate = new Date(session.completedAt);
    sessionDate.setHours(0, 0, 0, 0);
    
    if (timeframe === "daily") {
      return sessionDate.getTime() === today.getTime();
    } else if (timeframe === "weekly") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return sessionDate >= weekAgo;
    } else { // monthly
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return sessionDate >= firstDayOfMonth;
    }
  });
  
  // Filter tasks based on timeframe
  const filteredTasks = tasks.filter(task => {
    if (!task.createdAt) return false;
    
    const taskDate = new Date(task.createdAt);
    taskDate.setHours(0, 0, 0, 0);
    
    if (timeframe === "daily") {
      return taskDate.getTime() === today.getTime();
    } else if (timeframe === "weekly") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return taskDate >= weekAgo;
    } else { // monthly
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return taskDate >= firstDayOfMonth;
    }
  });
  
  // Calculate focus sessions stats
  const focusSessionsCompleted = filteredSessions.filter(s => s.type === "focus").length;
  
  // Calculate total focus time in minutes
  const totalFocusTime = filteredSessions
    .filter(s => s.type === "focus")
    .reduce((total, session) => total + Math.round(session.duration / 60), 0);
  
  // Calculate task stats - update to use task.status instead of completedAt
  const completedTasks = filteredTasks.filter(t => t.status === "completed").length;
  const pendingTasks = filteredTasks.filter(t => t.status === "pending").length;
  
  // Calculate overdue tasks
  const overdueTasks = filteredTasks.filter(task => {
    if (task.status === "completed" || !task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < new Date();
  }).length;

  return {
    focusSessionsCompleted,
    totalFocusTime,
    completedTasks,
    pendingTasks,
    overdueTasks
  };
};
