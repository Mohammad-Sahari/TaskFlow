export type TaskStatus = 'todo' | 'inprogress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;

  // Timer-specific fields
  elapsedTime: number; // Accumulated seconds from previous sessions in 'inprogress'
  timerStartTime: number | null; // Timestamp (ms) when current 'inprogress' session timer started
  isTimerRunning: boolean; // Is the timer currently ticking for this task in 'inprogress'
  
  totalTimeLogged: number | null; // Final time logged in seconds when moved to 'done'
}

export interface AISuggestion {
  id: string;
  text: string;
}
