"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { NavBar } from "@/components/ui/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, Brain, Users, Mail, FileText, UserCheck, Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Import sections
import { AIConfigurationSection } from "@/components/settings/ai-configuration-section";
import { UserManagementSection } from "@/components/settings/user-management-section";
import { MailAutomationsSection } from "@/components/settings/mail-automations-section";
import { MailTemplatesSection } from "@/components/settings/mail-templates-section";
import { TeamRequestsSection } from "@/components/settings/team-requests-section";
import { SystemInfoSection } from "@/components/settings/system-info-section";
import { HelpSection } from "@/components/settings/help-section";

type TabType = "ai" | "users" | "mail" | "templates" | "teams" | "system" | "help";

const tabs: Array<{ 
  id: TabType; 
  label: string; 
  icon: React.ReactNode; 
  adminOnly?: boolean; 
  hrAccess?: boolean 
}> = [
  { id: "ai", label: "Configuration IA", icon: <Brain className="h-4 w-4" />, adminOnly: true },
  { id: "users", label: "Utilisateurs", icon: <Users className="h-4 w-4" />, hrAccess: true },
  { id: "mail", label: "Automatisations Mail", icon: <Mail className="h-4 w-4" />, hrAccess: true },
  { id: "templates", label: "Templates Mail", icon: <FileText className="h-4 w-4" />, hrAccess: true },
  { id: "teams", label: "Demandes d'équipe", icon: <UserCheck className="h-4 w-4" />, adminOnly: true },
  { id: "system", label: "Système", icon: <Info className="h-4 w-4" /> },
  { id: "help", label: "Aide", icon: <HelpCircle className="h-4 w-4" /> },
];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser, loading, isAdmin, isHR: isHRFromContext } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType | null>(null);

  const isUserAdmin = isAdmin();
  const isHR = isHRFromContext();
  const canManageUsers = isUserAdmin;
  const canViewUsers = isUserAdmin || isHR;


  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/auth/login");
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    // Only set active tab once user is loaded and not loading
    if (loading || !currentUser) return;

    const tab = searchParams.get("tab") as TabType;
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    } else {
      // Set default tab based on permissions
      if (isUserAdmin) {
        setActiveTab("ai");
      } else if (canViewUsers) {
        setActiveTab("users");
      } else {
        setActiveTab("system");
      }
    }
  }, [searchParams, isUserAdmin, canViewUsers, loading, currentUser]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`/settings?${params.toString()}`, { scroll: false });
  };

  // Filter tabs based on permissions - only after user is loaded
  const availableTabs = !loading && currentUser ? tabs.filter(tab => {
    if (tab.adminOnly && !isUserAdmin) return false;
    if (tab.hrAccess && !canViewUsers) return false;
    return true;
  }) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Chargement..." />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  // Don't render tabs until activeTab is determined
  if (activeTab === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Chargement des paramètres..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <NavBar />
      
      <div className="container mx-auto p-6 pt-24 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-muted-foreground">
              Configurez vos paramètres IA et préférences de plateforme
            </p>
          </div>
        </motion.div>

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-64 flex-shrink-0"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {availableTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            {/* AI Configuration - Admin only */}
            {activeTab === "ai" && isUserAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Configuration IA
                  </CardTitle>
                  <CardDescription>
                    Gérez vos paramètres d'intelligence artificielle (les clés API sont gérées par l'administrateur système)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AIConfigurationSection />
                </CardContent>
              </Card>
            )}

            {/* User Management */}
            {activeTab === "users" && canViewUsers && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gestion des utilisateurs
                  </CardTitle>
                  <CardDescription>
                    {canManageUsers 
                      ? "Invitez et gérez les membres de votre équipe"
                      : "Consultez les membres de votre équipe"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManagementSection 
                    canManage={canManageUsers}
                    canView={canViewUsers}
                    currentUser={currentUser}
                  />
                </CardContent>
              </Card>
            )}

            {/* Mail Automations */}
            {activeTab === "mail" && (isUserAdmin || isHR) && (
              <MailAutomationsSection 
                currentUser={currentUser} 
                isUserAdmin={isUserAdmin} 
              />
            )}

            {/* Mail Templates */}
            {activeTab === "templates" && (isUserAdmin || isHR) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Templates de Mail
                  </CardTitle>
                  <CardDescription>
                    Créez et gérez vos modèles d'emails pour les automatisations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MailTemplatesSection />
                </CardContent>
              </Card>
            )}

            {/* Team Requests - Admin only */}
            {activeTab === "teams" && isUserAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Demandes d'équipe
                  </CardTitle>
                  <CardDescription>
                    Gérez les demandes de personnes souhaitant rejoindre votre équipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TeamRequestsSection />
                </CardContent>
              </Card>
            )}

            {/* System Information */}
            {activeTab === "system" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Informations système
                  </CardTitle>
                  <CardDescription>
                    Informations sur la plateforme et votre utilisation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SystemInfoSection />
                </CardContent>
              </Card>
            )}

            {/* Help & Documentation */}
            {activeTab === "help" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Aide et Documentation
                  </CardTitle>
                  <CardDescription>
                    Guides d'utilisation et support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HelpSection />
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner className="w-8 h-8" />
          </div>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}