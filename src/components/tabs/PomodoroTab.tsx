
import { useState } from "react";
import PomodoroTimer from "@/components/pomodoro/PomodoroTimer";
import PomodoroSettings from "@/components/pomodoro/PomodoroSettings";
import { CustomSoundsDialog } from "@/components/pomodoro/CustomSoundsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";

const PomodoroTab = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { pomodoroSessions } = useApp();
  
  // Calculate some basic stats for this section
  const totalSessions = pomodoroSessions.length;
  const focusSessions = pomodoroSessions.filter(s => s.type === "focus").length;
  const totalFocusTime = pomodoroSessions
    .filter(s => s.type === "focus")
    .reduce((total, session) => total + session.duration, 0);
  
  // Get today's sessions
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = pomodoroSessions.filter(s => 
    s.completedAt.split('T')[0] === today
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Pomodoro Timer</h2>
        <div className="flex gap-2">
          <CustomSoundsDialog />
        </div>
      </div>
      
      <PomodoroTimer onOpenSettings={() => setSettingsOpen(true)} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="stats-card animate-fade-in transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todaySessions}</p>
            <p className="text-sm text-muted-foreground">Sessions completed</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card animate-fade-in transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Focus Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Math.round(totalFocusTime / 60)} hrs</p>
            <p className="text-sm text-muted-foreground">Total focus time</p>
          </CardContent>
        </Card>
        
        <Card className="stats-card animate-fade-in transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">All Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{focusSessions}</p>
            <p className="text-sm text-muted-foreground">Focus sessions completed</p>
          </CardContent>
        </Card>
      </div>
      
      <PomodoroSettings 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </div>
  );
};

export default PomodoroTab;
