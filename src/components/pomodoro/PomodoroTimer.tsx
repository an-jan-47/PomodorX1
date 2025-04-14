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
  const workerRef = useRef<Worker | null>(null);

  const [showCompletionEffect, setShowCompletionEffect] = useState(false);

  // State initialization remains the same
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

  // Define tick function first without dependencies
  const tick = useCallback(() => {
    const now = Date.now();
    if (!targetEndTimeRef.current) return;
    
    const remaining = Math.ceil((targetEndTimeRef.current - now) / 1000);
    if (remaining <= 0) {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      timerRef.current = null;
      targetEndTimeRef.current = null;
      // Instead of calling handleSessionComplete directly, use a state update to trigger it
      setState(prev => ({ ...prev, timeRemaining: 0, lastUpdated: new Date().toISOString() }));
      return;
    }
    setState(prev => ({ ...prev, timeRemaining: remaining, lastUpdated: new Date().toISOString() }));
    timerRef.current = requestAnimationFrame(tick);
  }, []);

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

  const handleSessionComplete = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }
    timerRef.current = null;
    targetEndTimeRef.current = null;

    playSound("complete");
    showNotification(state.currentSessionType);
    setShowCompletionEffect(true);
    setTimeout(() => setShowCompletionEffect(false), 2000);

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

    const nextState = getNextSession(state);
    setState(nextState);

    if (nextState.isRunning) {
      setTimeout(() => {
        targetEndTimeRef.current = Date.now() + nextState.timeRemaining * 1000;
        workerRef.current?.postMessage({ command: 'start', targetTime: targetEndTimeRef.current });
        if (!document.hidden) timerRef.current = requestAnimationFrame(tick);
      }, 1000);
    }
  }, [state, timerSettings, playSound, recordPomodoroSession, getNextSession, tick]);

  // Add showNotification to the dependency list
  const showNotification = useCallback((sessionType: string) => {
    if (timerSettings.desktopNotifications) {
      const title = sessionType === "focus" ? "Focus Session Complete!" : sessionType === "shortBreak" ? "Short Break Complete!" : "Long Break Complete!";
      const message = sessionType === "focus" ? "Time for a break!" : "Time to focus again!";

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body: message,
          icon: "/favicon.ico"
        });
      }

      if (timerSettings.soundEnabled) {
        const audio = new Audio("/notification.mp3");
        audio.volume = timerSettings.soundVolume / 100;
        audio.play().catch(err => console.error("Error playing sound:", err));
      }
    }
  }, [timerSettings]);

  // Watch for timer completion
  useEffect(() => {
    if (state.timeRemaining === 0 && state.isRunning && !state.isPaused) {
      handleSessionComplete();
    }
  }, [state.timeRemaining, state.isRunning, state.isPaused, handleSessionComplete]);

  // Setup worker and notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

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
                self.postMessage({ type: 'tick', remaining: remaining, timestamp: now });
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
          setState(prev => ({ ...prev, timeRemaining: 0 }));
        }
      };
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const startTimer = useCallback(() => {
    if (!state.isRunning) playSound("start");
    const now = Date.now();
    targetEndTimeRef.current = now + state.timeRemaining * 1000;
    workerRef.current?.postMessage({ command: 'start', targetTime: targetEndTimeRef.current });
    setState(prev => ({ ...prev, isRunning: true, isPaused: false, lastUpdated: new Date().toISOString() }));
    timerRef.current = requestAnimationFrame(tick);
  }, [state.isRunning, state.timeRemaining, playSound, tick]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }
    workerRef.current?.postMessage({ command: 'stop' });
    timerRef.current = null;
    targetEndTimeRef.current = null;
    setState(prev => ({ ...prev, isPaused: true, lastUpdated: new Date().toISOString() }));
    playSound("pause");
  }, [playSound]);

  const skipSession = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }
    workerRef.current?.postMessage({ command: 'stop' });
    targetEndTimeRef.current = null;
    setState(prev => getNextSession(prev));
  }, [getNextSession]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }
    workerRef.current?.postMessage({ command: 'stop' });
    targetEndTimeRef.current = null;
    setState({
      isRunning: false,
      isPaused: false,
      timeRemaining: timerSettings.focusDuration * 60,
      currentSession: 1,
      currentSessionType: "focus",
      lastUpdated: new Date().toISOString(),
    });
  }, [timerSettings]);

  // Rest of the component remains the same
  useEffect(() => {
    localStorage.setItem("pomodoroState", JSON.stringify({ ...state, lastUpdated: new Date().toISOString() }));
  }, [state]);

  const sessionTitle = state.currentSessionType === "focus" ? "Focus Session" : state.currentSessionType === "shortBreak" ? "Short Break" : "Long Break";
  const totalSeconds = state.currentSessionType === "focus" ? timerSettings.focusDuration * 60 : state.currentSessionType === "shortBreak" ? timerSettings.shortBreakDuration * 60 : timerSettings.longBreakDuration * 60;
  const progress = ((totalSeconds - state.timeRemaining) / totalSeconds) * 100;
  const todaysFocusSessions = pomodoroSessions.filter(s => new Date(s.completedAt).toDateString() === new Date().toDateString() && s.type === "focus").length;

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
