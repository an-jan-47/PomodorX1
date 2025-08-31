
import { Button } from "@/components/ui/button";
import { 
  PlayCircle, 
  PauseCircle, 
  SkipForward, 
  RotateCcw,
  Settings 
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PomodoroControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
  className?: string;
}

const PomodoroControls = ({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onSkip,
  onReset,
  onOpenSettings,
  className,
}: PomodoroControlsProps) => {
  return (
    <TooltipProvider>
      <div className={`flex items-center justify-center gap-3 ${className || ""}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            {!isRunning || isPaused ? (
              <Button
                onClick={isPaused ? onResume : onStart}
                size="icon"
                className="w-12 h-12 rounded-full"
                variant="default"
                aria-label={isPaused ? "Resume timer" : "Start timer"}
              >
                <PlayCircle className="h-6 w-6" />
                <span className="sr-only">{isPaused ? "Resume" : "Start"}</span>
              </Button>
            ) : (
              <Button
                onClick={onPause}
                size="icon"
                className="w-12 h-12 rounded-full"
                variant="default"
                aria-label="Pause timer"
              >
                <PauseCircle className="h-6 w-6" />
                <span className="sr-only">Pause</span>
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent>
            {!isRunning || isPaused ? "Start timer" : "Pause timer"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onSkip}
              size="icon"
              variant="outline"
              className="w-10 h-10 rounded-full"
              aria-label="Skip to next session"
            >
              <SkipForward className="h-5 w-5" />
              <span className="sr-only">Skip</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Skip to next session</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onReset}
              size="icon"
              variant="outline"
              className="w-10 h-10 rounded-full"
              aria-label="Reset timer"
            >
              <RotateCcw className="h-5 w-5" />
              <span className="sr-only">Reset</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset timer</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onOpenSettings}
              size="icon"
              variant="outline"
              className="w-10 h-10 rounded-full"
              aria-label="Open settings"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default PomodoroControls;
