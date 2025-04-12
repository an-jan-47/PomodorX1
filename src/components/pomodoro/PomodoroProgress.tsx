
import { Progress } from "@/components/ui/progress";

interface PomodoroProgressProps {
  progress: number;
  currentSession: number;
  sessionsBeforeLongBreak: number;
  currentSessionType: "focus" | "shortBreak" | "longBreak";
}

const PomodoroProgress = ({
  progress,
  currentSession,
  sessionsBeforeLongBreak,
  currentSessionType,
}: PomodoroProgressProps) => {
  // Generate the session indicators
  const sessionIndicators = Array.from(
    { length: sessionsBeforeLongBreak },
    (_, i) => i + 1
  );

  // Determine the color based on session type
  const getProgressColor = () => {
    switch (currentSessionType) {
      case "focus":
        return "bg-primary";
      case "shortBreak":
        return "bg-accent";
      case "longBreak":
        return "bg-accent/70";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <div className="flex space-x-1">
          {sessionIndicators.map((session) => (
            <div
              key={session}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                session < currentSession
                  ? "bg-primary/80"
                  : session === currentSession
                  ? currentSessionType === "focus"
                    ? "bg-primary animate-pulse-light"
                    : "bg-accent animate-pulse-light"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Session {currentSession}
        </div>
      </div>
      <Progress
        value={progress}
        className="h-2"
        indicatorClassName={getProgressColor()}
      />
    </div>
  );
};

export default PomodoroProgress;
