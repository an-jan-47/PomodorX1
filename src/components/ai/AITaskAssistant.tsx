import { useState, useRef, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Clock, CheckCircle, TrashIcon, PenSquare, Calendar, Settings, Volume2 } from "lucide-react";
import { Task } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

const AITaskAssistant = () => {
  const { tasks, addTask, editTask, deleteTask, toggleTaskStatus, timerSettings, updateTimerSettings } = useApp();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "Hello! I can help? Just Bring it on \n- Wanna Add or modify a task \n - Start a pomodoro \n I can do it all.."
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper function to find the best matching task
  const findBestMatchingTask = (searchTerm: string, statusFilter?: "pending" | "completed"): Task | null => {
    if (!searchTerm) return null;
    
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // First try exact match
    const exactMatch = tasks.find(task => 
      task.title.toLowerCase() === normalizedSearch &&
      (statusFilter ? task.status === statusFilter : true)
    );
    
    if (exactMatch) return exactMatch;
    
    // Then try starts with
    const startsWithMatch = tasks.find(task => 
      task.title.toLowerCase().startsWith(normalizedSearch) &&
      (statusFilter ? task.status === statusFilter : true)
    );
    
    if (startsWithMatch) return startsWithMatch;
    
    // Finally try includes
    const includesMatch = tasks.find(task => 
      task.title.toLowerCase().includes(normalizedSearch) &&
      (statusFilter ? task.status === statusFilter : true)
    );
    
    return includesMatch || null;
  };

  // Extract task title from user input
  const extractTaskTitle = (input: string, actionType: string): string => {
    const patterns = [
      new RegExp(`${actionType}\\s+task\\s+to\\s+(.+)`, 'i'),
      new RegExp(`${actionType}\\s+a\\s+task\\s+to\\s+(.+)`, 'i'),
      new RegExp(`${actionType}\\s+task\\s+(.+)`, 'i'),
      new RegExp(`${actionType}\\s+a\\s+task\\s+(.+)`, 'i'),
      new RegExp(`${actionType}\\s+(.+)`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return "";
  };

  const processMessage = async (userInput: string) => {
    setIsProcessing(true);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userInput }]);
    
    let response = "";
    
    // Simple intent detection
    const lowerInput = userInput.toLowerCase();
    
    // Task management intents
    if (lowerInput.match(/add|create|new/i) && lowerInput.includes("task")) {
      // Extract task title after "add task" or similar phrases
      const taskTitle = extractTaskTitle(userInput, "add|create|new");
      
      if (taskTitle) {
        const newTask = {
          id: crypto.randomUUID(),
          title: taskTitle,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        addTask(JSON.stringify(newTask));
        response = `Added new task: "${taskTitle}"`;
      } else {
        response = "Uh Uhh.. I couldn't understand the task. Please specify what task you'd like to add.";
      }
    }
    else if (lowerInput.match(/delete|remove|trash/i) && lowerInput.includes("task")) {
      // Find task by partial title match
      const searchTerm = extractTaskTitle(userInput, "delete|remove|trash");
      
      if (searchTerm) {
        const matchingTask = findBestMatchingTask(searchTerm);
        
        if (matchingTask) {
          deleteTask(matchingTask.id);
          response = `Deleted task: "${matchingTask.title}"`;
        } else {
          response = `I couldn't find a task matching "${searchTerm}".`;
        }
      } else {
        response = "Please specify which task you'd like to delete.";
      }
    }
    else if (lowerInput.match(/complete|finish|done|mark\s+as\s+done|mark\s+as\s+complete/i) && lowerInput.includes("task")) {
      // Find task by partial title match
      const searchTerm = extractTaskTitle(userInput, "complete|finish|done|mark\\s+as\\s+done|mark\\s+as\\s+complete");
      
      if (searchTerm) {
        const matchingTask = findBestMatchingTask(searchTerm, "pending");
        
        if (matchingTask) {
          toggleTaskStatus(matchingTask.id);
          response = `Marked task as complete: "${matchingTask.title}"`;
        } else {
          response = `I couldn't find an incomplete task matching "${searchTerm}".`;
        }
      } else {
        response = "Please specify which task you'd like to mark as complete.";
      }
    }
    else if (lowerInput.match(/edit|update|change|modify/i) && lowerInput.includes("task")) {
      // This is more complex - need to identify which task and the new title
      const parts = userInput.split(/\s+to\s+|\s+with\s+|\s+into\s+/);
      
      if (parts.length >= 2) {
        // The last part is the new title
        const newTitle = parts[parts.length - 1].trim();
        
        // Everything before the last part (minus the edit command) is the search term
        const searchCommand = parts[0].match(/edit|update|change|modify/i)?.[0] || "";
        const searchTermParts = parts.slice(0, parts.length - 1);
        const searchTerm = searchTermParts.join(" ").replace(new RegExp(`${searchCommand}\\s+task\\s+`, 'i'), "").trim();
        
        const matchingTask = findBestMatchingTask(searchTerm);
        
        if (matchingTask && newTitle) {
          editTask(matchingTask.id, newTitle);
          response = `Updated task from "${matchingTask.title}" to "${newTitle}"`;
        } else {
          response = `I couldn't find a task matching "${searchTerm}" or the new title was missing.`;
        }
      } else {
        response = "To edit a task, please use format: 'Edit task [current task] to [new title]'";
      }
    }
    else if (lowerInput.match(/show|list|display|view|what are my/i) && lowerInput.includes("task")) {
      // Show tasks
      if (tasks.length === 0) {
        response = "You don't have any tasks yet. Try adding some!";
      } else {
        // Check if user wants to see specific status
        const showPending = !lowerInput.includes("completed") && !lowerInput.includes("done");
        const showCompleted = !lowerInput.includes("pending") && !lowerInput.includes("incomplete");
        const showOverdue = lowerInput.includes("overdue");
        
        const pendingTasks = tasks.filter(task => task.status === "pending");
        const completedTasks = tasks.filter(task => task.status === "completed");
        
        // Get overdue tasks - tasks that are pending and were created more than 24 hours ago
        const overdueTasks = tasks.filter(task => {
          if (task.status !== "pending") return false;
          const createdDate = new Date(task.createdAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - createdDate.getTime());
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          return diffDays >= 1;
        });
        
        response = "Here are your tasks:\n\n";
        
        if (showPending && pendingTasks.length > 0 && !showOverdue) {
          response += "Pending Tasks:\n";
          pendingTasks.forEach((task, index) => {
            response += `${index + 1}. ${task.title}\n`;
          });
          response += "\n";
        }
        
        if (showOverdue && overdueTasks.length > 0) {
          response += "Overdue Tasks:\n";
          overdueTasks.forEach((task, index) => {
            const createdDate = new Date(task.createdAt);
            const daysAgo = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            response += `${index + 1}. ${task.title} (created ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago)\n`;
          });
          response += "\n";
        }
        
        if (showCompleted && completedTasks.length > 0) {
          response += "Completed Tasks:\n";
          completedTasks.forEach((task, index) => {
            response += `${index + 1}. ${task.title}\n`;
          });
        }
        
        if (response === "Here are your tasks:\n\n") {
          response = "No tasks found matching your criteria.";
        }
      }
    }
    // Pomodoro management intents
    else if (lowerInput.match(/start|begin|initiate/i) && (lowerInput.includes("pomodoro") || lowerInput.includes("timer") || lowerInput.includes("focus") || lowerInput.includes("session"))) {
      // Extract duration if specified
      const durationMatch = userInput.match(/(\d+)\s*(?:minute|min|m|minutes)/i);
      
      if (durationMatch) {
        const minutes = parseInt(durationMatch[1]);
        if (minutes > 0) {
          // Update timer settings with the new duration
          updateTimerSettings({ 
            focusDuration: minutes 
          });
          
          // Force reset the timer state in localStorage to ensure it picks up the new duration
          const currentState = JSON.parse(localStorage.getItem('pomodoroState') || '{}');
          localStorage.setItem('pomodoroState', JSON.stringify({
            ...currentState,
            timeRemaining: minutes * 60,
            isRunning: false,
            isPaused: false,
            currentSessionType: "focus",
            lastUpdated: new Date().toISOString()
          }));
          
          response = `Set focus duration to ${minutes} minutes. Please switch to the Pomodoro tab to start your session.`;
        } else {
          response = "Please specify a valid duration in minutes.";
        }
      } else {
        response = `Pomodoro timer is ready with ${timerSettings.focusDuration} minute focus sessions. Please switch to the Pomodoro tab to start.`;
      }
    }
    else if (lowerInput.match(/reset|clear|restart/i) && (lowerInput.includes("pomodoro") || lowerInput.includes("timer") || lowerInput.includes("session"))) {
      // Force reset the timer state in localStorage
      localStorage.setItem('pomodoroState', JSON.stringify({
        isRunning: false,
        isPaused: false,
        timeRemaining: timerSettings.focusDuration * 60,
        currentSession: 1,
        currentSessionType: "focus",
        lastUpdated: new Date().toISOString()
      }));
      
      response = "Timer has been reset. Please switch to the Pomodoro tab to start a new session.";
    }
    else if (lowerInput.match(/set|change|update|configure/i) && lowerInput.includes("break")) {
      // Set break duration
      const shortMatch = userInput.match(/short\s+break\s+(?:to\s+)?(\d+)\s*(?:minute|min|m|minutes)/i);
      const longMatch = userInput.match(/long\s+break\s+(?:to\s+)?(\d+)\s*(?:minute|min|m|minutes)/i);
      
      if (shortMatch) {
        const minutes = parseInt(shortMatch[1]);
        updateTimerSettings({ shortBreakDuration: minutes });
        response = `Set short break duration to ${minutes} minutes.`;
      } 
      else if (longMatch) {
        const minutes = parseInt(longMatch[1]);
        updateTimerSettings({ longBreakDuration: minutes });
        response = `Set long break duration to ${minutes} minutes.`;
      }
      else {
        response = "Please specify whether you want to set a short or long break, and the duration in minutes.";
      }
    }
    else if (lowerInput.match(/set|change|update|configure/i) && lowerInput.includes("focus")) {
      // Set focus duration
      const durationMatch = userInput.match(/(\d+)\s*(?:minute|min|m|minutes)/i);
      
      if (durationMatch) {
        const minutes = parseInt(durationMatch[1]);
        if (minutes > 0) {
          updateTimerSettings({ focusDuration: minutes });
          response = `Set focus duration to ${minutes} minutes.`;
        } else {
          response = "Please specify a valid duration in minutes.";
        }
      } else {
        response = "Please specify the focus duration in minutes.";
      }
    }
    else if (lowerInput.match(/set|change|update|configure/i) && lowerInput.includes("session")) {
      // Set sessions before long break
      const sessionsMatch = userInput.match(/(\d+)\s*(?:session|sessions)/i);
      
      if (sessionsMatch) {
        const sessions = parseInt(sessionsMatch[1]);
        if (sessions > 0) {
          updateTimerSettings({ sessionsBeforeLongBreak: sessions });
          response = `Set number of sessions before long break to ${sessions}.`;
        } else {
          response = "Please specify a valid number of sessions.";
        }
      } else {
        response = "Please specify how many sessions you want before a long break.";
      }
    }
    else if (lowerInput.match(/turn on|enable|activate/i) && lowerInput.includes("sound")) {
      updateTimerSettings({ soundEnabled: true });
      response = "Sound notifications have been enabled.";
    }
    else if (lowerInput.match(/turn off|disable|deactivate/i) && lowerInput.includes("sound")) {
      updateTimerSettings({ soundEnabled: false });
      response = "Sound notifications have been disabled.";
    }
    else if (lowerInput.match(/set|change|update/i) && lowerInput.includes("volume")) {
      const volumeMatch = userInput.match(/(\d+)(?:\s*%|)/i);
      
      if (volumeMatch) {
        const volume = parseInt(volumeMatch[1]);
        if (volume >= 0 && volume <= 100) {
          updateTimerSettings({ soundVolume: volume });
          response = `Set sound volume to ${volume}%.`;
        } else {
          response = "Please specify a valid volume between 0 and 100%.";
        }
      } else {
        response = "Please specify the volume percentage.";
      }
    }
    else if (lowerInput.match(/turn on|enable|activate/i) && lowerInput.includes("notification")) {
      updateTimerSettings({ desktopNotifications: true });
      response = "Desktop notifications have been enabled.";
    }
    else if (lowerInput.match(/turn off|disable|deactivate/i) && lowerInput.includes("notification")) {
      updateTimerSettings({ desktopNotifications: false });
      response = "Desktop notifications have been disabled.";
    }
    else if (lowerInput.match(/turn on|enable|activate/i) && lowerInput.includes("auto")) {
      updateTimerSettings({ autoStartNextSession: true });
      response = "Auto-start for the next session has been enabled.";
    }
    else if (lowerInput.match(/turn off|disable|deactivate/i) && lowerInput.includes("auto")) {
      updateTimerSettings({ autoStartNextSession: false });
      response = "Auto-start for the next session has been disabled.";
    }
    else if (lowerInput.includes("settings") || lowerInput.includes("configuration")) {
      response = `Current Settings:\n\n` +
        `• Focus Duration: ${timerSettings.focusDuration} minutes\n` +
        `• Short Break: ${timerSettings.shortBreakDuration} minutes\n` +
        `• Long Break: ${timerSettings.longBreakDuration} minutes\n` +
        `• Sessions Before Long Break: ${timerSettings.sessionsBeforeLongBreak}\n` +
        `• Auto-Start Next Session: ${timerSettings.autoStartNextSession ? 'Enabled' : 'Disabled'}\n` +
        `• Sound: ${timerSettings.soundEnabled ? 'Enabled' : 'Disabled'}\n` +
        `• Sound Volume: ${timerSettings.soundVolume}%\n` +
        `• Desktop Notifications: ${timerSettings.desktopNotifications ? 'Enabled' : 'Disabled'}`;
    }
    else if (lowerInput.match(/hello|hi|hey|greetings/i)) {
      response = "Hello! I'm your PomodoroX assistant. I can help you manage tasks and configure your pomodoro timer. What would you like to do today?";
    }
    else if (lowerInput.match(/thank|thanks/i)) {
      response = "You're welcome! Is there anything else I can help you with?";
    }
    else if (lowerInput.includes("help")) {
      response = "I can help you manage your tasks and pomodoro timers. Try commands like:\n\n" +
        "• Add a task to [task title]\n" +
        "• Delete the task [partial title]\n" +
        "• Complete the task [partial title]\n" +
        "• Edit task [partial title] to [new title]\n" +
        "• Show all my tasks\n" +
        "• Show my overdue tasks\n" +
        "• Start a pomodoro for [X] minutes\n" +
        "• Set focus duration to [X] minutes\n" +
        "• Set short break to [X] minutes\n" +
        "• Set long break to [X] minutes\n" +
        "• Set sessions before long break to [X]\n" +
        "• Turn on/off sound notifications\n" +
        "• Set volume to [X]%\n" +
        "• Turn on/off desktop notifications\n" +
        "• Turn on/off auto-start for next session\n" +
        "• Show current settings";
    }
    else {
      response = "I'm not sure how to help with that. Try asking me to add, delete, edit, or complete tasks, or manage your pomodoro settings. Type 'help' for a list of commands.";
    }
    
    // Add assistant response 
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsProcessing(false);
    }, 500); // Small delay to make it feel more natural
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      processMessage(input);
      setInput("");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted' 
                  }`}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to manage your tasks..."
            className="flex-1"
            disabled={isProcessing}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isProcessing}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs" 
            onClick={() => setInput("Add a task to ")}
          >
            <PenSquare className="h-3 w-3 mr-1" /> Add Task
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs" 
            onClick={() => setInput("Show my overdue tasks")}
          >
            <Calendar className="h-3 w-3 mr-1" /> Overdue Tasks
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs" 
            onClick={() => setInput("Start a 25 minute pomodoro")}
          >
            <Clock className="h-3 w-3 mr-1" /> Start Timer
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs" 
            onClick={() => setInput("Show current settings")}
          >
            <Settings className="h-3 w-3 mr-1" /> Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AITaskAssistant;
