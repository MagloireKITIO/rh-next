"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { authApi } from "@/lib/api-client";
import { Building, User } from "lucide-react";

export default function CompleteCompanyPage() {
  const [companyName, setCompanyName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if this is a company signup flow
    const isCompanySignup = localStorage.getItem('google_company_signup');
    if (!isCompanySignup) {
      router.push('/dashboard');
      return;
    }

    // If user is already logged in and has a company, redirect
    if (!loading && user?.company) {
      localStorage.removeItem('google_company_signup');
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      alert("Le nom de l'entreprise est requis");
      return;
    }

    if (!companyDomain.trim()) {
      alert("Le domaine de l'entreprise est requis");
      return;
    }

    setIsLoading(true);
    
    try {
      // Call API to complete company setup
      await authApi.completeCompanyGoogle({
        companyName,
        companyDomain,
      });

      localStorage.removeItem('google_company_signup');
      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la création de l\'entreprise');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 p-4">
      <div className="relative w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-md dark:bg-slate-900/80">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Complétez votre entreprise
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Quelques informations supplémentaires pour créer votre entreprise
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {user && (
              <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Connecté en tant que :
                </p>
                <div className="flex items-center justify-center space-x-2">
                  {user.avatar_url && (
                    <img src={user.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full" />
                  )}
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {user.name} ({user.email})
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-sm font-medium">
                  Nom de l'entreprise
                </Label>
                <div className="relative">
                  <Input
                    id="company-name"
                    type="text"
                    placeholder="Mon Entreprise"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="h-11 pl-10"
                    disabled={isLoading}
                  />
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-domain" className="text-sm font-medium">
                  Domaine de l'entreprise
                </Label>
                <Input
                  id="company-domain"
                  type="text"
                  placeholder="mon-entreprise.com"
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  required
                  className="h-11"
                  disabled={isLoading}
                />
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Création...
                  </>
                ) : (
                  "Créer l'entreprise"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}