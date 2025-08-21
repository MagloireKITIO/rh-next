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
  navItems?: NavItem[];
  className?: string;
  variant?: "dashboard" | "landing";
}

export function NavBar({ 
  title = "RH Analytics Pro", 
  navItems,
  className,
  variant = "dashboard"
}: NavBarProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { notificationsCount } = useNotifications();

  // Default nav items based on variant and user state
  const defaultNavItems = variant === "dashboard" && user ? [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/projects", label: "Projets" },
    { href: "/settings", label: "Paramètres", id: "settings-link" },
  ] : variant === "landing" ? [
    { href: "#home", label: "Accueil" },
    { href: "#services", label: "Services" },
    { href: "#features", label: "Fonctionnalités" },
    { href: "#contact", label: "Contact" },
  ] : [];

  const finalNavItems = navItems || defaultNavItems;

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800",
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href={variant === "dashboard" ? "/landing" : "/dashboard"} 
            className="flex items-center space-x-3 hover:scale-105 transition-transform"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RH</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {finalNavItems.map((item) => {
              const isActive = pathname === item.href || item.active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={item.id}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Notifications and User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell - Only for dashboard variant and authenticated users */}
            {variant === "dashboard" && user && (
              <NotificationBell count={notificationsCount} />
            )}
            
            <div id="user-menu">
              <UserMenu 
                showMobileMenu={showMobileMenu}
                onMobileMenuToggle={toggleMobileMenu}
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              {finalNavItems.map((item) => {
                const isActive = pathname === item.href || item.active;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Mobile Notification Bell */}
              {variant === "dashboard" && user && (
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notifications</span>
                  <NotificationBell count={notificationsCount} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}