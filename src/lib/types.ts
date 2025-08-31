
export type TaskStatus = "pending" | "completed";

export type TaskPriority = "low" | "medium" | "high";

export type TaskDifficulty = "easy" | "medium" | "hard";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;  // ISO string for due date and time
  priority: TaskPriority;
  difficulty: TaskDifficulty;
}

export interface TimerSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartNextSession: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  desktopNotifications: boolean;
}

export interface PomodoroSession {
  id: string;
  duration: number; // in minutes
  completedAt: string;
  type: "focus" | "shortBreak" | "longBreak";
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  timeRemaining: number;
  currentSession: number;
  currentSessionType: "focus" | "shortBreak" | "longBreak";
  lastUpdated: string;  // 添加这个属性
}

export type StatsTimeframe = "daily" | "weekly" | "monthly";

export interface AppStats {
  completedTasks: number;
  pendingTasks: number;
  focusSessionsCompleted: number;
  totalFocusTime: number; // in minutes
}
