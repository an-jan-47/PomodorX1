
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import StatsTimeframeSelector from "@/components/stats/StatsTimeframeSelector";
import PomodoroStats from "@/components/stats/PomodoroStats";
import ProductivityInsights from "@/components/stats/ProductivityInsights";
import SessionDistributionChart from "@/components/stats/SessionDistributionChart";
import TasksOverview from "@/components/dashboard/TasksOverview"; // Import TasksOverview component

const StatsTab = () => {
  const { pomodoroSessions, tasks, statsTimeframe, setStatsTimeframe } = useApp();
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold">Statistics</h2>
      
      <StatsTimeframeSelector />
      
      {/* Use the TasksOverview component */}
      <TasksOverview />
      
      <div className="grid grid-cols-1 gap-6 transition-all duration-300">
        {/* Removed TasksStats component to avoid duplication */}
        <PomodoroStats />
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProductivityInsights />
          <SessionDistributionChart />
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
