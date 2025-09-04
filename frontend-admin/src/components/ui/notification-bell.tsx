"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { NotificationsDropdown } from "./notifications-dropdown";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  count: number;
  className?: string;
}

export function NotificationBell({ count, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // Fermer le dropdown avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={cn(
          "relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
          isOpen && "bg-slate-100 dark:bg-slate-800",
          className
        )}
        title={`${count} notification${count !== 1 ? 's' : ''} en attente`}
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <NotificationsDropdown 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </div>
  );
}