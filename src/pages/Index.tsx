
import { useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { AppProvider } from "@/contexts/AppContext";

const Index = () => {
  // Set the document title
  useEffect(() => {
    document.title = "PomodoroX - Time Management & Task Focus App";
  }, []);

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default Index;
