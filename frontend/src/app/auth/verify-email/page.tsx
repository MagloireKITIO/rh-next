"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

function VerifyEmailContent() {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle email verification if token is present
  useEffect(() => {
    if (token && !isVerifying) {
      handleVerifyEmail(token);
    }
  }, [token]);

  const handleVerifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    try {
      const response = await apiClient.post('/auth/verify-email', {
        token: verificationToken
      });
      
      toast.success('Email vérifié avec succès ! Vous pouvez maintenant vous connecter.');
      router.push('/auth/login');
    } catch (error: any) {
      toast.error('Erreur lors de la vérification : ' + (error.response?.data?.message || error.message));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      await apiClient.post('/auth/resend-verification', {
        email: email
      });
      
      toast.success("Email de vérification renvoyé avec succès !");
      setResendCooldown(60); // 60 seconds cooldown
    } catch (error: any) {
      toast.error("Erreur lors du renvoi de l'email : " + (error.response?.data?.message || error.message));
    } finally {
      setIsResending(false);
    }
  };

  if (loading || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner className="w-8 h-8 mx-auto" />
          {isVerifying && (
            <p className="text-slate-600 dark:text-slate-400">
              Vérification de votre email en cours...
            </p>
          )}
        </div>
      </div>
    );
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
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Vérifiez votre email
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Nous avons envoyé un lien de vérification à votre adresse email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {email && (
              <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Email envoyé à :
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100 break-all">
                  {email}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Cliquez sur le lien dans l'email pour activer votre compte</span>
              </div>
              
              <div className="flex items-start space-x-3 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Vérifiez vos spams si vous ne voyez pas l'email</span>
              </div>
              
              <div className="flex items-start space-x-3 text-sm text-slate-600 dark:text-slate-400">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>L'email peut prendre quelques minutes à arriver</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0 || !email}
                variant="outline"
                className="w-full"
              >
                {isResending ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Envoi en cours...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renvoyer dans {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renvoyer l'email
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                asChild
                className="w-full"
              >
                <Link href="/auth/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Link>
              </Button>
            </div>

            <div className="text-center text-sm text-slate-600 dark:text-slate-400">
              <p>
                Déjà vérifié ?{" "}
                <Link 
                  href="/auth/login" 
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Se connecter
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Chargement...
          </p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}