"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface DailyReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportText: string;
}

export function DailyReportDialog({ isOpen, onClose, reportText }: DailyReportDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false); // Reset copied state when dialog closes
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "The daily report has been copied.",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Error copying",
        description: "Could not copy the report to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl bg-card">
        <DialogHeader>
          <DialogTitle>Daily Completed Tasks Report</DialogTitle>
          <DialogDescription>
            Here's a summary of tasks completed today. You can copy this report.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={reportText}
            readOnly
            className="h-64 text-sm font-mono bg-muted/30"
            aria-label="Daily report content"
          />
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={handleCopyToClipboard}>
            {copied ? <CheckCircle className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied!" : "Copy Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
