import { useState, useRef, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Clock, CheckCircle, PenSquare, Settings } from "lucide-react";
import { Task } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const AITaskAssistant = () => {
  const { tasks, addTask, editTask, deleteTask, toggleTaskStatus, timerSettings, updateTimerSettings } = useApp();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "👋 Hi! I can help you manage tasks and focus sessions.\n\nTry asking me to:\n• Add a new task\n• Complete a task\n• Start a focus session\n• Show my pending tasks"
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {}, [tasks]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const findBestMatchingTask = (searchTerm: string, statusFilter?: "pending" | "completed"): Task | null => {
    if (!searchTerm) return null;
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const exactMatch = tasks.find(task =>
      task.title.toLowerCase() === normalizedSearch &&
      (statusFilter ? task.status === statusFilter : true)
    );
    if (exactMatch) return exactMatch;
    const startsWithMatch = tasks.find(task =>
      task.title.toLowerCase().startsWith(normalizedSearch) &&
      (statusFilter ? task.status === statusFilter : true)
    );
    if (startsWithMatch) return startsWithMatch;
    const includesMatch = tasks.find(task =>
      task.title.toLowerCase().includes(normalizedSearch) &&
      (statusFilter ? task.status === statusFilter : true)
    );
    return includesMatch || null;
  };

  const extractTaskTitle = (input: string, actionType: string): string => {
    const normalized = input.trim().replace(/\s+/g, " ");
    const addPatterns = [
      /add (?:a )?task to (.+)/i,
      /add (?:a )?task (.+)/i,
      /create (?:a )?task to (.+)/i,
      /create (?:a )?task (.+)/i,
      /new task to (.+)/i,
      /new task (.+)/i,
      /add (.+)/i,
      /create (.+)/i,
      /new (.+)/i,
    ];
    for (const pattern of addPatterns) {
      const match = normalized.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return "";
  };

  const processMessage = async (userInput: string) => {
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: "user", content: userInput }]);
    let response = "";
    try {
      const lowerInput = userInput.toLowerCase();
      if (lowerInput.match(/add|create|new/i) && lowerInput.includes("task")) {
        const taskTitle = extractTaskTitle(userInput, "add|create|new");
        if (taskTitle) {
          try {
            addTask(taskTitle);
            response = `Added new task: "${taskTitle}"`;
            toast({
              title: "Task Added",
              description: `"${taskTitle}" has been added to your tasks.`
            });
          } catch (error) {
            console.error('Error adding task:', error);
            response = "I had trouble adding that task. Please try again or add it manually.";
          }
        } else {
          response = "I couldn't understand the task. Please specify what task you'd like to add.";
        }
      }
      else if (lowerInput.match(/delete|remove|trash/i) && lowerInput.includes("task")) {
        const searchTerm = extractTaskTitle(userInput, "delete|remove|trash");
        if (searchTerm) {
          const matchingTask = findBestMatchingTask(searchTerm);
          if (matchingTask) {
            deleteTask(matchingTask.id);
            response = `Deleted task: "${matchingTask.title}"`;
            toast({
              title: "Task Deleted",
              description: `"${matchingTask.title}" has been removed.`
            });
          } else {
            response = `I couldn't find a task matching "${searchTerm}".`;
          }
        } else {
          response = "Please specify which task you'd like to delete.";
        }
      }
      else if (lowerInput.match(/complete|finish|done|mark\s+as\s+done|mark\s+as\s+complete/i) && lowerInput.includes("task")) {
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
        const parts = userInput.split(/\s+to\s+|\s+with\s+|\s+into\s+/);
        if (parts.length >= 2) {
          const newTitle = parts[parts.length - 1].trim();
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
        if (tasks.length === 0) {
          response = "You don't have any tasks yet. Try adding some!";
        } else {
          const showPending = !lowerInput.includes("completed") && !lowerInput.includes("done");
          const showCompleted = !lowerInput.includes("pending") && !lowerInput.includes("incomplete");
          const showOverdue = lowerInput.includes("overdue");
          const pendingTasks = tasks.filter(task => task.status === "pending");
          const completedTasks = tasks.filter(task => task.status === "completed");
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
      else if (lowerInput.match(/start|begin|initiate/i) && (lowerInput.includes("pomodoro") || lowerInput.includes("timer") || lowerInput.includes("focus") || lowerInput.includes("session"))) {
        const durationMatch = userInput.match(/(\d+)\s*(?:minute|min|m|minutes)/i);
        if (durationMatch) {
          const minutes = parseInt(durationMatch[1]);
          if (minutes > 0) {
            updateTimerSettings({ 
              focusDuration: minutes 
            });
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
      
      // Add assistant response with a small delay to make it feel more natural
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        setIsProcessing(false);
      }, 500);
    } catch (error) {
      console.error('Error processing message:', error);
      response = "I encountered an error processing your request. Please try again.";
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        setIsProcessing(false);
      }, 500);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      processMessage(input);
      setInput("");
    }
  };
  
  return (
    <div className="w-full max-w-lg mx-auto my-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card
          className="relative shadow-xl rounded-2xl border-0 bg-black text-white animate-fade-in !border-0 !border-none"
          style={{
            border: "none",
            borderColor: "transparent",
            boxShadow: "0 6px 24px 0 rgba(31, 38, 135, 0.25)",
          }}
        >
          <CardHeader className="rounded-t-2xl bg-transparent p-4 flex items-center gap-2">
            <CardTitle
              className="text-lg font-semibold text-white tracking-wide"
              style={{
                fontFamily: "'Montserrat', 'Poppins', 'Segoe UI', Arial, sans-serif",
                letterSpacing: "0.02em",
              }}
            >
              AI Task Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 px-3 py-5 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="flex flex-col gap-3">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-xl px-4 py-2 max-w-[80%] text-base shadow
                        ${message.role === "user"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white self-end"
                          : "bg-white/10 text-white border border-white/10 backdrop-blur-sm"
                        }`}
                    >
                      <span className="whitespace-pre-line">{message.content}</span>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <form
              onSubmit={handleSubmit}
              className="sticky bottom-0 bg-black px-3 py-3 flex gap-2 rounded-b-2xl border-t border-white/10"
              style={{ zIndex: 10 }}
            >
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
                className="flex-1 rounded-full px-4 py-2 bg-white/10 text-white border border-white/20 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                style={{ minHeight: 40, fontSize: 15 }}
                autoComplete="off"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isProcessing}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg transition"
                aria-label="Send"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>

            {/* Quick action shortcuts */}
            <div className="flex flex-wrap gap-2 px-3 py-2 bg-black rounded-b-2xl border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white hover:bg-indigo-500/80 transition"
                title="Add a new task"
                onClick={() => {
                  setInput("Add a task to ");
                  inputRef.current?.focus();
                }}
              >
                <PenSquare className="h-4 w-4" />
                Add Task
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white hover:bg-green-500/80 transition"
                title="Show all tasks"
                onClick={() => {
                  setInput("Show my tasks");
                  processMessage("Show my tasks");
                  setInput("");
                }}
              >
                <CheckCircle className="h-4 w-4" />
                Show Tasks
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white hover:bg-pink-500/80 transition"
                title="Start a focus session"
                onClick={() => {
                  setInput("Start a focus session");
                  inputRef.current?.focus();
                }}
              >
                <Clock className="h-4 w-4" />
                Start Focus
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white hover:bg-yellow-500/80 transition"
                title="Show settings"
                onClick={() => {
                  setInput("Show settings");
                  processMessage("Show settings");
                  setInput("");
                }}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AITaskAssistant;