"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { NavBar } from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, User, Settings } from "lucide-react";
import { ProfileTab } from "@/components/profile/profile-tab";
import { SettingsTab } from "@/components/profile/settings-tab";
import { cn } from "@/lib/utils";

type TabType = "profile" | "settings";

const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
  { id: "profile", label: "Profil", icon: <User className="h-4 w-4" /> },
  { id: "settings", label: "Paramètres", icon: <Settings className="h-4 w-4" /> },
];

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const tab = searchParams.get("tab") as TabType;
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`/profile?${params.toString()}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Chargement..." />
      </div>
    );
  }

  if (!user) {
    return null;
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
            onClick={() => router.push("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mon Compte</h1>
            <p className="text-muted-foreground">
              Gérez vos informations personnelles et préférences
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
                  {tabs.map((tab) => (
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
            {activeTab === "profile" && <ProfileTab user={user} />}
            {activeTab === "settings" && <SettingsTab user={user} />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
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
      <ProfileContent />
    </Suspense>
  );
}