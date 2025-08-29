'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Server, FileText } from 'lucide-react';
import MailConfigList from './mail-config-list';
import MailConfigForm from './mail-config-form';
import MailTemplatesTab from './mail-templates-tab';

interface MailConfig {
  id?: string;
  provider_type: 'smtp' | 'sendgrid' | 'mailgun' | 'aws_ses' | 'supabase';
  company_id?: string;
  company?: { name: string };
  from_email: string;
  from_name: string;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function MailSettingsTab() {
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [editingConfig, setEditingConfig] = useState<MailConfig | null>(null);
  const [activeTab, setActiveTab] = useState('configurations');

  const handleEdit = (config: MailConfig) => {
    setEditingConfig(config);
    setCurrentView('form');
  };

  const handleAdd = () => {
    setEditingConfig(null);
    setCurrentView('form');
  };

  const handleCancel = () => {
    setEditingConfig(null);
    setCurrentView('list');
  };

  const handleSuccess = () => {
    setEditingConfig(null);
    setCurrentView('list');
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configurations" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Serveurs Mail
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-0">
          <Card>
            <CardContent className="p-6">
              {currentView === 'form' ? (
                <MailConfigForm 
                  config={editingConfig}
                  onCancel={handleCancel}
                  onSuccess={handleSuccess}
                />
              ) : (
                <MailConfigList 
                  onEdit={handleEdit}
                  onAdd={handleAdd}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-0">
          <Card>
            <CardContent className="p-6">
              <MailTemplatesTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}