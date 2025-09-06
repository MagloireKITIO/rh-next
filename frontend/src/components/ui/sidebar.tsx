"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard,
  FolderOpen,
  Briefcase,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { 
      href: "/dashboard", 
      label: "Tableau de bord", 
      icon: LayoutDashboard 
    },
    { 
      href: "/projects", 
      label: "Projets de recrutement", 
      icon: FolderOpen 
    },
    { 
      href: "/jobs", 
      label: "Offres d'emploi", 
      icon: Briefcase 
    },
    { 
      href: "/candidates", 
      label: "Candidats", 
      icon: Users 
    },
    { 
      href: "/reports", 
      label: "Rapports", 
      icon: BarChart3 
    },
    { 
      href: "/settings", 
      label: "Paramètres", 
      icon: Settings,
      id: "settings-link" 
    },
  ];

  if (!user) return null;

  return (
    <aside className={cn(
      "fixed left-0 top-24 z-30 h-[calc(100vh-6rem)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ATS</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Professional
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isJobsLink = item.href === "/jobs";
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              target={isJobsLink ? "_blank" : undefined}
              rel={isJobsLink ? "noopener noreferrer" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5", collapsed ? "h-7 w-7" : "")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Info at Bottom */}
      {!collapsed && user && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}