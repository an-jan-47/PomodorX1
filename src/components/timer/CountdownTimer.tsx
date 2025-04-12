
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTime } from "@/lib/utils";
import { PlayCircle, PauseCircle, RotateCcw } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface CountdownTimerProps {
  onComplete?: (duration: number) => void;
}

const CountdownTimer = ({ onComplete }: CountdownTimerProps) => {
  const [timeInput, setTimeInput] = useState("5");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [initialDuration, setInitialDuration] = useState(0);
  const timerRef = useRef<number>();
  const lastTimeRef = useRef<number>(Date.now());
  const { playSound } = useApp();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Setup interval timer that works even when tab is not active
  useEffect(() => {
    if (isRunning && !isPaused) {
      lastTimeRef.current = Date.now();
      
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastTimeRef.current) / 1000);
        lastTimeRef.current = now;
        
        if (elapsed > 0) {
          setTimeRemaining((prevTime) => {
            const newTime = Math.max(0, prevTime - elapsed);
            
            if (newTime === 0 && prevTime > 0) {
              // Timer completed
              clearInterval(timerRef.current);
              setIsRunning(false);
              playSound("complete");
              if (onComplete) {
                onComplete(initialDuration);
              }
            }
            
            return newTime;
          });
        }
      }, 1000);
      
      return () => {
        clearInterval(timerRef.current);
      };
    }
  }, [isRunning, isPaused, onComplete, initialDuration, playSound]);

  const startTimer = () => {
    // If already running, do nothing
    if (isRunning && !isPaused) return;

    // If no time is set, set a default
    if (timeRemaining <= 0) {
      const mins = parseInt(timeInput) || 5;
      const seconds = mins * 60;
      setTimeRemaining(seconds);
      setInitialDuration(seconds);
    }

    setIsRunning(true);
    setIsPaused(false);
    playSound("start");
    lastTimeRef.current = Date.now();
  };

  const pauseTimer = () => {
    if (!isRunning || isPaused) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsPaused(true);
    playSound("pause");
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRunning(false);
    setIsPaused(false);
    const duration = parseInt(timeInput) * 60 || 0;
    setTimeRemaining(duration);
    setInitialDuration(duration);
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeInput(value);
    if (!isRunning) {
      const duration = parseInt(value) * 60 || 0;
      setTimeRemaining(duration);
      setInitialDuration(duration);
    }
  };

  return (
    <Card className="timer-card transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-center">Countdown Timer</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6">
        {!isRunning && !isPaused ? (
          <div className="w-full max-w-xs animate-fade-in">
            <Input
              type="number"
              min="1"
              value={timeInput}
              onChange={handleTimeInputChange}
              placeholder="Minutes"
              className="text-center text-xl"
            />
          </div>
        ) : (
          <div className="timer-digit text-center animate-fade-in">
            {formatTime(timeRemaining)}
          </div>
        )}

        <div className="flex items-center justify-center space-x-4">
          {!isRunning || isPaused ? (
            <Button
              onClick={startTimer}
              size="icon"
              className="w-12 h-12 rounded-full transition-transform duration-200 hover:scale-105"
              variant="default"
            >
              <PlayCircle className="h-6 w-6" />
              <span className="sr-only">Start</span>
            </Button>
          ) : (
            <Button
              onClick={pauseTimer}
              size="icon"
              className="w-12 h-12 rounded-full transition-transform duration-200 hover:scale-105"
              variant="default"
            >
              <PauseCircle className="h-6 w-6" />
              <span className="sr-only">Pause</span>
            </Button>
          )}

          <Button
            onClick={resetTimer}
            size="icon"
            variant="outline"
            className="w-10 h-10 rounded-full transition-transform duration-200 hover:scale-105"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="sr-only">Reset</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountdownTimer;

