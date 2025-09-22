'use client';

import { usePageSettings } from '@/hooks/use-platform-settings';

interface DynamicHeaderProps {
  pageName: string;
  className?: string;
}

export function DynamicHeader({ pageName, className = '' }: DynamicHeaderProps) {
  const { header } = usePageSettings(pageName);

  if (!header.enabled || !header.content) {
    return null;
  }

  return (
    <div
      className={`dynamic-header ${className}`}
      dangerouslySetInnerHTML={{ __html: header.content }}
    />
  );
}