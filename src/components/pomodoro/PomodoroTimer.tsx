import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import { TimerState } from "@/lib/types";
import PomodoroControls from "./PomodoroControls";
import PomodoroProgress from "./PomodoroProgress";

interface PomodoroTimerProps {
  onOpenSettings: () => void;
}

const PomodoroTimer = ({ onOpenSettings }: PomodoroTimerProps) => {
  const { timerSettings, recordPomodoroSession, playSound, pomodoroSessions } = useApp();

  const timerRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const prevSettingsRef = useRef(timerSettings);
  const workerRef = useRef<Worker | null>(null);

  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  const [faviconTimer, setFaviconTimer] = useState<HTMLLinkElement | null>(null);

  const [state, setState] = useState<TimerState>(() => {
    const saved = localStorage.getItem('pomodoroState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedDate = new Date(parsed.lastUpdated).toDateString();
        const now = new Date().toDateString();
        if (savedDate === now) {
          if (parsed.isRunning && !parsed.isPaused) {
            const elapsed = Math.floor((Date.now() - new Date(parsed.lastUpdated).getTime()) / 1000);
            parsed.timeRemaining = Math.max(0, parsed.timeRemaining - elapsed);
          }
          return parsed;
        }
      } catch (error) {
        console.error('Error parsing saved pomodoro state:', error);
      }
    }
    return {
      isRunning: false,
      isPaused: false,
      timeRemaining: timerSettings.focusDuration * 60,
      currentSession: 1,
      currentSessionType: "focus",
      lastUpdated: new Date().toISOString(),
    };
  });

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    // Create a web worker for background timing
    if (typeof Worker !== 'undefined' && !workerRef.current) {
      const workerCode = `
        let timerId = null;
        let targetTime = null;
        
        self.onmessage = function(e) {
          if (e.data.command === 'start') {
            clearInterval(timerId);
            targetTime = e.data.targetTime;
            
            timerId = setInterval(() => {
              const now = Date.now();
              const remaining = Math.ceil((targetTime - now) / 1000);
              
              if (remaining <= 0) {
                clearInterval(timerId);
                self.postMessage({ type: 'complete' });
              } else {
                self.postMessage({ 
                  type: 'tick', 
                  remaining: remaining,
                  timestamp: now
                });
              }
            }, 1000);
          } else if (e.data.command === 'stop') {
            clearInterval(timerId);
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      workerRef.current = new Worker(URL.createObjectURL(blob));
      
      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'tick') {
          setState(prev => ({
            ...prev,
            timeRemaining: e.data.remaining,
            lastUpdated: new Date(e.data.timestamp).toISOString()
          }));
        } else if (e.data.type === 'complete') {
          handleSessionComplete();
        }
      };
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, make sure worker is running if timer is active
        if (state.isRunning && !state.isPaused && workerRef.current) {
          // Update the worker with current state
          workerRef.current.postMessage({
            command: 'start',
            targetTime: Date.now() + state.timeRemaining * 1000
          });
        }
      } else {
        // Tab is visible again, sync UI with actual time
        if (state.isRunning && !state.isPaused) {
          const now = Date.now();
          const elapsed = Math.floor((now - new Date(state.lastUpdated).getTime()) / 1000);
          const newRemaining = Math.max(0, state.timeRemaining - elapsed);
          
          if (newRemaining <= 0) {
            handleSessionComplete();
          } else {
            setState(prev => ({ ...prev, timeRemaining: newRemaining }));
            
            // Restart animation frame for smooth countdown
            if (timerRef.current) cancelAnimationFrame(timerRef.current);
            targetEndTimeRef.current = now + newRemaining * 1000;
            timerRef.current = requestAnimationFrame(tick);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.isRunning, state.isPaused, state.timeRemaining, state.lastUpdated]);

  // Show notification
  const showNotification = useCallback((sessionType: string) => {
    if (timerSettings.desktopNotifications) {
      try {
        const title = sessionType === "focus" 
          ? "Focus Session Complete!" 
          : sessionType === "shortBreak" 
            ? "Short Break Complete!" 
            : "Long Break Complete!";
            
        const message = sessionType === "focus" 
          ? "Time for a break!" 
          : "Time to focus again!";
        
        // Try native notifications
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { 
            body: message,
            icon: "/favicon.ico"
          });
        }
        
        // Play sound regardless of notification permission
        if (timerSettings.soundEnabled) {
          const audio = new Audio();
          audio.src = "/notification.mp3";
          audio.volume = timerSettings.soundVolume;
          audio.play().catch(err => console.error("Error playing sound:", err));
        }
      } catch (error) {
        console.error("Notification error:", error);
      }
    }
  }, [timerSettings]);

  // Handle session completion
  const handleSessionComplete = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
    targetEndTimeRef.current = null;
    
    // Play sound and show notification
    playSound("complete");
    showNotification(state.currentSessionType);
    
    // Visual feedback
    setShowCompletionEffect(true);
    setTimeout(() => setShowCompletionEffect(false), 2000);

    // Record the completed session
    const sessionDuration = state.currentSessionType === "focus"
      ? timerSettings.focusDuration
      : state.currentSessionType === "shortBreak"
      ? timerSettings.shortBreakDuration
      : timerSettings.longBreakDuration;

    recordPomodoroSession({
      type: state.currentSessionType,
      duration: sessionDuration * 60,
      completedAt: new Date().toISOString(),
    });

    // Set up next session
    const nextState = getNextSession(state);
    setState(nextState);
    
    // Auto-start next session if enabled
    if (nextState.isRunning) {
      setTimeout(() => {
        targetEndTimeRef.current = Date.now() + nextState.timeRemaining * 1000;
        
        // Start the worker for background timing
        if (workerRef.current) {
          workerRef.current.postMessage({
            command: 'start',
            targetTime: targetEndTimeRef.current
          });
        }
        
        // Start animation frame for smooth UI updates when visible
        if (!document.hidden) {
          timerRef.current = requestAnimationFrame(tick);
        }
      }, 1000);
    }
  }, [state, timerSettings, playSound, showNotification, recordPomodoroSession]);

  // Animation frame tick function for smooth countdown
  const tick = useCallback(() => {
    const now = Date.now();
    const remaining = Math.ceil((targetEndTimeRef.current! - now) / 1000);

    if (remaining <= 0) {
      cancelAnimationFrame(timerRef.current!);
      timerRef.current = null;
      targetEndTimeRef.current = null;
      handleSessionComplete();
      return;
    }

    setState(prev => ({
      ...prev,
      timeRemaining: remaining,
      lastUpdated: new Date().toISOString()
    }));

    timerRef.current = requestAnimationFrame(tick);
  }, [handleSessionComplete]);

  // Get the next session state
  const getNextSession = useCallback((currentState: TimerState): TimerState => {
    if (currentState.currentSessionType === "focus") {
      const isLongBreak = currentState.currentSession % timerSettings.sessionsBeforeLongBreak === 0;
      const nextType = isLongBreak ? "longBreak" : "shortBreak";
      const nextDuration = isLongBreak ? timerSettings.longBreakDuration : timerSettings.shortBreakDuration;
      return {
        isRunning: timerSettings.autoStartNextSession,
        isPaused: false,
        timeRemaining: nextDuration * 60,
        currentSession: currentState.currentSession,
        currentSessionType: nextType,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      return {
        isRunning: timerSettings.autoStartNextSession,
        isPaused: false,
        timeRemaining: timerSettings.focusDuration * 60,
        currentSession: currentState.currentSession + 1,
        currentSessionType: "focus",
        lastUpdated: new Date().toISOString(),
      };
    }
  }, [timerSettings]);

  // Reset timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    if (workerRef.current) workerRef.current.postMessage({ command: 'stop' });
    
    targetEndTimeRef.current = null;
    setState({
      isRunning: false,
      isPaused: false,
      timeRemaining: timerSettings.focusDuration * 60,
      currentSession: 1,
      currentSessionType: "focus",
      lastUpdated: new Date().toISOString(),
    });
    updateFavicon("00:00");
  }, [timerSettings]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem("pomodoroState", JSON.stringify({ 
      ...state, 
      lastUpdated: new Date().toISOString() 
    }));
  }, [state]);

  // Update favicon with timer
  const updateFavicon = (time: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(time, 32, 32);

    const favicon = document.querySelector("link[rel~='icon']") || document.createElement("link");
    favicon.setAttribute("rel", "icon");
    favicon.setAttribute("href", canvas.toDataURL());
    document.head.appendChild(favicon);
    setFaviconTimer(favicon as HTMLLinkElement);
  };

  // Update favicon when time changes
  useEffect(() => {
    if (state.timeRemaining >= 0) {
      updateFavicon(formatTime(state.timeRemaining));
    }
  }, [state.timeRemaining]);

  // Start timer
  const startTimer = useCallback(() => {
    if (!state.isRunning) playSound("start");
    
    const now = Date.now();
    targetEndTimeRef.current = now + state.timeRemaining * 1000;
    
    // Start the worker for background timing
    if (workerRef.current) {
      workerRef.current.postMessage({
        command: 'start',
        targetTime: targetEndTimeRef.current
      });
    }
    
    setState(prev => ({ 
      ...prev, 
      isRunning: true, 
      isPaused: false, 
      lastUpdated: new Date().toISOString() 
    }));
    
    // Start animation frame for smooth UI updates
    timerRef.current = requestAnimationFrame(tick);
  }, [state.isRunning, state.timeRemaining, playSound, tick]);

  // Pause timer
  const pauseTimer = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    if (workerRef.current) workerRef.current.postMessage({ command: 'stop' });
    
    timerRef.current = null;
    targetEndTimeRef.current = null;
    
    setState(prev => ({ 
      ...prev, 
      isPaused: true, 
      lastUpdated: new Date().toISOString() 
    }));
    
    playSound("pause");
  }, [playSound]);

  // Skip to next session
  const skipSession = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    if (workerRef.current) workerRef.current.postMessage({ command: 'stop' });
    
    targetEndTimeRef.current = null;
    setState(prev => getNextSession(prev));
  }, [getNextSession]);

  const sessionTitle =
    state.currentSessionType === "focus" ? "Focus Session" :
    state.currentSessionType === "shortBreak" ? "Short Break" : "Long Break";

  const totalSeconds =
    state.currentSessionType === "focus" ? timerSettings.focusDuration * 60 :
    state.currentSessionType === "shortBreak" ? timerSettings.shortBreakDuration * 60 :
    timerSettings.longBreakDuration * 60;

  const progress = ((totalSeconds - state.timeRemaining) / totalSeconds) * 100;

  const todaysFocusSessions = pomodoroSessions.filter(s => 
    new Date(s.completedAt).toDateString() === new Date().toDateString() && 
    s.type === "focus"
  ).length;

  return (
    <Card className={`w-full max-w-md mx-auto transition-all duration-300 ${showCompletionEffect ? 'ring-4 ring-primary animate-pulse' : ''}`}>
      <CardContent className="pt-6 flex flex-col items-center">
        <div className="w-full mb-6">
          <PomodoroProgress
            progress={progress}
            currentSession={state.currentSession}
            sessionsBeforeLongBreak={timerSettings.sessionsBeforeLongBreak}
            currentSessionType={state.currentSessionType}
          />
        </div>

        <div className="text-xl font-medium mb-2">{sessionTitle}</div>
        <div className="timer-digit mb-4">{formatTime(state.timeRemaining)}</div>

        {state.currentSession > 1 && (
          <div className="text-xs text-muted-foreground mt-1 mb-4">
            Today: {todaysFocusSessions} focus sessions completed
          </div>
        )}

        <PomodoroControls
          isRunning={state.isRunning}
          isPaused={state.isPaused}
          onStart={startTimer}
          onPause={pauseTimer}
          onSkip={skipSession}
          onReset={resetTimer}
          onOpenSettings={onOpenSettings}
        />
      </CardContent>
    </Card>
  );
};

export default PomodoroTimer;
