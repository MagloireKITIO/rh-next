"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { UserMenu } from "./user-menu";
import { Button } from "./button";
import { NotificationBell } from "./notification-bell";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  active?: boolean;
  id?: string;
}

interface NavBarProps {
  title?: string;
  className?: string;
  variant?: "dashboard" | "landing";
  withSidebar?: boolean;
}

export function NavBar({ 
  title = "ATS Professional", 
  className,
  variant = "dashboard",
  withSidebar = false
}: NavBarProps) {
  const { user } = useAuth();
  const { notificationsCount } = useNotifications();

  return (
    <nav className={cn(
      "fixed top-0 z-40 w-full",
      variant === "landing" 
        ? "py-8 bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-sm border-b-0" 
        : "py-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800",
      withSidebar && variant === "dashboard" && "pl-64", // Add left padding when sidebar is present
      className
    )}>
      <div className={cn(
        "px-6",
        withSidebar && variant === "dashboard" ? "ml-0" : "container mx-auto"
      )}>
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Only show when not using sidebar */}
          {!withSidebar && (
            <Link 
              href="/dashboard"
              className="flex items-center space-x-3 hover:scale-105 transition-transform"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ATS</span>
              </div>
              <span className={cn(
                "font-bold text-lg",
                variant === "landing" 
                  ? "text-white" 
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              )}>
                {title}
              </span>
            </Link>
          )}

          {/* Spacer when using sidebar */}
          {withSidebar && <div />}

          {/* Right side: Notifications and User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell - Only for dashboard variant and authenticated users */}
            {variant === "dashboard" && user && (
              <NotificationBell count={notificationsCount} />
            )}
            
            <div id="user-menu">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}