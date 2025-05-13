"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, Play, Pause, Clock } from 'lucide-react';
import { type Task, type TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onToggleTimer: (taskId: string, running: boolean) => void;
  onTimerTick: (taskId: string, currentTime: number) => void; // For parent to potentially sync if needed
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`); // Show minutes if hours are shown or if minutes > 0
  parts.push(`${seconds}s`);
  
  return parts.join(' ');
}


export function TaskCard({ task, onEdit, onDelete, onStatusChange, onToggleTimer, onTimerTick }: TaskCardProps) {
  const [displayTime, setDisplayTime] = useState(task.elapsedTime);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (task.status === 'inprogress' && task.isTimerRunning && task.timerStartTime !== null) {
      const updateDisplayTime = () => {
        const now = Date.now();
        const currentSessionDuration = (now - (task.timerStartTime ?? now)) / 1000;
        const newTotalTime = task.elapsedTime + currentSessionDuration;
        setDisplayTime(newTotalTime);
        onTimerTick(task.id, newTotalTime); // Notify parent of time update
      };
      
      updateDisplayTime(); // Initial update
      intervalId = setInterval(updateDisplayTime, 1000);
    } else {
      setDisplayTime(task.elapsedTime); // Show accumulated time if paused or not in progress
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [task.status, task.isTimerRunning, task.timerStartTime, task.elapsedTime, task.id, onTimerTick]);


  const handleCheckboxChange = (checked: boolean) => {
    onStatusChange(task.id, checked ? 'done' : 'todo');
  };

  const cardBorderColor = task.status === 'inprogress' ? 'border-accent' : task.status === 'done' ? 'border-green-500' : 'border-border';

  return (
    <Card 
      className={cn("mb-4 shadow-md hover:shadow-lg transition-shadow duration-200", cardBorderColor)}
      data-task-id={task.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold break-words">{task.title}</CardTitle>
          <Checkbox
            id={`task-${task.id}-checkbox`}
            checked={task.status === 'done'}
            onCheckedChange={handleCheckboxChange}
            aria-label={task.status === 'done' ? "Mark task as not done" : "Mark task as done"}
          />
        </div>
        {task.description && (
          <CardDescription className="text-sm text-muted-foreground pt-1 break-words">{task.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pb-4">
        {task.status === 'inprogress' && (
          <div className="flex items-center space-x-2 text-accent">
            <Clock className="h-5 w-5" />
            <span className="font-mono text-sm" aria-label="Current time spent">{formatTime(displayTime)}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleTimer(task.id, !task.isTimerRunning)}
              aria-label={task.isTimerRunning ? "Pause timer" : "Start timer"}
              className="h-7 w-7 text-accent hover:bg-accent/10"
            >
              {task.isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        )}
        {task.status === 'done' && task.totalTimeLogged !== null && (
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium" aria-label="Total time logged">Total time: {formatTime(task.totalTimeLogged)}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(task)} aria-label={`Edit task: ${task.title}`}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(task.id)} aria-label={`Delete task: ${task.title}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
