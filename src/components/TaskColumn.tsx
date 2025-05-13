"use client";

import { type Task, type TaskStatus } from '@/lib/types';
import { TaskCard } from './TaskCard';
import { List, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onToggleTimer: (taskId: string, running: boolean) => void;
  onTimerTick: (taskId: string, currentTime: number) => void;
  onDropTask: (taskId: string, targetStatus: TaskStatus) => void;
}

const columnIcons: Record<TaskStatus, React.ElementType> = {
  todo: List,
  inprogress: TrendingUp,
  done: CheckCircle2,
};

const columnColors: Record<TaskStatus, string> = {
  todo: "text-blue-500",
  inprogress: "text-accent",
  done: "text-green-500",
}

export function TaskColumn({ 
  title, 
  status, 
  tasks, 
  onEditTask, 
  onDeleteTask, 
  onTaskStatusChange,
  onToggleTimer,
  onTimerTick,
  onDropTask 
}: TaskColumnProps) {
  const IconComponent = columnIcons[status];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  return (
    <div 
      className="flex-1 p-4 bg-card/50 rounded-lg shadow-inner min-h-[calc(100vh-200px)]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      aria-label={`${title} column`}
    >
      <div className="flex items-center mb-6 pb-2 border-b-2 border-primary/30">
        <IconComponent className={cn("h-6 w-6 mr-2", columnColors[status])} />
        <h2 className={cn("text-xl font-semibold", columnColors[status])}>{title} ({tasks.length})</h2>
      </div>
      <div className="space-y-4">
        {tasks.length === 0 && (
          <p className="text-muted-foreground text-center py-4">No tasks here yet.</p>
        )}
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onEdit={onEditTask} 
            onDelete={onDeleteTask}
            onStatusChange={onTaskStatusChange}
            onToggleTimer={onToggleTimer}
            onTimerTick={onTimerTick}
          />
        ))}
      </div>
    </div>
  );
}
