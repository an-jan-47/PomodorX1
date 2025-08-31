import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Maximize2, X, GripVertical } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MinimizedWindow = () => {
  const { isMinimized, setIsMinimized, timerSettings } = useApp();
  const [timeRemaining, setTimeRemaining] = useState(timerSettings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionType, setCurrentSessionType] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [position, setPosition] = useState({ x: 20, y: 20 }); // Start in top-left for better visibility
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  // Handle window resize and maintain position within bounds
  const adjustPosition = useCallback(() => {
    setPosition(prev => ({
      x: Math.max(0, Math.min(window.innerWidth - 320, prev.x)),
      y: Math.max(0, Math.min(window.innerHeight - 200, prev.y))
    }));
  }, []);

  // Handle page visibility changes to ensure overlay persists
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Keep overlay visible even when page is hidden
      if (isMinimized) {
        setIsVisible(true);
      }
    };

    const handleWindowResize = () => {
      adjustPosition();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleWindowResize);
    
    // Also listen for window focus/blur to maintain overlay
    const handleWindowBlur = () => {
      if (isMinimized) setIsVisible(true);
    };
    
    const handleWindowFocus = () => {
      if (isMinimized) setIsVisible(true);
    };

    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isMinimized, adjustPosition]);

  const handleSessionComplete = useCallback(() => {
    // Play completion sound
    const audio = new Audio("/sounds/notification.mp3");
    audio.play().catch(() => {});
    
    // Switch to next session type
    if (currentSessionType === "focus") {
      setCurrentSessionType("shortBreak");
      setTimeRemaining(timerSettings.shortBreakDuration * 60);
    } else {
      setCurrentSessionType("focus");
      setTimeRemaining(timerSettings.focusDuration * 60);
    }
  }, [currentSessionType, timerSettings]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsRunning(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, handleSessionComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getSessionDuration = () => {
    switch (currentSessionType) {
      case "focus": return timerSettings.focusDuration * 60;
      case "shortBreak": return timerSettings.shortBreakDuration * 60;
      case "longBreak": return timerSettings.longBreakDuration * 60;
      default: return timerSettings.focusDuration * 60;
    }
  };

  const getProgress = () => {
    const total = getSessionDuration();
    return ((total - timeRemaining) / total) * 100;
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
    const audio = new Audio(isRunning ? "/sounds/pause.mp3" : "/sounds/start.mp3");
    audio.play().catch(() => {});
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeRemaining(getSessionDuration());
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isMinimized || !isVisible) return null;

  return (
    <>
      {/* Backdrop to ensure overlay is always visible */}
      <div className="minimized-overlay-backdrop" />
      
      <div
        className="minimized-overlay overlay-transition overlay-hover draggable bg-background/95 backdrop-blur-sm border-2 border-primary/20 rounded-lg shadow-2xl"
        style={{
          left: position.x,
          top: position.y,
          width: "320px",
          userSelect: "none",
        }}
      >
        <Card className="border-0 shadow-none bg-transparent">
          {/* Header */}
          <div
            className="flex items-center justify-between p-3 bg-primary/10 border-b border-primary/20 cursor-move rounded-t-lg hover:bg-primary/15 transition-colors"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
              <span className="text-sm font-medium">
                {currentSessionType === "focus" ? "Focus Time" : "Break Time"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary/20"
                onClick={() => setIsMinimized(false)}
                title="Restore window"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                onClick={() => setIsMinimized(false)}
                title="Close overlay"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Timer Content */}
          <div className="p-4 space-y-3 bg-background/80 rounded-b-lg">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-primary">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {currentSessionType === "focus" ? "Stay focused!" : "Take a break!"}
              </div>
            </div>

            <Progress 
              value={getProgress()} 
              className="h-2"
              style={{
                backgroundColor: "hsl(var(--muted))",
              }}
            />

            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="h-8 hover:bg-primary/10"
                title={isRunning ? "Pause timer" : "Start timer"}
              >
                {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                className="h-8 hover:bg-destructive/10 hover:text-destructive"
                title="Stop timer"
              >
                <Square className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default MinimizedWindow;
