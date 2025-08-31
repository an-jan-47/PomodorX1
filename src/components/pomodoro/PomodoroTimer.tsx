import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/hooks/useApp";
import { Card, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import { TimerState } from "@/lib/types";
import PomodoroControls from "./PomodoroControls";
import PomodoroProgress from "./PomodoroProgress";
import MinimizedWindow from "./MinimizedWindow";
import { CustomSoundsDialog } from "./CustomSoundsDialog";

interface PomodoroTimerProps {
  onOpenSettings: () => void;
}

const PomodoroTimer = ({ onOpenSettings }: PomodoroTimerProps) => {
  const { timerSettings, recordPomodoroSession, playSound, pomodoroSessions } = useApp();

  const timerRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isYoutubeMuted, setIsYoutubeMuted] = useState(false);
  const [showYoutubePlayer, setShowYoutubePlayer] = useState(false);

  // State initialization with robust validation
  const [state, setState] = useState<TimerState>(() => {
    const saved = localStorage.getItem('pomodoroState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedDate = new Date(parsed.lastUpdated).toDateString();
        const now = new Date().toDateString();
        if (savedDate === now && parsed.timeRemaining && !isNaN(parsed.timeRemaining)) {
          if (parsed.isRunning && !parsed.isPaused) {
            const elapsed = Math.floor((Date.now() - new Date(parsed.lastUpdated).getTime()) / 1000);
            const newTimeRemaining = Math.max(0, parsed.timeRemaining - elapsed);
            parsed.timeRemaining = isNaN(newTimeRemaining) ? timerSettings.focusDuration * 60 : newTimeRemaining;
          }
          // Validate all numeric values
          parsed.timeRemaining = isNaN(parsed.timeRemaining) ? timerSettings.focusDuration * 60 : parsed.timeRemaining;
          parsed.currentSession = isNaN(parsed.currentSession) ? 1 : parsed.currentSession;
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

  // Helper function to get total time for current session type
  const getTotalTime = useCallback((sessionType: string) => {
    switch (sessionType) {
      case "focus":
        return timerSettings.focusDuration * 60;
      case "shortBreak":
        return timerSettings.shortBreakDuration * 60;
      case "longBreak":
        return timerSettings.longBreakDuration * 60;
      default:
        return timerSettings.focusDuration * 60;
    }
  }, [timerSettings]);

  // YouTube music player functions
  const extractVideoId = useCallback((url: string): string | null => {
    try {
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
      return videoIdMatch ? videoIdMatch[1] : null;
    } catch {
      return null;
    }
  }, []);

  const handleYoutubeUrl = useCallback((url: string) => {
    if (!url.trim()) return;
    
    const videoId = extractVideoId(url);
    if (videoId) {
      setYoutubeVideoId(videoId);
      setShowYoutubePlayer(true);
    } else {
      alert("Please enter a valid YouTube URL");
    }
  }, [extractVideoId]);

  const toggleYoutubeSound = useCallback(() => {
    setIsYoutubeMuted(!isYoutubeMuted);
  }, [isYoutubeMuted]);

  const removeYoutubePlayer = useCallback(() => {
    setYoutubeVideoId(null);
    setShowYoutubePlayer(false);
  }, []);

  // Show notification function
  const showNotification = useCallback((sessionType: string) => {
    if (timerSettings.desktopNotifications) {
      const title = sessionType === "focus" ? "Focus Session Complete!" : 
                   sessionType === "shortBreak" ? "Short Break Complete!" : 
                   "Long Break Complete!";
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

  // Get next session configuration
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

  // Robust timer tick function with NaN protection
  const tick = useCallback(() => {
    const now = Date.now();
    if (!targetEndTimeRef.current || isNaN(targetEndTimeRef.current)) {
      console.warn('Invalid target end time, stopping timer');
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      timerRef.current = null;
      targetEndTimeRef.current = null;
      return;
    }
    
    const remaining = Math.ceil((targetEndTimeRef.current - now) / 1000);
    
    // Validate remaining time
    if (isNaN(remaining) || remaining <= 0) {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      timerRef.current = null;
      targetEndTimeRef.current = null;
      setState(prev => ({ ...prev, timeRemaining: 0, lastUpdated: new Date().toISOString() }));
      return;
    }
    
    // Ensure remaining is a valid positive number
    const validRemaining = Math.max(0, remaining);
    setState(prev => ({ 
      ...prev, 
      timeRemaining: validRemaining, 
      lastUpdated: new Date().toISOString() 
    }));
    timerRef.current = requestAnimationFrame(tick);
  }, []);

  // Handle session completion
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
  }, [state, timerSettings, playSound, recordPomodoroSession, getNextSession, tick, showNotification]);

  // Robust timer control functions with validation
  const startTimer = useCallback(() => {
    // Validate timer state before starting
    if (isNaN(state.timeRemaining) || state.timeRemaining <= 0) {
      console.warn('Invalid time remaining, resetting timer');
      const duration = getTotalTime(state.currentSessionType);
      setState(prev => ({ 
        ...prev, 
        timeRemaining: duration,
        lastUpdated: new Date().toISOString() 
      }));
      return;
    }

    if (!state.isRunning) playSound("start");
    const now = Date.now();
    const targetTime = now + state.timeRemaining * 1000;
    
    // Validate target time
    if (isNaN(targetTime) || !isFinite(targetTime)) {
      console.error('Invalid target time calculated');
      return;
    }
    
    targetEndTimeRef.current = targetTime;
    workerRef.current?.postMessage({ command: 'start', targetTime: targetEndTimeRef.current });
    setState(prev => ({ 
      ...prev, 
      isRunning: true, 
      isPaused: false, 
      lastUpdated: new Date().toISOString() 
    }));
    timerRef.current = requestAnimationFrame(tick);
  }, [state.isRunning, state.timeRemaining, state.currentSessionType, playSound, tick, getTotalTime]);

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

  // Handler functions for controls
  const handleStart = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const handlePause = useCallback(() => {
    pauseTimer();
  }, [pauseTimer]);

  const handleResume = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const handleReset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleSkip = useCallback(() => {
    skipSession();
  }, [skipSession]);

  // Enhanced state persistence with validation
  useEffect(() => {
    try {
      // Validate state before saving
      const stateToSave = {
        ...state,
        timeRemaining: isNaN(state.timeRemaining) ? timerSettings.focusDuration * 60 : state.timeRemaining,
        currentSession: isNaN(state.currentSession) ? 1 : state.currentSession,
      };
      localStorage.setItem('pomodoroState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save pomodoro state:', error);
    }
  }, [state, timerSettings.focusDuration]);

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
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      targetEndTimeRef.current = null;
    };
  }, []);

  // Resume timer if it should be running
  useEffect(() => {
    if (state.isRunning && !state.isPaused && state.timeRemaining > 0) {
      if (!timerRef.current) {
        const lastUpdated = new Date(state.lastUpdated).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - lastUpdated) / 1000);
        const adjustedTimeRemaining = Math.max(0, state.timeRemaining - elapsed);
        
        if (adjustedTimeRemaining > 0) {
          targetEndTimeRef.current = now + adjustedTimeRemaining * 1000;
          setState(prev => ({
            ...prev,
            timeRemaining: adjustedTimeRemaining,
            lastUpdated: new Date().toISOString(),
          }));
          workerRef.current?.postMessage({ command: 'start', targetTime: targetEndTimeRef.current });
          timerRef.current = requestAnimationFrame(tick);
        } else {
          setState(prev => ({ ...prev, timeRemaining: 0 }));
        }
      }
    }

    if ((!state.isRunning || state.isPaused || state.timeRemaining === 0) && timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
      workerRef.current?.postMessage({ command: 'stop' });
      targetEndTimeRef.current = null;
    }
  }, [state.isRunning, state.isPaused, state.timeRemaining, state.lastUpdated, tick]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem("pomodoroState", JSON.stringify({ 
      ...state, 
      lastUpdated: new Date().toISOString() 
    }));
  }, [state]);

  // Calculate display values
  const sessionTitle = state.currentSessionType === "focus" ? "Focus Session" : 
                      state.currentSessionType === "shortBreak" ? "Short Break" : 
                      "Long Break";
  
  const totalSeconds = getTotalTime(state.currentSessionType);
  const progress = ((totalSeconds - state.timeRemaining) / totalSeconds) * 100;
  
  const todaysFocusSessions = pomodoroSessions.filter(s => 
    new Date(s.completedAt).toDateString() === new Date().toDateString() && 
    s.type === "focus"
  ).length;

  return (
    <>
      {/* Minimized Window Handler */}
      <MinimizedWindow 
        timeRemaining={state.timeRemaining}
        currentSessionType={state.currentSessionType}
        isRunning={state.isRunning}
      />
      
      <div className="space-y-4">
        {/* Main Timer Card */}
        <Card className="timer-card relative overflow-hidden border-none bg-black/30 backdrop-blur-md shadow-xl">
          <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center">
            {/* Compact YouTube Music Player */}
            {showYoutubePlayer && youtubeVideoId && (
              <div className="w-full mb-4 p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-primary flex items-center gap-2">
                    🎵 Focus Music
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleYoutubeSound}
                      className="px-2 py-1 rounded text-xs bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      {isYoutubeMuted ? '🔇' : '🔊'}
                    </button>
                    <button
                      onClick={removeYoutubePlayer}
                      className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      ❌
                    </button>
                  </div>
                </div>
                
                <div className="relative w-full pt-[25%] max-w-md mx-auto rounded overflow-hidden bg-black">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&loop=1&playlist=${youtubeVideoId}&controls=1&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1${isYoutubeMuted ? '&mute=1' : ''}`}
                    title="YouTube Music Player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Timer Display */}
            <div className="relative w-full max-w-xs mx-auto mb-4 md:mb-6">
              <div className="text-center">
                <h2 className="text-lg md:text-xl font-medium mb-1 md:mb-2 text-primary">
                  {state.currentSessionType === "focus" ? "Focus Time" :
                   state.currentSessionType === "shortBreak" ? "Short Break" : "Long Break"}
                </h2>
                <div className="text-4xl md:text-6xl font-bold mb-2 md:mb-4 tabular-nums">
                  {formatTime(state.timeRemaining)}
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Session {state.currentSession} {state.currentSessionType !== "focus" && "- Break"}
                </p>
              </div>
            </div>
            
            {/* Progress Circle */}
            <PomodoroProgress 
              timeRemaining={state.timeRemaining} 
              totalTime={getTotalTime(state.currentSessionType)}
              type={state.currentSessionType}
              className="mb-4 md:mb-6"
            />
            
            {/* Controls */}
            <PomodoroControls 
              isRunning={state.isRunning}
              isPaused={state.isPaused}
              onStart={handleStart}
              onPause={handlePause}
              onResume={handleResume}
              onReset={handleReset}
              onSkip={handleSkip}
              onOpenSettings={onOpenSettings}
              className="w-full max-w-xs mx-auto flex-wrap justify-center gap-2"
            />
            
            {/* Music Controls */}
            <div className="mt-4 flex items-center gap-2">
              <CustomSoundsDialog onYoutubeUrl={handleYoutubeUrl} />
            </div>
            
            {/* Completion Effect */}
            {showCompletionEffect && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center animate-pulse-light">
                <div className="text-2xl md:text-3xl font-bold text-white">
                  {state.currentSessionType === "focus" ? "Focus Complete!" : "Break Complete!"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PomodoroTimer;
