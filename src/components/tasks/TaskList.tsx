
import { useApp } from "@/hooks/useApp";
import TaskItem from "./TaskItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TaskList = () => {
  const { tasks } = useApp();
  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pending">
              Pending ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedTasks.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            {pendingTasks.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No pending tasks. Add some tasks to get started!
              </p>
            ) : (
              <div className="space-y-1">
                {pendingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="completed">
            {completedTasks.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No completed tasks yet.
              </p>
            ) : (
              <div className="space-y-1">
                {completedTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TaskList;
