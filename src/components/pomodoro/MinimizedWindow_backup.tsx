import React, { useState, useCallback, useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Play, Pause, Square, X, Monitor } from "lucide-react";

interface MinimizedWindowProps {
  isMinimized: boolean;
  timeRemaining: number;
  currentSessionType: "focus" | "shortBreak" | "longBreak";
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  setTimeRemaining: (time: number) => void;
  timerSettings: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
  };
  handleSessionComplete: () => void;
}

const MinimizedWindow: React.FC<MinimizedWindowProps> = ({
  isMinimized,
  timeRemaining,
  currentSessionType,
  isRunning,
  setIsRunning,
  setTimeRemaining,
  timerSettings,
  handleSessionComplete,
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [persistentMode, setPersistentMode] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const popupWindowRef = useRef<Window | null>(null);
  const notificationRef = useRef<Notification | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Calculate progress
  const getProgress = useCallback(() => {
    const totalDuration = currentSessionType === "focus"
      ? timerSettings.focusDuration * 60
      : timerSettings.shortBreakDuration * 60;
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
  }, [currentSessionType, timerSettings.focusDuration, timerSettings.shortBreakDuration, timeRemaining]);

  // Create persistent popup window when browser is minimized
  const createPersistentPopup = useCallback(() => {
    if (popupWindowRef.current && !popupWindowRef.current.closed) {
      return; // Already exists
    }

    const popupFeatures = [
      'width=320',
      'height=200',
      'top=50',
      'left=50',
      'toolbar=no',
      'menubar=no',
      'scrollbars=no',
      'resizable=yes',
      'status=no',
      'directories=no',
      'location=no',
      'alwaysOnTop=yes',
      'titlebar=no'
    ].join(',');

    const popupHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PomodoroX Timer</title>
        <style>
          body {
            margin: 0;
            padding: 16px;
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
          }
          .timer-display {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 12px;
            font-family: 'Courier New', monospace;
          }
          .session-type {
            font-size: 14px;
            margin-bottom: 16px;
            opacity: 0.9;
          }
          .controls {
            display: flex;
            gap: 8px;
            margin-top: 16px;
          }
          button {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            background: rgba(255,255,255,0.2);
            color: white;
            cursor: pointer;
            font-size: 12px;
          }
          button:hover {
            background: rgba(255,255,255,0.3);
          }
          .progress-bar {
            width: 100%;
            height: 4px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
            overflow: hidden;
            margin: 16px 0;
          }
          .progress-fill {
            height: 100%;
            background: white;
            transition: width 0.3s ease;
          }
        </style>
      </head>
      <body>
        <div class="timer-display" id="timer">${formatTime(timeRemaining)}</div>
        <div class="session-type" id="sessionType">${currentSessionType === 'focus' ? 'Focus Time' : 'Break Time'}</div>
        <div class="progress-bar">
          <div class="progress-fill" id="progress" style="width: ${getProgress()}%"></div>
        </div>
        <div class="controls">
          <button onclick="toggleTimer()">${isRunning ? 'Pause' : 'Play'}</button>
          <button onclick="stopTimer()">Stop</button>
          <button onclick="window.close()">Close</button>
        </div>

        <script>
          let timerInterval;
          let timeLeft = ${timeRemaining};
          let isRunning = ${isRunning};
          let sessionType = '${currentSessionType}';
          const focusDuration = ${timerSettings.focusDuration * 60};
          const breakDuration = ${timerSettings.shortBreakDuration * 60};

          function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
          }

          function getProgress() {
            const totalDuration = sessionType === 'focus' ? focusDuration : breakDuration;
            return ((totalDuration - timeLeft) / totalDuration) * 100;
          }

          function updateDisplay() {
            document.getElementById('timer').textContent = formatTime(timeLeft);
            document.getElementById('progress').style.width = getProgress() + '%';
          }

          function toggleTimer() {
            isRunning = !isRunning;
            if (isRunning && timeLeft > 0) {
              timerInterval = setInterval(() => {
                timeLeft--;
                updateDisplay();
                if (timeLeft <= 0) {
                  clearInterval(timerInterval);
                  alert('Session completed!');
                }
              }, 1000);
            } else {
              clearInterval(timerInterval);
            }
            document.querySelector('button').textContent = isRunning ? 'Pause' : 'Play';
          }

          function stopTimer() {
            isRunning = false;
            clearInterval(timerInterval);
            timeLeft = sessionType === 'focus' ? focusDuration : breakDuration;    
            updateDisplay();
            document.querySelector('button').textContent = 'Play';
          }

          // Keep window always on top
          if (window.focus) {
            window.focus();
          }

          // Try to make window always on top
          setInterval(() => {
            if (window.focus && !document.hidden) {
              window.focus();
            }
          }, 1000);
        </script>
      </body>
      </html>
    `;

    try {
      popupWindowRef.current = window.open('', 'pomodoroTimer', popupFeatures);
      if (popupWindowRef.current) {
        popupWindowRef.current.document.write(popupHTML);
        popupWindowRef.current.document.close();
        setPersistentMode(true);
      }
    } catch (error) {
      console.error('Failed to create popup window:', error);
    }
  }, [timeRemaining, isRunning, currentSessionType, timerSettings, formatTime, getProgress]);

  // Create persistent notifications
  const createPersistentNotification = useCallback(() => {
    if (!notificationPermission) return;

    if (notificationRef.current) {
      notificationRef.current.close();
    }

    notificationRef.current = new Notification('PomodoroX Timer', {
      body: `${formatTime(timeRemaining)} - ${currentSessionType === 'focus' ? 'Focus Time' : 'Break Time'} ${isRunning ? '(Running)' : '(Paused)'}`,
      icon: '/favicon.ico',
      tag: 'pomodoro-timer',
      requireInteraction: true,
      silent: true
    });

    notificationRef.current.onclick = () => {
      window.focus();
      notificationRef.current?.close();
    };
  }, [timeRemaining, currentSessionType, isRunning, notificationPermission, formatTime]);

  // Monitor browser visibility and create persistent overlays
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isMinimized) {
        // Browser is minimized/hidden - activate persistent mode
        createPersistentPopup();
        createPersistentNotification();
      } else if (!document.hidden && persistentMode) {
        // Browser is visible - close persistent overlays
        if (popupWindowRef.current && !popupWindowRef.current.closed) {
          popupWindowRef.current.close();
        }
        if (notificationRef.current) {
          notificationRef.current.close();
        }
        setPersistentMode(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMinimized, persistentMode, createPersistentPopup, createPersistentNotification]);

  // Update persistent overlays when timer state changes
  useEffect(() => {
    if (persistentMode) {
      createPersistentNotification();
    }
  }, [timeRemaining, isRunning, currentSessionType, persistentMode, createPersistentNotification]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timeRemaining, handleSessionComplete]);

  // Auto-hide logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isVisible && !isDragging) {
      timeout = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isVisible, isDragging]);

  // Play/Pause handler
  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  // Stop handler
  const handleStop = () => {
    setIsRunning(false);
    setTimeRemaining(
      currentSessionType === "focus"
        ? timerSettings.focusDuration * 60
        : timerSettings.shortBreakDuration * 60
    );
  };

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setIsVisible(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isMinimized) return null;

  return (
    <div
      className={`fixed z-[9999] transition-all duration-300 select-none ${
        isVisible ? "opacity-100" : "opacity-30 hover:opacity-100"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? "scale(1.05)" : "scale(1)",
      }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => !isDragging && setIsVisible(false)}
    >
      <Card className="w-64 shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
        {/* Header with drag handle */}
        <div
          className="flex items-center justify-between p-2 bg-primary/10 cursor-move rounded-t-lg"
          onMouseDown={handleMouseDown}
        >
          <div className="text-xs font-medium text-primary">
            PomodoroX
            {persistentMode && (
              <span className="ml-2 px-1 py-0.5 bg-green-500/20 text-green-600 rounded text-[10px]">
                Persistent
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-6 w-6 p-0 hover:bg-red-500/10 hover:text-red-600"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Timer content */}
        <div className="p-4 space-y-3">
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-foreground">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {currentSessionType === "focus" ? "Focus Time" : "Break Time"}
            </div>
          </div>

          <Progress 
            value={getProgress()} 
            className="h-2" 
          />

          {/* Controls */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              className="h-8 hover:bg-green-500/10 hover:text-green-600"
            >
              {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              className="h-8 hover:bg-red-500/10 hover:text-red-600"
            >
              <Square className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={createPersistentPopup}
              className="h-8 hover:bg-blue-500/10 hover:text-blue-600"
              title="Create persistent popup window"
            >
              <Monitor className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground">
            💡 Click Monitor icon to test persistent popup mode
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MinimizedWindow;
