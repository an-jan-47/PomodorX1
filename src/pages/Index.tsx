
import { useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import MinimizedWindow from "@/components/pomodoro/MinimizedWindow";
import { AppProvider } from "@/contexts/AppContext";

const Index = () => {
  // Set the document title
  useEffect(() => {
    document.title = "PomodoroX - Time Management & Task Focus App";
  }, []);

  return (
    <AppProvider>
      <MainLayout />
      <MinimizedWindow />
    </AppProvider>
  );
};

export default Index;
