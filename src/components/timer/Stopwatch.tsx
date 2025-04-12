
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, RotateCcw } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

interface StopwatchProps {
  onStop?: (duration: number) => void;
}

const Stopwatch = ({ onStop }: StopwatchProps) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
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
    if (isRunning) {
      lastTimeRef.current = Date.now();
      
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastTimeRef.current) / 1000);
        lastTimeRef.current = now;
        
        if (elapsed > 0) {
          setTime(prevTime => prevTime + elapsed);
        }
      }, 1000);
      
      return () => {
        clearInterval(timerRef.current);
      };
    }
  }, [isRunning]);

  const startTimer = () => {
    if (isRunning) return;

    setIsRunning(true);
    playSound("start");
    lastTimeRef.current = Date.now();
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRunning(false);
    playSound("pause");
    
    if (onStop && time > 0) {
      onStop(time);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRunning(false);
    
    if (time > 0) {
      if (onStop) {
        onStop(time);
      }
      setTime(0);
    }
  };

  // Format time into HH:MM:SS
  const formatStopwatchTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    
    if (hrs > 0) {
      parts.push(hrs.toString().padStart(2, "0"));
    }
    
    parts.push(mins.toString().padStart(2, "0"));
    parts.push(secs.toString().padStart(2, "0"));
    
    return parts.join(":");
  };

  return (
    <Card className="timer-card transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-center">Stopwatch</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6">
        <div className="timer-digit text-center animate-fade-in">
          {formatStopwatchTime(time)}
        </div>

        <div className="flex items-center justify-center space-x-4">
          {!isRunning ? (
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

export default Stopwatch;

