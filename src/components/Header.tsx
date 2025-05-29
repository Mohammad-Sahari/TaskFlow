
"use client";

import { PlusCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

interface HeaderProps {
  onOpenTaskForm: () => void;
  onOpenDailyReportDialog: () => void;
}

export function Header({ onOpenTaskForm, onOpenDailyReportDialog }: HeaderProps) {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border bg-card shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">TaskFlow</h1>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={onOpenDailyReportDialog} 
            variant="outline"
            aria-label="Export daily report"
            className="hidden sm:inline-flex"
          >
            <FileText className="mr-2 h-5 w-5" />
            Daily Report
          </Button>
           <Button 
            onClick={onOpenDailyReportDialog} 
            variant="outline"
            size="icon"
            aria-label="Export daily report"
            className="sm:hidden"
          >
            <FileText className="h-5 w-5" />
          </Button>
          <ThemeToggleButton />
          <Button onClick={onOpenTaskForm} aria-label="Add new task">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Task
          </Button>
        </div>
      </div>
    </header>
  );
}
