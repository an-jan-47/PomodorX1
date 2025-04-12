
import AddTaskForm from "@/components/tasks/AddTaskForm";
import TaskList from "@/components/tasks/TaskList";
import AITaskAssistant from "@/components/ai/AITaskAssistant";

const TasksTab = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-semibold">Task Management</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <AddTaskForm />
          <TaskList />
        </div>
        
        <div>
          <AITaskAssistant />
        </div>
      </div>
    </div>
  );
};

export default TasksTab;
