"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function AuthSuccessPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds if user is authenticated
    if (!loading && user) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-md dark:bg-slate-900/80">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center animate-bounce">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Compte vérifié avec succès !
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Bienvenue dans RH Analytics Pro, {user.name} !
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  🎉 Votre email a été vérifié et votre compte est maintenant actif !
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>Vous allez être automatiquement redirigé vers votre dashboard dans quelques secondes...</p>
              </div>
            </div>

            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              Accéder au Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
              <p>Vous pouvez maintenant profiter de toutes les fonctionnalités de la plateforme</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}