import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';

export function ThemeToggle({ className }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gustalya-theme') || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
    
    localStorage.setItem('gustalya-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "relative flex items-center justify-center rounded-xl p-2.5 transition-all duration-300",
        "bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20",
        "border border-black/5 dark:border-white/10",
        "shadow-sm hover:shadow-md",
        "group",
        className
      )}
      title={`Thème: ${theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Système'}`}
      data-testid="button-theme-toggle"
    >
      <div className="relative h-5 w-5">
        <Sun 
          size={20} 
          className={cn(
            "absolute inset-0 transition-all duration-300",
            theme === 'light' 
              ? "rotate-0 scale-100 opacity-100 text-amber-500" 
              : "rotate-90 scale-0 opacity-0"
          )} 
        />
        <Moon 
          size={20} 
          className={cn(
            "absolute inset-0 transition-all duration-300",
            theme === 'dark' 
              ? "rotate-0 scale-100 opacity-100 text-indigo-400" 
              : "-rotate-90 scale-0 opacity-0"
          )} 
        />
        <Monitor 
          size={20} 
          className={cn(
            "absolute inset-0 transition-all duration-300",
            theme === 'system' 
              ? "rotate-0 scale-100 opacity-100 text-emerald-500" 
              : "rotate-90 scale-0 opacity-0"
          )} 
        />
      </div>
    </button>
  );
}
