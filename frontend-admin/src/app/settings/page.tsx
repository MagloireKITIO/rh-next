'use client';

import { useState } from 'react';
import AdminLayout from '@/components/layout/admin-layout';
import ProtectedRoute from '@/components/layout/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Mail, 
  Globe, 
  Shield, 
  Database, 
  Palette,
  Bell,
  Key
} from 'lucide-react';

// Composants pour chaque onglet (on les créera progressivement)
import MailSettingsTab from '@/components/admin/settings/mail-settings-tab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('mail');

  const settingsTabs = [
    {
      id: 'mail',
      label: 'Configuration Mail',
      description: 'Serveurs et templates d\'emails',
      icon: Mail,
      component: MailSettingsTab,
      badge: null,
    },
    {
      id: 'system',
      label: 'Système',
      description: 'Paramètres système généraux',
      icon: Settings,
      component: null, // À implémenter plus tard
      badge: 'Bientôt',
    },
    {
      id: 'security',
      label: 'Sécurité',
      description: 'Configuration de la sécurité',
      icon: Shield,
      component: null, // À implémenter plus tard
      badge: 'Bientôt',
    },
    {
      id: 'integrations',
      label: 'Intégrations',
      description: 'APIs et services externes',
      icon: Globe,
      component: null, // À implémenter plus tard
      badge: 'Bientôt',
    },
    {
      id: 'database',
      label: 'Base de Données',
      description: 'Configuration de la base de données',
      icon: Database,
      component: null, // À implémenter plus tard
      badge: 'Bientôt',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Paramètres de notifications',
      icon: Bell,
      component: null, // À implémenter plus tard
      badge: 'Bientôt',
    },
    {
      id: 'appearance',
      label: 'Apparence',
      description: 'Thèmes et personnalisation',
      icon: Palette,
      component: null, // À implémenter plus tard
      badge: 'Bientôt',
    },
    {
      id: 'api-keys',
      label: 'Clés API',
      description: 'Gestion des clés d\'API système',
      icon: Key,
      component: null, // À implémenter plus tard
      badge: 'Bientôt',
    },
  ];

  const activeTabData = settingsTabs.find(tab => tab.id === activeTab);

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-admin-light to-admin-dark rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Paramètres Système</h1>
                <p className="text-sm text-muted-foreground">
                  Configuration globale de la plateforme RH Analytics Pro
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Menu */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Configuration</CardTitle>
                  <CardDescription className="text-xs">
                    Sélectionnez une catégorie
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="flex flex-col">
                    {settingsTabs.map((tab, index) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      const isDisabled = !tab.component;
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => !isDisabled && setActiveTab(tab.id)}
                          disabled={isDisabled}
                          className={`
                            flex items-center gap-3 px-4 py-3 text-left transition-colors
                            ${isActive 
                              ? 'bg-gradient-to-r from-admin-light/10 to-admin-dark/10 text-foreground border-r-2 border-admin-light' 
                              : 'text-muted-foreground hover:bg-muted/50'
                            }
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            ${index === settingsTabs.length - 1 ? '' : 'border-b border-border/50'}
                          `}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">
                                {tab.label}
                              </span>
                              {tab.badge && (
                                <Badge variant="secondary" className="text-xs ml-2">
                                  {tab.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {tab.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {activeTabData && (
                      <>
                        <activeTabData.icon className="w-5 h-5 text-admin-light" />
                        <div>
                          <CardTitle>{activeTabData.label}</CardTitle>
                          <CardDescription>{activeTabData.description}</CardDescription>
                        </div>
                        {activeTabData.badge && (
                          <Badge variant="outline" className="ml-auto">
                            {activeTabData.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Contenu dynamique basé sur l'onglet actif */}
                  {activeTabData?.component ? (
                    <activeTabData.component />
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        {activeTabData && <activeTabData.icon className="w-8 h-8 text-muted-foreground" />}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Fonctionnalité en développement</h3>
                      <p className="text-muted-foreground mb-4">
                        Cette section sera disponible dans une prochaine version.
                      </p>
                      <Badge variant="secondary">
                        À venir
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}