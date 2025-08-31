
import { useState } from "react";
import PomodoroTimer from "@/components/pomodoro/PomodoroTimer";
import PomodoroSettings from "@/components/pomodoro/PomodoroSettings";
import { CustomSoundsDialog } from "@/components/pomodoro/CustomSoundsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { Minimize2 } from "lucide-react";

const PomodoroTab = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { pomodoroSessions, setIsMinimized } = useApp();
  
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-black-100 dark:hover:bg-blue-800 h-8 w-50 p-2"
            onClick={() => setIsMinimized(true)}
            title="Minimize to overlay"
          >
            <h2 className="text-l font-semibold"> Minimize</h2>
            <Minimize2 className="h-4 w-4" />
          </Button>
          
        </div>
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
            <p className="text-3xl font-bold">{Math.round(totalFocusTime / 60)} mins </p>
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
