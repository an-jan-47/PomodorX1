
import React, { createContext, useContext, useState, useEffect } from "react";
import { Task, TimerSettings, PomodoroSession, StatsTimeframe, TaskStatus, TaskPriority, TaskDifficulty } from "@/lib/types";
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

interface TaskParams {
  title: string;
  dueDate?: string;
  priority?: TaskPriority;
  difficulty?: TaskDifficulty;
}

interface AppContextType {
  // Tasks
  tasks: Task[];
  addTask: (title: string) => void;
  addTaskWithParams: (params: TaskParams) => void;
  editTask: (id: string, title: string) => void;
  editTaskWithParams: (id: string, params: Partial<TaskParams>) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  
  // Window management
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;

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
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
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

  // Helper function to get automatic category based on priority and difficulty
  const getAutomaticCategory = (priority: TaskPriority, difficulty: TaskDifficulty): string => {
    if (priority === "high" && difficulty === "hard") return "Critical Complex";
    if (priority === "high" && difficulty === "medium") return "High Priority";
    if (priority === "high" && difficulty === "easy") return "Quick Wins";
    if (priority === "medium" && difficulty === "hard") return "Challenging";
    if (priority === "medium" && difficulty === "medium") return "Standard";
    if (priority === "medium" && difficulty === "easy") return "Easy Tasks";
    if (priority === "low" && difficulty === "hard") return "Learning";
    if (priority === "low" && difficulty === "medium") return "Optional";
    return "Minor Tasks";
  };

  // Tasks functions
  const addTask = (title: string) => {
    const newTask: Task = {
      id: generateId(),
      title,
      status: "pending" as TaskStatus,
      createdAt: new Date().toISOString(),
      priority: "medium" as TaskPriority,
      difficulty: "medium" as TaskDifficulty,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    toast({
      title: "Task added",
      description: "Your new task has been created",
    });
  };

  const addTaskWithParams = (params: TaskParams) => {
    const priority = params.priority || "medium";
    const difficulty = params.difficulty || "medium";
    const category = getAutomaticCategory(priority, difficulty);
    
    const newTask: Task = {
      id: generateId(),
      title: params.title,
      status: "pending" as TaskStatus,
      createdAt: new Date().toISOString(),
      dueDate: params.dueDate,
      priority,
      difficulty,
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    toast({
      title: "Task added",
      description: `Task created in category: ${category}`,
    });
  };

  const editTask = (id: string, title: string) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, title } : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  };

  const editTaskWithParams = (id: string, params: Partial<TaskParams>) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task };
        if (params.title) updatedTask.title = params.title;
        if (params.dueDate !== undefined) updatedTask.dueDate = params.dueDate;
        if (params.priority) updatedTask.priority = params.priority;
        if (params.difficulty) updatedTask.difficulty = params.difficulty;
        return updatedTask;
      }
      return task;
    });
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
    const newSession = {
      ...session,
      id: generateId(),
    };
  
    // Immediate state update
    const updatedSessions = [...pomodoroSessions, newSession];
    setPomodoroSessions(updatedSessions);
    
    // Persist to storage
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

  // Enhanced sound functions with production reliability
  const playSound = async (sound: "start" | "pause" | "complete") => {
    if (!timerSettings.soundEnabled) return;
    
    try {
      // Ensure user gesture compliance for browsers
      if (document.visibilityState === 'hidden') {
        console.warn('Skipping sound playback - page not visible');
        return;
      }

      // Try Web Audio API first (better performance)
      const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Resume context if suspended (required by Chrome)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const gainNode = audioContext.createGain();
      gainNode.gain.value = timerSettings.soundVolume / 100;
      
      // Use absolute URLs for sounds in production with cache busting
      const soundUrl = currentCustomSound || 
        new URL(`/sounds/${sound}.mp3?v=${Date.now()}`, window.location.origin).href;
      
      // Load and decode audio file with enhanced error handling
      const response = await fetch(soundUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load sound from ${soundUrl}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Empty audio file received');
      }
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create and configure source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Start playback with fade-in for better UX
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        timerSettings.soundVolume / 100,
        audioContext.currentTime + 0.1
      );
      source.start();
      
      // Clean up resources properly
      source.onended = () => {
        try {
          source.disconnect();
          gainNode.disconnect();
          audioContext.close();
        } catch (e) {
          console.warn('Cleanup warning:', e);
        }
      };
      
      // Timeout for long-running audio contexts
      setTimeout(() => {
        if (audioContext.state !== 'closed') {
          audioContext.close().catch(console.warn);
        }
      }, 10000);
      
    } catch (error) {
      console.error("Web Audio API failed:", error);
      // Enhanced fallback with multiple retry strategies
      await fallbackPlaySound(sound).catch(console.error);
    }
  };
  
  const fallbackPlaySound = async (sound: "start" | "pause" | "complete") => {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const soundUrl = currentCustomSound || 
          new URL(`/sounds/${sound}.mp3?v=${Date.now()}&attempt=${attempt}`, window.location.origin).href;
        
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = Math.max(0, Math.min(1, timerSettings.soundVolume / 100));
        
        // Set up error handling before setting src
        const loadPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Audio load timeout'));
          }, 5000);
          
          audio.addEventListener('canplaythrough', () => {
            clearTimeout(timeout);
            resolve();
          }, { once: true });
          
          audio.addEventListener('error', (e) => {
            clearTimeout(timeout);
            reject(new Error(`Audio load error: ${audio.error?.message || 'Unknown'}`));
          }, { once: true });
        });
        
        audio.src = soundUrl;
        audio.load();
        
        // Wait for audio to be ready
        await loadPromise;
        
        // Attempt to play
        const playPromise = audio.play();
        if (playPromise) {
          await playPromise;
        }
        
        // Clean up when done
        audio.addEventListener('ended', () => {
          audio.remove();
        }, { once: true });
        
        return; // Success, exit retry loop
        
      } catch (error) {
        attempt++;
        console.error(`Fallback sound attempt ${attempt} failed:`, error);
        
        if (attempt >= maxRetries) {
          console.error("All sound playback attempts failed");
          // Last resort: try system beep or notification
          try {
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          } catch (e) {
            console.warn('Vibration fallback failed:', e);
          }
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
  };
  
  const value = {
    tasks,
    addTask,
    addTaskWithParams,
    editTask,
    editTaskWithParams,
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
    setCurrentCustomSound,
    isMinimized,
    setIsMinimized
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
