'use client';

import { useState } from 'react';
import MailConfigList from './mail-config-list';
import MailConfigForm from './mail-config-form';

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

  if (currentView === 'form') {
    return (
      <MailConfigForm 
        config={editingConfig}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <MailConfigList 
      onEdit={handleEdit}
      onAdd={handleAdd}
    />
  );
}