"use client";

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onOpenTaskForm: () => void;
}

export function Header({ onOpenTaskForm }: HeaderProps) {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border bg-card shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">TaskFlow</h1>
        <Button onClick={onOpenTaskForm} aria-label="Add new task">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Task
        </Button>
      </div>
    </header>
  );
}
