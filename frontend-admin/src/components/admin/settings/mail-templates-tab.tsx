'use client';

import { useState } from 'react';
import MailTemplateList from './mail-template-list';
import MailTemplateForm from './mail-template-form';

interface MailTemplate {
  id?: string;
  type: string;
  name: string;
  description?: string;
  subject: string;
  html_content: string;
  text_content?: string;
  status: 'active' | 'draft' | 'archived';
  is_default: boolean;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export default function MailTemplatesTab() {
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [editingTemplate, setEditingTemplate] = useState<MailTemplate | null>(null);

  const handleEdit = (template: MailTemplate) => {
    setEditingTemplate(template);
    setCurrentView('form');
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setCurrentView('form');
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setCurrentView('list');
  };

  const handleSuccess = () => {
    setEditingTemplate(null);
    setCurrentView('list');
  };

  if (currentView === 'form') {
    return (
      <MailTemplateForm 
        template={editingTemplate}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <MailTemplateList 
      onEdit={handleEdit}
      onAdd={handleAdd}
    />
  );
}