"use client";

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { TaskColumn } from '@/components/TaskColumn';
import { TaskForm } from '@/components/TaskForm';
import { DailyReportDialog } from '@/components/DailyReportDialog'; // New Import
import { type Task, type TaskStatus } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { type z } from "zod";
import { type taskFormSchema } from "@/components/TaskForm";
import { formatTime } from '@/lib/utils'; // Import formatTime

type TaskFormValues = z.infer<ReturnType<() => typeof taskFormSchema>>;

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toast } = useToast();

  // State for Daily Report Dialog
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [dailyReportText, setDailyReportText] = useState("");

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
        setTasks([]);
      }
    } else {
       if(tasks.length === 0) {
        setTasks([
          { id: crypto.randomUUID(), title: "Welcome to TaskFlow!", description: "Drag this task or create new ones.", status: "todo", createdAt: new Date(), updatedAt: new Date(), elapsedTime: 0, timerStartTime: null, isTimerRunning: false, totalTimeLogged: null },
          { id: crypto.randomUUID(), title: "Explore Features", description: "Try editing, deleting, and moving tasks. Tasks in 'In Progress' have a timer!", status: "todo", createdAt: new Date(), updatedAt: new Date(), elapsedTime: 0, timerStartTime: null, isTimerRunning: false, totalTimeLogged: null },
        ]);
       }
    }
  }, []);

  useEffect(() => {
    if(tasks.length > 0 || localStorage.getItem('taskflow-tasks')) {
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
        description: values.description || "",
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

    if (task.status === 'inprogress' && newStatus !== 'inprogress') {
      if (task.isTimerRunning && task.timerStartTime) {
        const sessionDuration = (Date.now() - task.timerStartTime) / 1000;
        updates.elapsedTime = task.elapsedTime + sessionDuration;
      }
      updates.isTimerRunning = false;
      updates.timerStartTime = null;
    }

    if (newStatus === 'inprogress' && task.status !== 'inprogress') {
      updates.isTimerRunning = true;
      updates.timerStartTime = Date.now();
    }
    
    if (newStatus === 'done') {
      const finalElapsedTime = updates.elapsedTime !== undefined ? updates.elapsedTime : task.elapsedTime;
      updates.totalTimeLogged = finalElapsedTime;
      updates.isTimerRunning = false;
      updates.timerStartTime = null;
      // Ensure updatedAt reflects completion time
      updates.updatedAt = new Date(); 
    }
    
    updateTaskTimerState(taskId, updates);
    toast({ title: "Task Status Changed", description: `"${task.title}" moved to ${newStatus}.` });
  };

  const handleToggleTimer = (taskId: string, shouldRun: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'inprogress') return;

    let updates: Partial<Task>;
    if (shouldRun) {
      updates = {
        isTimerRunning: true,
        timerStartTime: Date.now(),
      };
    } else {
      const sessionDuration = task.timerStartTime ? (Date.now() - task.timerStartTime) / 1000 : 0;
      updates = {
        isTimerRunning: false,
        timerStartTime: null,
        elapsedTime: task.elapsedTime + sessionDuration,
      };
    }
    updateTaskTimerState(taskId, updates);
  };
  
  const handleTimerTick = useCallback((taskId: string, currentTime: number) => {
    // console.log(`Task ${taskId} ticked: ${currentTime}`);
  }, []);

  const handleOpenDailyReportDialog = () => {
    const today = new Date();
    const reportDate = today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const completedTodayTasks = tasks.filter(task => {
      const completedDate = new Date(task.updatedAt); // Using updatedAt as completion timestamp
      return task.status === 'done' && 
             task.totalTimeLogged !== null &&
             completedDate >= startOfToday && 
             completedDate <= endOfToday;
    });

    let report = `Daily Task Report - ${reportDate}\n`;
    report += "===================================\n\n";

    if (completedTodayTasks.length === 0) {
      report += "No tasks completed today.\n";
    } else {
      let totalTimeOverall = 0;
      completedTodayTasks.forEach(task => {
        report += `Task: ${task.title}\n`;
        if (task.description) {
          report += `Description: ${task.description}\n`;
        }
        report += `Time Taken: ${formatTime(task.totalTimeLogged!)}\n`;
        report += "-----------------------------------\n";
        totalTimeOverall += task.totalTimeLogged!;
      });
      report += `\nTotal tasks completed today: ${completedTodayTasks.length}\n`;
      report += `Total time logged today: ${formatTime(totalTimeOverall)}\n`;
    }
    
    setDailyReportText(report);
    setIsReportDialogOpen(true);
  };

  const taskColumns: { title: string; status: TaskStatus }[] = [
    { title: 'To Do', status: 'todo' },
    { title: 'In Progress', status: 'inprogress' },
    { title: 'Done', status: 'done' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        onOpenTaskForm={() => handleOpenTaskForm()}
        onOpenDailyReportDialog={handleOpenDailyReportDialog} 
      />
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
              onDropTask={handleTaskStatusChange}
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
      <DailyReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        reportText={dailyReportText}
      />
    </div>
  );
}
