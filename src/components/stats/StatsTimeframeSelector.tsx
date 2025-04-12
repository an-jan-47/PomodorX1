import { useApp } from "@/contexts/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsTimeframe } from "@/lib/types";
import { motion } from "framer-motion";

const StatsTimeframeSelector = () => {
  const { statsTimeframe, setStatsTimeframe } = useApp();

  const handleChange = (value: string) => {
    setStatsTimeframe(value as StatsTimeframe);
  };

  const timeframes = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" }
  ];

  return (
    <div className="flex justify-center w-full mb-6">
      <Tabs
        value={statsTimeframe}
        onValueChange={handleChange}
        className="w-full max-w-md animate-in fade-in-50 duration-300"
      >
        <TabsList className="grid w-full grid-cols-3 bg-background">
          {timeframes.map((timeframe, index) => (
            <motion.div
              key={timeframe.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <TabsTrigger 
                value={timeframe.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
              >
                {timeframe.label}
              </TabsTrigger>
            </motion.div>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default StatsTimeframeSelector;