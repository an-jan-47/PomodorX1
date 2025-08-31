import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface DateTimePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  date,
  onDateChange,
  className,
  placeholder = "Select date and time",
  disabled = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
  const [timeValue, setTimeValue] = React.useState(
    date ? format(date, "HH:mm") : "09:00"
  );

  React.useEffect(() => {
    setSelectedDate(date);
    if (date) {
      setTimeValue(format(date, "HH:mm"));
    }
  }, [date]);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined);
      onDateChange(undefined);
      return;
    }

    // Combine the selected date with the current time
    const [hours, minutes] = timeValue.split(":").map(Number);
    const combinedDate = new Date(newDate);
    combinedDate.setHours(hours, minutes, 0, 0);
    
    setSelectedDate(combinedDate);
    onDateChange(combinedDate);
  };

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    
    if (!selectedDate) return;

    const [hours, minutes] = newTime.split(":").map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes, 0, 0);
    
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setTimeValue("09:00");
    onDateChange(undefined);
    setIsOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    const [hours, minutes] = timeValue.split(":").map(Number);
    now.setHours(hours, minutes, 0, 0);
    
    setSelectedDate(now);
    onDateChange(now);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal min-h-[2.5rem] relative group",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <div className="flex-1 min-w-0">
            {selectedDate ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="truncate text-sm sm:text-base">
                  {format(selectedDate, "PPP")}
                </span>
                <Badge variant="secondary" className="w-fit flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {format(selectedDate, "HH:mm")}
                </Badge>
              </div>
            ) : (
              <span className="text-sm sm:text-base">{placeholder}</span>
            )}
          </div>
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-[95vw] sm:max-w-none" align="start" side="bottom">
        <div className="flex flex-col space-y-3 p-3 max-h-[80vh] overflow-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Label className="text-sm font-medium">Select Date & Time</Label>
            <div className="flex gap-1 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="text-xs h-7"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="text-xs h-7"
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Calendar Section */}
            <div className="flex-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className="rounded-md border w-full"
              />
            </div>
            
            {/* Time Section */}
            <div className="w-full lg:w-48 space-y-3">
              <div>
                <Label htmlFor="time" className="text-sm font-medium block mb-2">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={timeValue}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Quick Time Presets */}
              <div>
                <Label className="text-sm font-medium block mb-2">Quick Times</Label>
                <div className="grid grid-cols-2 gap-1">
                  {["09:00", "12:00", "15:00", "18:00"].map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTimeChange(time)}
                      className="text-xs h-7"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Selected DateTime Display */}
              {selectedDate && (
                <div className="p-2 bg-muted/50 rounded-md">
                  <Label className="text-xs text-muted-foreground">Selected:</Label>
                  <div className="text-sm font-medium">
                    {format(selectedDate, "PPP")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(selectedDate, "HH:mm")}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={!selectedDate}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
