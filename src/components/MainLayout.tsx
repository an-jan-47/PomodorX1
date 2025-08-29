
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TasksTab from "@/components/tabs/TasksTab";
import PomodoroTab from "@/components/tabs/PomodoroTab";
import StatsTab from "@/components/tabs/StatsTab";
import { Clock, ListTodo, BarChart2 } from "lucide-react";

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState("pomodoro");
  const [isChangingTab, setIsChangingTab] = useState(false);

  // Add subtle animation when changing tabs
  const handleTabChange = (value: string) => {
    setIsChangingTab(true);
    setActiveTab(value);
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsChangingTab(false);
    }, 500);
  };

  // Set dark mode by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col">
      <header className="py-3 px-4 md:py-4 md:px-6 sticky top-0 z-10 bg-black/50 backdrop-blur-md text-primary-foreground">
        <div className="container max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold">
            <span className="flex items-center gap-2 text-primary transition-all duration-300 hover:scale-105">
              <Clock className="h-5 w-5 md:h-6 md:w-6" />
              PomodoroX
            </span>
          </h1>
        </div>
      </header>

      <main className={`flex-1 container max-w-6xl mx-auto p-3 md:p-6 animate-fade-in transition-all duration-500 ease-in-out ${isChangingTab ? 'opacity-90 scale-[0.99]' : 'opacity-100 scale-100'}`}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 md:mb-8 p-1 bg-black/20 backdrop-blur-lg border-white/10 rounded-lg">
            <TabsTrigger 
              value="tasks" 
              className="flex items-center justify-center gap-1 md:gap-2 transition-all duration-300 hover:bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-1.5 md:py-2"
            >
              <ListTodo className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pomodoro" 
              className="flex items-center justify-center gap-1 md:gap-2 transition-all duration-300 hover:bg-secondary/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-1.5 md:py-2"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Pomodoro</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center justify-center gap-1 md:gap-2 transition-all duration-300 hover:bg-secondary/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-1.5 md:py-2"
            >
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="animate-slide-in transition-all duration-500 ease-in-out">
            <TasksTab />
          </TabsContent>
          
          <TabsContent value="pomodoro" className="animate-slide-in transition-all duration-500 ease-in-out">
            <PomodoroTab />
          </TabsContent>
          
          <TabsContent value="stats" className="animate-slide-in transition-all duration-500 ease-in-out">
            <StatsTab />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="py-2 md:py-3 text-center text-xs md:text-sm text-muted-foreground bg-black/20 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto">
          Be Productive, Be more Stronger.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
