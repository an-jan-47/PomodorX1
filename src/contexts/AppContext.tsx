
import React, { createContext, useContext, useState, useEffect } from "react";
import { Task, TimerSettings, PomodoroSession, StatsTimeframe, TaskStatus } from "@/lib/types";
import { 
  getTasks, 
  saveTasks, 
  getTimerSettings, 
  saveTimerSettings, 
  getPomodoroSessions, 
  savePomodoroSession,
  getCustomSounds,
  saveCustomSounds,
  defaultTimerSettings  // Import from storage.ts
} from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  // Tasks
  tasks: Task[];
  addTask: (title: string) => void;
  editTask: (id: string, title: string) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;

  // Timer Settings
  timerSettings: TimerSettings;
  updateTimerSettings: (settings: Partial<TimerSettings>) => void;

  // Pomodoro Sessions
  pomodoroSessions: PomodoroSession[];
  recordPomodoroSession: (session: Omit<PomodoroSession, "id">) => void;

  // Stats
  statsTimeframe: StatsTimeframe;
  setStatsTimeframe: (timeframe: StatsTimeframe) => void;

  // Audio
  playSound: (sound: "start" | "pause" | "complete") => void;
  
  // Custom Sounds
  customSounds: string[];
  addCustomSound: (soundUrl: string) => void;
  removeCustomSound: (soundUrl: string) => void;
  currentCustomSound: string | null;
  setCurrentCustomSound: (soundUrl: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(defaultTimerSettings);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [statsTimeframe, setStatsTimeframe] = useState<StatsTimeframe>("daily");
  const [customSounds, setCustomSounds] = useState<string[]>([]);
  const [currentCustomSound, setCurrentCustomSound] = useState<string | null>(null);
  const { toast } = useToast();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setTasks(getTasks());
    setTimerSettings(getTimerSettings());
    setPomodoroSessions(getPomodoroSessions());
    setCustomSounds(getCustomSounds());
    
    // Force dark mode
    document.documentElement.classList.add("dark");
    
    // Initialize audio element
    audioRef.current = new Audio();
    
    // Preload sounds
    const soundsToPreload = ["/sounds/start.mp3", "/sounds/pause.mp3", "/sounds/complete.mp3"];
    for (const sound of soundsToPreload) {
      const audio = new Audio();
      audio.src = sound;
      audio.preload = "auto";
    }
  }, []);

  // Tasks functions
  const addTask = (title: string) => {
    const newTask: Task = {
      id: generateId(),
      title,
      status: "pending" as TaskStatus,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    toast({
      title: "Task added",
      description: "Your new task has been created",
    });
  };

  const editTask = (id: string, title: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, title } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const toggleTaskStatus = (id: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const newStatus = task.status === "pending" ? "completed" : "pending";
        return {
          ...task,
          status: newStatus as TaskStatus,
          completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    toast({
      title: "Task deleted",
      description: "The task has been removed",
    });
  };

  // Timer settings functions
  const updateTimerSettings = (settings: Partial<TimerSettings>) => {
    const updatedSettings = { ...timerSettings, ...settings };
    setTimerSettings(updatedSettings);
    saveTimerSettings(updatedSettings);
    toast({
      title: "Settings updated",
      description: "Your timer settings have been saved",
    });
  };

  // Pomodoro session functions
  const recordPomodoroSession = (session: Omit<PomodoroSession, "id">) => {
    const newSession: PomodoroSession = {
      ...session,
      id: generateId(),
    };
    const updatedSessions = [...pomodoroSessions, newSession];
    setPomodoroSessions(updatedSessions);
    savePomodoroSession(newSession);
  };

  // Custom sounds functions
  const addCustomSound = (soundUrl: string) => {
    // Validate URL before adding
    try {
      new URL(soundUrl);
      
      // Try to create an audio element with the URL to check if it's valid
      const testAudio = new Audio();
      
      // Set up events before setting the source
      testAudio.addEventListener('canplaythrough', () => {
        // Only add the sound if it can be played
        const updatedSounds = [...customSounds, soundUrl];
        setCustomSounds(updatedSounds);
        saveCustomSounds(updatedSounds);
        
        // Set as current sound
        setCurrentCustomSound(soundUrl);
        
        toast({
          title: "Sound added",
          description: "Your custom sound has been added and set as current",
        });
      });
      
      testAudio.addEventListener('error', () => {
        toast({
          title: "Sound Error",
          description: "Could not load the sound from provided URL",
          variant: "destructive"
        });
      });
      
      // Now set the source and try to load it
      testAudio.src = soundUrl;
      testAudio.volume = 0.2; // Lower volume for testing
      testAudio.load();
      
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL for the sound",
        variant: "destructive"
      });
    }
  };

  const removeCustomSound = (soundUrl: string) => {
    const updatedSounds = customSounds.filter(sound => sound !== soundUrl);
    setCustomSounds(updatedSounds);
    saveCustomSounds(updatedSounds);
    
    // If the current sound is removed, reset it
    if (currentCustomSound === soundUrl) {
      setCurrentCustomSound(null);
    }
  };

  // Sound functions
  const playSound = (sound: "start" | "pause" | "complete") => {
    if (!timerSettings.soundEnabled) return;
    
    try {
      // Create a new audio element each time to avoid issues with concurrent plays
      const audio = new Audio();
      
      // Set the source based on the sound type
      if (currentCustomSound && (sound === "complete" || sound === "start")) {
        audio.src = currentCustomSound;
      } else {
        // Default sounds
        switch (sound) {
          case "start":
            audio.src = "/sounds/start.mp3";
            break;
          case "pause":
            audio.src = "/sounds/pause.mp3";
            break;
          case "complete":
            audio.src = "/sounds/complete.mp3";
            break;
        }
      }
      
      // Set volume using the soundVolume setting
      audio.volume = timerSettings.soundVolume / 100;
      
      // Add error handling
      audio.onerror = () => {
        console.error("Error playing sound for:", sound);
        
        // If custom sound fails, fall back to default
        if (currentCustomSound && (sound === "complete" || sound === "start")) {
          const fallbackAudio = new Audio(`/sounds/${sound}.mp3`);
          fallbackAudio.volume = timerSettings.soundVolume / 100;
          fallbackAudio.play().catch(e => console.error("Error playing fallback sound:", e));
        }
      };
      
      // Play the sound
      audio.play().catch(e => console.error("Error playing sound:", e));
    } catch (error) {
      console.error("Error in playSound function:", error);
    }
  };

  const value = {
    tasks,
    addTask,
    editTask,
    toggleTaskStatus,
    deleteTask,
    timerSettings,
    updateTimerSettings,
    pomodoroSessions,
    recordPomodoroSession,
    statsTimeframe,
    setStatsTimeframe,
    playSound,
    customSounds,
    addCustomSound,
    removeCustomSound,
    currentCustomSound,
    setCurrentCustomSound
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
