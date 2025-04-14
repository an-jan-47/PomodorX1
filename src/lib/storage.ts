import { Task, TimerSettings, PomodoroSession } from "./types";

export const defaultTimerSettings: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartNextSession: false,
  soundEnabled: true,
  soundVolume: 50,
  desktopNotifications: false,
};

// Local Storage Keys
const TASKS_KEY = "flow_focus_tasks";
const TIMER_SETTINGS_KEY = "flow_focus_timer_settings";
const POMODORO_SESSIONS_KEY = "flow_focus_pomodoro_sessions";
const THEME_KEY = "flow_focus_theme";

// Tasks Storage
export const getTasks = (): Task[] => {
  const tasksJson = localStorage.getItem(TASKS_KEY);
  return tasksJson ? JSON.parse(tasksJson) : [];
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

// Timer Settings Storage
export function getTimerSettings(): TimerSettings {
  const settings = localStorage.getItem(TIMER_SETTINGS_KEY);
  return settings ? JSON.parse(settings) : defaultTimerSettings;
}

export const saveTimerSettings = (settings: TimerSettings) => {
  localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(settings));
};

// Pomodoro Sessions Storage
export const getPomodoroSessions = (): PomodoroSession[] => {
  const sessionsJson = localStorage.getItem(POMODORO_SESSIONS_KEY);
  return sessionsJson ? JSON.parse(sessionsJson) : [];
};

export const savePomodoroSession = (session: PomodoroSession) => {
  const sessions = getPomodoroSessions();
  sessions.push(session);
  localStorage.setItem(POMODORO_SESSIONS_KEY, JSON.stringify(sessions));
};

// Theme Storage
export const getTheme = (): "light" | "dark" => {
  return (localStorage.getItem(THEME_KEY) as "light" | "dark") || "light";
};

export const saveTheme = (theme: "light" | "dark") => {
  localStorage.setItem(THEME_KEY, theme);
};

// Custom sounds storage
export const getCustomSounds = (): string[] => {
  const customSounds = localStorage.getItem("flowfocus_custom_sounds");
  return customSounds ? JSON.parse(customSounds) : [];
};

export const saveCustomSounds = (sounds: string[]): void => {
  localStorage.setItem("flowfocus_custom_sounds", JSON.stringify(sounds));
};
