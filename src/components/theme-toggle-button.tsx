
'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Ensure the component only renders on the client after theme is determined
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a placeholder or null on the server/initial client render
    // to avoid hydration mismatch if localStorage theme differs from default
    return <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled className="h-9 w-9 md:h-10 md:w-10" />;
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="h-9 w-9 md:h-10 md:w-10">
      {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

// Need to import useState and useEffect for the mounted state
import { useState, useEffect } from 'react';
