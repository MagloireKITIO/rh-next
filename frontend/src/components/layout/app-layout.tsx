"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { NavBar } from "@/components/ui/navbar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AppLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  variant?: "dashboard" | "landing";
  showNavbar?: boolean;
}

export function AppLayout({ 
  children, 
  requireAuth = false, 
  variant = "dashboard",
  showNavbar = true 
}: AppLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // Redirect logic based on authentication state
      if (requireAuth && !user) {
        router.push("/auth/login");
      }
    }
  }, [user, loading, router, requireAuth]);

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // If authentication is required but user is not logged in, don't render anything
  if (requireAuth && !user) {
    return null;
  }

  // Determine if we should show the navbar based on the current route
  const shouldShowNavbar = showNavbar && (
    !pathname.startsWith("/auth/") && 
    pathname !== "/"
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {shouldShowNavbar && <NavBar variant={variant} />}
      {children}
    </div>
  );
}