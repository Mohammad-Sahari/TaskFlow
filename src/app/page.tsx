"use client";

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { TaskColumn } from '@/components/TaskColumn';
import { TaskForm } from '@/components/TaskForm';
import { type Task, type TaskStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { type z } from "zod";
import { type taskFormSchema } from "@/components/TaskForm"; // Assuming TaskForm exports its schema type or Zod object

type TaskFormValues = z.infer<ReturnType<() => typeof taskFormSchema>>; // Adjust if schema export is different

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();

  // Load tasks from local storage on initial mount
  useEffect(() => {
    const storedTasks = localStorage.getItem('taskflow-tasks');
    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
        }));
        setTasks(parsedTasks);
      } catch (error) {
        console.error("Failed to parse tasks from local storage", error);
        setTasks([]); // Fallback to empty if parsing fails
      }
    } else {
       // Initialize with sample tasks if nothing in local storage and tasks array is empty
       // This ensures crypto.randomUUID is called client-side
       if(tasks.length === 0) {
        setTasks([
          { id: crypto.randomUUID(), title: "Welcome to TaskFlow!", description: "Drag this task or create new ones.", status: "todo", createdAt: new Date(), updatedAt: new Date(), elapsedTime: 0, timerStartTime: null, isTimerRunning: false, totalTimeLogged: null },
          { id: crypto.randomUUID(), title: "Explore Features", description: "Try editing, deleting, and moving tasks. Tasks in 'In Progress' have a timer!", status: "todo", createdAt: new Date(), updatedAt: new Date(), elapsedTime: 0, timerStartTime: null, isTimerRunning: false, totalTimeLogged: null },
        ]);
       }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save tasks to local storage whenever tasks change
  useEffect(() => {
    if(tasks.length > 0 || localStorage.getItem('taskflow-tasks')) { // Only save if tasks exist or were previously stored
      localStorage.setItem('taskflow-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);


  const handleOpenTaskForm = (taskToEdit?: Task) => {
    setEditingTask(taskToEdit || null);
    setIsTaskFormOpen(true);
  };

  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleTaskSubmit = (values: TaskFormValues, existingTaskData?: Task) => {
    if (existingTaskData) {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === existingTaskData.id 
            ? { ...task, ...values, updatedAt: new Date() } 
            : task
        )
      );
      toast({ title: "Task Updated", description: `"${values.title}" has been updated.` });
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        ...values,
        description: values.description || "", // Ensure description is always a string
        status: 'todo',
        createdAt: new Date(),
        updatedAt: new Date(),
        elapsedTime: 0,
        timerStartTime: null,
        isTimerRunning: false,
        totalTimeLogged: null,
      };
      setTasks(prevTasks => [newTask, ...prevTasks]);
      toast({ title: "Task Created", description: `"${values.title}" has been added to To Do.` });
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    if (taskToDelete) {
      toast({ title: "Task Deleted", description: `"${taskToDelete.title}" has been deleted.`, variant: "destructive" });
    }
  };
  
  const updateTaskTimerState = (taskId: string, updates: Partial<Task>): Task | undefined => {
    let updatedTaskInstance: Task | undefined;
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          updatedTaskInstance = { ...task, ...updates, updatedAt: new Date() };
          return updatedTaskInstance;
        }
        return task;
      })
    );
    return updatedTaskInstance;
  };

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let updates: Partial<Task> = { status: newStatus };

    // Logic when moving OUT of 'inprogress'
    if (task.status === 'inprogress' && newStatus !== 'inprogress') {
      if (task.isTimerRunning && task.timerStartTime) {
        const sessionDuration = (Date.now() - task.timerStartTime) / 1000;
        updates.elapsedTime = task.elapsedTime + sessionDuration;
      }
      updates.isTimerRunning = false;
      updates.timerStartTime = null;
    }

    // Logic when moving INTO 'inprogress'
    if (newStatus === 'inprogress' && task.status !== 'inprogress') {
      updates.isTimerRunning = true;
      updates.timerStartTime = Date.now();
      // elapsedTime remains, current session starts fresh
    }
    
    // Logic when moving INTO 'done'
    if (newStatus === 'done') {
      // If it was in 'inprogress' and timer running, elapsedTime would have been updated above
      // If it was already updated (e.g. paused then moved), use that
      updates.totalTimeLogged = updates.elapsedTime !== undefined ? updates.elapsedTime : task.elapsedTime;
      updates.isTimerRunning = false; // Ensure timer is stopped
      updates.timerStartTime = null;
    } else {
       // If moving out of 'done', clear totalTimeLogged (optional, depends on desired behavior)
       // updates.totalTimeLogged = null; 
    }
    
    updateTaskTimerState(taskId, updates);
    toast({ title: "Task Status Changed", description: `"${task.title}" moved to ${newStatus}.` });
  };

  const handleToggleTimer = (taskId: string, shouldRun: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'inprogress') return;

    let updates: Partial<Task>;
    if (shouldRun) { // Start or Resume timer
      updates = {
        isTimerRunning: true,
        timerStartTime: Date.now(),
      };
    } else { // Pause timer
      const sessionDuration = task.timerStartTime ? (Date.now() - task.timerStartTime) / 1000 : 0;
      updates = {
        isTimerRunning: false,
        timerStartTime: null,
        elapsedTime: task.elapsedTime + sessionDuration,
      };
    }
    updateTaskTimerState(taskId, updates);
  };
  
  // This function is called by TaskCard's useEffect timer.
  // It's mainly for potential future use if global sync is needed.
  // For now, the TaskCard manages its displayTime locally based on task props.
  const handleTimerTick = useCallback((taskId: string, currentTime: number) => {
    // console.log(`Task ${taskId} ticked: ${currentTime}`);
    // This could be used to persist current time more frequently if needed,
    // but local storage on tasks array change should be sufficient.
  }, []);


  const taskColumns: { title: string; status: TaskStatus }[] = [
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'inprogress' },
    { title: 'Done', status: 'done' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onOpenTaskForm={() => handleOpenTaskForm()} />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {taskColumns.map(col => (
            <TaskColumn
              key={col.status}
              title={col.title}
              status={col.status}
              tasks={tasks.filter(task => task.status === col.status)}
              onEditTask={handleOpenTaskForm}
              onDeleteTask={handleDeleteTask}
              onTaskStatusChange={handleTaskStatusChange}
              onToggleTimer={handleToggleTimer}
              onTimerTick={handleTimerTick}
              onDropTask={handleTaskStatusChange} // Drag and drop directly changes status
            />
          ))}
        </div>
      </main>
      <TaskForm 
        isOpen={isTaskFormOpen} 
        onClose={handleCloseTaskForm} 
        onSubmit={handleTaskSubmit}
        existingTask={editingTask}
      />
    </div>
  );
}
