
import { useState } from "react";
import StatsTimeframeSelector from "@/components/stats/StatsTimeframeSelector";
import TasksStats from "@/components/stats/TasksStats";
import PomodoroStats from "@/components/stats/PomodoroStats";
// import ProductivityTrendChart from "@/components/stats/ProductivityTrendChart";
import ProductivityInsights from "@/components/stats/ProductivityInsights";
import SessionDistributionChart from "@/components/stats/SessionDistributionChart";

const StatsTab = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold">Statistics</h2>
      
      <StatsTimeframeSelector />
      
      <div className="grid grid-cols-1 gap-6 transition-all duration-300">
        <TasksStats />
        <PomodoroStats />
      </div>
      
      <div className="space-y-6">
        <StatsTimeframeSelector />
        {/* <ProductivityTrendChart /> */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProductivityInsights />
          <SessionDistributionChart />
        </div>
      </div>
    </div>
  );
};

export default StatsTab;
