
import { Progress } from "@/components/ui/progress";

interface PomodoroProgressProps {
  timeRemaining: number;
  totalTime: number;
  type: "focus" | "shortBreak" | "longBreak";
  className?: string;
}

const PomodoroProgress = ({
  timeRemaining,
  totalTime,
  type,
  className,
}: PomodoroProgressProps) => {
  // Calculate progress percentage
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;
  
  // Determine the color based on session type
  const getProgressColor = () => {
    switch (type) {
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
    <div className={`w-full ${className || ''}`}>
      <Progress
        value={progress}
        className="h-2"
        indicatorClassName={getProgressColor()}
      />
    </div>
  );
};

export default PomodoroProgress;
