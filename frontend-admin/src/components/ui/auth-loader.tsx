"use client";

import { LoadingSpinner } from "./loading-spinner";

interface AuthLoaderProps {
  message?: string;
  submessage?: string;
}

export function AuthLoader({ 
  message = "Chargement...", 
  submessage 
}: AuthLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-2xl">RH</span>
        </div>
        
        <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
        
        <h1 className="text-xl font-semibold text-foreground mb-2">
          {message}
        </h1>
        
        {submessage && (
          <p className="text-muted-foreground max-w-md mx-auto">
            {submessage}
          </p>
        )}
        
        <div className="flex items-center gap-2 justify-center mt-6">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
        </div>
      </div>
    </div>
  );
}