"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Task } from "@/lib/types";
import { getAISuggestions } from "@/app/actions";
import { Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const taskFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }).max(100, { message: "Title must be 100 characters or less." }),
  description: z.string().max(500, { message: "Description must be 500 characters or less." }).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues, existingTask?: Task) => void;
  existingTask?: Task | null;
}

export function TaskForm({ isOpen, onClose, onSubmit, existingTask }: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: existingTask ? { title: existingTask.title, description: existingTask.description } : { title: "", description: "" },
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (existingTask) {
      form.reset({ title: existingTask.title, description: existingTask.description || "" });
    } else {
      form.reset({ title: "", description: "" });
    }
    setSuggestions([]); // Clear suggestions when form opens/closes or task changes
  }, [isOpen, existingTask, form]);

  const fetchSuggestions = useCallback(async (title: string, description: string) => {
    if (title.trim().length < 3 && (description || "").trim().length < 3) { // Only fetch if there's enough content
      setSuggestions([]);
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      const newSuggestions = await getAISuggestions({ title, description: description || "" });
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      toast({
        title: "Error",
        description: "Could not fetch AI suggestions.",
        variant: "destructive",
      });
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [toast]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "title" || name === "description") {
        const currentTitle = value.title || "";
        const currentDescription = value.description || "";
        // Basic debounce
        const handler = setTimeout(() => {
          if (currentTitle.length > 2 || currentDescription.length > 2) {
            fetchSuggestions(currentTitle, currentDescription);
          } else {
            setSuggestions([]);
          }
        }, 500);
        return () => clearTimeout(handler);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, fetchSuggestions]);


  const handleFormSubmit = (values: TaskFormValues) => {
    onSubmit(values, existingTask || undefined);
    form.reset();
    onClose();
  };
  
  const applySuggestion = (suggestionText: string) => {
    form.setValue("title", suggestionText);
    setSuggestions([]); // Clear suggestions after applying one
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle>{existingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
          <DialogDescription>
            {existingTask ? "Update the details of your task." : "Fill in the details for your new task."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Plan team meeting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add more details about the task..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isLoadingSuggestions && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading suggestions...
              </div>
            )}
            
            {suggestions.length > 0 && !isLoadingSuggestions && (
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-medium flex items-center">
                  <Lightbulb className="mr-2 h-4 w-4 text-accent" />
                  AI Suggestions:
                </h4>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applySuggestion(suggestion)}
                        className="text-left w-full justify-start text-primary hover:bg-primary/10"
                      >
                        {suggestion}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{existingTask ? "Save Changes" : "Create Task"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
