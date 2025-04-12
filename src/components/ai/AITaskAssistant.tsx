import { useState, useRef, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Clock, CheckCircle, TrashIcon, PenSquare } from "lucide-react";
import { Task } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

const AITaskAssistant = () => {
  const { tasks, addTask, editTask, deleteTask, toggleTaskStatus, timerSettings, updateTimerSettings } = useApp();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: "Hello! I can help? Just Bring it on \n- Wanna Add or modify a task \n - Start a pomodoro\n- Set Timers \n I can do it all.."
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

  const processMessage = async (userInput: string) => {
    setIsProcessing(true);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userInput }]);
    
    let response = "";
    
    // Simple intent detection
    const lowerInput = userInput.toLowerCase();
    
    // Task management intents
    if (lowerInput.includes("add") && lowerInput.includes("task")) {
      // Extract task title after "add task" or similar phrases
      const taskTitle = userInput.replace(/add\s+task\s+to\s+|add\s+a\s+task\s+to\s+|add\s+task\s+|add\s+a\s+task\s+/i, "").trim();
      
      if (taskTitle) {
        addTask(taskTitle);
        response = `Added new task: "${taskTitle}"`;
      } else {
        response = "Uh Uhh.. I couldn't understand the task. Please specify what task you'd like to add.";
      }
    }
    else if ((lowerInput.includes("delete") || lowerInput.includes("remove")) && lowerInput.includes("task")) {
      // Find task by partial title match
      const searchTerm = userInput.replace(/delete\s+task\s+|delete\s+the\s+task\s+|remove\s+task\s+|remove\s+the\s+task\s+/i, "").trim();
      
      if (searchTerm) {
        const matchingTask = tasks.find(task => 
          task.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
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
    else if ((lowerInput.includes("complete") || lowerInput.includes("finish") || lowerInput.includes("done")) && lowerInput.includes("task")) {
      // Find task by partial title match
      const searchTerm = userInput.replace(/complete\s+task\s+|complete\s+the\s+task\s+|finish\s+task\s+|finish\s+the\s+task\s+|done\s+task\s+|done\s+with\s+task\s+/i, "").trim();
      
      if (searchTerm) {
        const matchingTask = tasks.find(task => 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          task.status === "pending"
        );
        
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
    else if (lowerInput.includes("edit") && lowerInput.includes("task")) {
      // This is more complex - need to identify which task and the new title
      const parts = userInput.replace(/edit\s+task\s+|edit\s+the\s+task\s+/i, "").split(/\s+to\s+/);
      
      if (parts.length === 2) {
        const searchTerm = parts[0].trim();
        const newTitle = parts[1].trim();
        
        const matchingTask = tasks.find(task => 
          task.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
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
    else if (lowerInput.includes("show") && lowerInput.includes("task")) {
      // Show tasks
      if (tasks.length === 0) {
        response = "You don't have any tasks yet. Try adding some!";
      } else {
        const pendingTasks = tasks.filter(task => task.status === "pending");
        const completedTasks = tasks.filter(task => task.status === "completed");
        
        response = "Here are your tasks:\n\n";
        
        if (pendingTasks.length > 0) {
          response += "Pending Tasks:\n";
          pendingTasks.forEach((task, index) => {
            response += `${index + 1}. ${task.title}\n`;
          });
          response += "\n";
        }
        
        if (completedTasks.length > 0) {
          response += "Completed Tasks:\n";
          completedTasks.forEach((task, index) => {
            response += `${index + 1}. ${task.title}\n`;
          });
        }
      }
    }
    // Pomodoro management intents
    else if (lowerInput.includes("start") && (lowerInput.includes("pomodoro") || lowerInput.includes("timer"))) {
      // Extract duration if specified
      const durationMatch = userInput.match(/(\d+)\s*(?:minute|min|m)/i);
      
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
    else if (lowerInput.includes("reset") && (lowerInput.includes("pomodoro") || lowerInput.includes("timer"))) {
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
    else if (lowerInput.includes("set") && lowerInput.includes("break")) {
      // Set break duration
      const shortMatch = userInput.match(/short\s+break\s+(?:to\s+)?(\d+)\s*(?:minute|min|m)/i);
      const longMatch = userInput.match(/long\s+break\s+(?:to\s+)?(\d+)\s*(?:minute|min|m)/i);
      
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
    else if (lowerInput.includes("help")) {
      response = "I can help you manage your tasks and pomodoro timers. Try commands like:\n\n" +
        "• Add a task to [task title]\n" +
        "• Delete the task [partial title]\n" +
        "• Complete the task [partial title]\n" +
        "• Edit task [partial title] to [new title]\n" +
        "• Show all my tasks\n" +
        "• Start a pomodoro for [X] minutes\n" +
        "• Set short break to [X] minutes\n" +
        "• Set long break to [X] minutes";
    }
    else {
      response = "I'm not sure how to help with that. Try asking me to add, delete, edit, or complete tasks, or manage your pomodoro settings.";
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
          AI
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
            onClick={() => setInput("Complete the task ")}
          >
            <CheckCircle className="h-3 w-3 mr-1" /> Complete Task
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs" 
            onClick={() => setInput("Start a 25 minute pomodoro")}
          >
            <Clock className="h-3 w-3 mr-1" /> Start Pomodoro
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs" 
            onClick={() => setInput("Show all my tasks")}
          >
            <TrashIcon className="h-3 w-3 mr-1" /> View Tasks
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AITaskAssistant;
