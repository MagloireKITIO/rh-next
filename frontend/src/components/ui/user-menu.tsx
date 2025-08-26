"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User, Settings, LogOut, Menu, X } from "lucide-react";

interface UserMenuProps {
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
}

export function UserMenu({ showMobileMenu = false, onMobileMenuToggle }: UserMenuProps) {
  const { user, signOut, loading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // La redirection se fera automatiquement via les useEffect des pages protégées
      // car user sera null après signOut
    } catch (error) {
      // Error is handled in the context
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleProfile = () => {
    router.push("/profile?tab=profile");
  };

  const handleSettings = () => {
    router.push("/profile?tab=settings");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle for guests */}
        {onMobileMenuToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMobileMenuToggle}
            className="md:hidden text-white hover:text-indigo-400 hover:bg-white/10"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        )}
        
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/auth/login")}
            className="text-white hover:text-indigo-400 hover:bg-white/10"
          >
            Se connecter
          </Button>
          <Button
            size="sm"
            onClick={() => router.push("/auth/signup")}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            S'inscrire
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Mobile menu toggle (only show on mobile) */}
      {onMobileMenuToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuToggle}
          className="md:hidden text-slate-700 dark:text-slate-300"
        >
          {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      )}

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full ring-2 ring-slate-200 dark:ring-slate-700 hover:ring-indigo-400 dark:hover:ring-indigo-500 transition-all"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-sm">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent
          className="w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-slate-200 dark:border-slate-700"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-slate-900 dark:text-slate-100">
                {user.name}
              </p>
              <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
          
          <DropdownMenuItem
            onClick={handleProfile}
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profil</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={handleSettings}
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
          
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
          >
            {isSigningOut ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            <span>{isSigningOut ? "Déconnexion..." : "Se déconnecter"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}