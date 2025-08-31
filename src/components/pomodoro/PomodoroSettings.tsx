
import { useState, useEffect } from "react";
import { useApp } from "@/hooks/useApp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { TimerSettings } from "@/lib/types";

interface PomodoroSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PomodoroSettings = ({ open, onOpenChange }: PomodoroSettingsProps) => {
  const { timerSettings, updateTimerSettings } = useApp();
  const [settings, setSettings] = useState<TimerSettings>(timerSettings);

  // Reset settings when dialog opens
  useEffect(() => {
    if (open) {
      setSettings(timerSettings);
    }
  }, [timerSettings, open]);

  // Handle input changes with proper type checking
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof TimerSettings
  ) => {
    const value =
      typeof settings[field] === "boolean"
        ? e.target.checked
        : Math.max(1, parseInt(e.target.value) || 1);
    
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure all required fields have valid values
    const validatedSettings = {
      ...settings,
      focusDuration: Math.max(1, Math.min(60, settings.focusDuration || 25)),
      shortBreakDuration: Math.max(1, Math.min(30, settings.shortBreakDuration || 5)),
      longBreakDuration: Math.max(5, Math.min(60, settings.longBreakDuration || 15)),
      sessionsBeforeLongBreak: Math.max(1, Math.min(10, settings.sessionsBeforeLongBreak || 4)),
      soundVolume: settings.soundEnabled ? (settings.soundVolume || 50) : 0,
    };
    
    updateTimerSettings(validatedSettings);
    onOpenChange(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setSettings(timerSettings); // Reset to original settings
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="focusDuration">Focus Duration (min)</Label>
              <Input
                id="focusDuration"
                type="number"
                min="1"
                max="60"
                value={settings.focusDuration}
                onChange={(e) => handleChange(e, "focusDuration")}
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="shortBreakDuration">
                Short Break Duration (min)
              </Label>
              <Input
                id="shortBreakDuration"
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakDuration}
                onChange={(e) => handleChange(e, "shortBreakDuration")}
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="longBreakDuration">
                Long Break Duration (min)
              </Label>
              <Input
                id="longBreakDuration"
                type="number"
                min="5"
                max="60"
                value={settings.longBreakDuration}
                onChange={(e) => handleChange(e, "longBreakDuration")}
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label htmlFor="sessionsBeforeLongBreak">
                Sessions Before Long Break
              </Label>
              <Input
                id="sessionsBeforeLongBreak"
                type="number"
                min="1"
                max="10"
                value={settings.sessionsBeforeLongBreak}
                onChange={(e) => handleChange(e, "sessionsBeforeLongBreak")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="autoStartNextSession">
                Auto-start Next Session
              </Label>
              <Switch
                id="autoStartNextSession"
                checked={settings.autoStartNextSession}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    autoStartNextSession: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="soundEnabled">Sound Notifications</Label>
              <Switch
                id="soundEnabled"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    soundEnabled: checked,
                  }))
                }
              />
            </div>
            {settings.soundEnabled && (
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="soundVolume">Sound Volume</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="soundVolume"
                    min={0}
                    max={100}
                    step={1}
                    value={[settings.soundVolume || 50]}
                    onValueChange={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        soundVolume: value[0],
                      }))
                    }
                    className="w-full"
                  />
                  <span className="w-8 text-right">{settings.soundVolume || 50}%</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label htmlFor="desktopNotifications">Desktop Notifications</Label>
              <Switch
                id="desktopNotifications"
                checked={settings.desktopNotifications}
                onCheckedChange={(checked) => {
                  if (checked && Notification.permission !== "granted") {
                    Notification.requestPermission();
                  }
                  setSettings((prev) => ({
                    ...prev,
                    desktopNotifications: checked,
                  }));
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PomodoroSettings;
