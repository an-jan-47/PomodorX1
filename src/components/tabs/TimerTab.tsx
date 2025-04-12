
import { useState, useEffect } from "react";
import CountdownTimer from "@/components/timer/CountdownTimer";
import Stopwatch from "@/components/timer/Stopwatch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TimerTab = () => {
  const [countdownCompletions, setCountdownCompletions] = useState(0);
  const [stopwatchUsage, setStopwatchUsage] = useState(0);
  const [longestTimerDuration, setLongestTimerDuration] = useState(0);
  
  const handleCountdownComplete = (duration: number) => {
    setCountdownCompletions(prev => prev + 1);
    setLongestTimerDuration(prev => Math.max(prev, duration));
  };
  
  const handleStopwatchUsed = (duration: number) => {
    setStopwatchUsage(prev => prev + 1);
    setLongestTimerDuration(prev => Math.max(prev, duration));
  };

  // Format the longest timer duration with hours, minutes, seconds
  const formatLongestTime = () => {
    const hours = Math.floor(longestTimerDuration / 3600);
    const minutes = Math.floor((longestTimerDuration % 3600) / 60);
    const seconds = longestTimerDuration % 60;
    
    const parts = [];
    
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    
    parts.push(`${minutes}m`);
    
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds}s`);
    }
    
    return parts.join(" ");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold">Timers</h2>
      
      <Tabs defaultValue="countdown" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="countdown" className="transition-all duration-300 hover:bg-secondary/80">Countdown</TabsTrigger>
          <TabsTrigger value="stopwatch" className="transition-all duration-300 hover:bg-secondary/80">Stopwatch</TabsTrigger>
        </TabsList>
        <TabsContent value="countdown" className="animate-slide-in transition-all duration-500 ease-in-out">
          <CountdownTimer onComplete={handleCountdownComplete} />
        </TabsContent>
        <TabsContent value="stopwatch" className="animate-slide-in transition-all duration-500 ease-in-out">
          <Stopwatch onStop={handleStopwatchUsed} />
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="stats-card animate-fade-in transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Countdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{countdownCompletions}</p>
            <p className="text-sm text-muted-foreground">Timers completed</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card animate-fade-in transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Stopwatch</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stopwatchUsage}</p>
            <p className="text-sm text-muted-foreground">Times used</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card animate-fade-in transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Longest</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatLongestTime()}</p>
            <p className="text-sm text-muted-foreground">Longest timer duration</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimerTab;
