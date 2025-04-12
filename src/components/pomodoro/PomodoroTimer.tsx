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

  const showNotification = useCallback((sessionType: string) => {
    if (timerSettings.desktopNotifications && Notification.permission === "granted") {
      const title = sessionType === "focus" ? "Focus Session Complete!" : sessionType === "shortBreak" ? "Short Break Complete!" : "Long Break Complete!";
      const message = sessionType === "focus" ? "Time for a break!" : "Time to focus again!";
      const notification = new Notification(title, { body: message, icon: "/favicon.ico" });
      setTimeout(() => notification.close(), 5000);
    }
  }, [timerSettings.desktopNotifications]);

  useEffect(() => {
    if (timerSettings.desktopNotifications && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, [timerSettings.desktopNotifications]);

  useEffect(() => {
    const hasChanged =
      prevSettingsRef.current.focusDuration !== timerSettings.focusDuration ||
      prevSettingsRef.current.shortBreakDuration !== timerSettings.shortBreakDuration ||
      prevSettingsRef.current.longBreakDuration !== timerSettings.longBreakDuration ||
      prevSettingsRef.current.sessionsBeforeLongBreak !== timerSettings.sessionsBeforeLongBreak;

    if (hasChanged && (!state.isRunning || state.isPaused)) {
      let newTime = timerSettings.focusDuration * 60;
      if (state.currentSessionType === "shortBreak") newTime = timerSettings.shortBreakDuration * 60;
      else if (state.currentSessionType === "longBreak") newTime = timerSettings.longBreakDuration * 60;
      setState(prev => ({ ...prev, timeRemaining: newTime, lastUpdated: new Date().toISOString() }));
      targetEndTimeRef.current = null;
    }
    prevSettingsRef.current = timerSettings;
  }, [timerSettings, state.isRunning, state.isPaused, state.currentSessionType]);

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

  const resetTimer = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
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

  useEffect(() => {
    localStorage.setItem("pomodoroState", JSON.stringify({ ...state, lastUpdated: new Date().toISOString() }));
  }, [state]);

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

  useEffect(() => {
    if (state.timeRemaining >= 0) {
      updateFavicon(formatTime(state.timeRemaining));
    }
  }, [state.timeRemaining]);

  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      if (!targetEndTimeRef.current) targetEndTimeRef.current = Date.now() + state.timeRemaining * 1000;

      const tick = () => {
        const now = Date.now();
        const remaining = Math.ceil((targetEndTimeRef.current! - now) / 1000);

        setState(prev => {
          if (remaining <= 0) {
            cancelAnimationFrame(timerRef.current!);
            timerRef.current = null;
            targetEndTimeRef.current = null;
            playSound("complete");
            showNotification(prev.currentSessionType);
            setShowCompletionEffect(true);
            setTimeout(() => setShowCompletionEffect(false), 2000);

            const sessionDuration = prev.currentSessionType === "focus"
              ? timerSettings.focusDuration
              : prev.currentSessionType === "shortBreak"
              ? timerSettings.shortBreakDuration
              : timerSettings.longBreakDuration;

            recordPomodoroSession({
              type: prev.currentSessionType,
              duration: sessionDuration * 60,
              completedAt: new Date().toISOString(),
            });

            return getNextSession(prev);
          }

          if (prev.timeRemaining !== remaining) {
            return { ...prev, timeRemaining: remaining, lastUpdated: new Date().toISOString() };
          }
          return prev;
        });

        timerRef.current = requestAnimationFrame(tick);
      };

      timerRef.current = requestAnimationFrame(tick);

      return () => {
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
      };
    }
  }, [state.isRunning, state.isPaused, state.timeRemaining, timerSettings, recordPomodoroSession, playSound, getNextSession, showNotification]);

  const startTimer = useCallback(() => {
    if (!state.isRunning) playSound("start");
    targetEndTimeRef.current = Date.now() + state.timeRemaining * 1000;
    setState(prev => ({ ...prev, isRunning: true, isPaused: false, lastUpdated: new Date().toISOString() }));
  }, [state.isRunning, state.timeRemaining, playSound]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    timerRef.current = null;
    targetEndTimeRef.current = null;
    setState(prev => ({ ...prev, isPaused: true, lastUpdated: new Date().toISOString() }));
    playSound("pause");
  }, [playSound]);

  const skipSession = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
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
