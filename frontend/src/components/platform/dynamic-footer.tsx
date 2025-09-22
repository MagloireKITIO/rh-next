'use client';

import { usePageSettings } from '@/hooks/use-platform-settings';

interface DynamicFooterProps {
  pageName: string;
  className?: string;
}

export function DynamicFooter({ pageName, className = '' }: DynamicFooterProps) {
  const { footer } = usePageSettings(pageName);

  if (!footer.enabled || !footer.content) {
    return null;
  }

  return (
    <div
      className={`dynamic-footer ${className}`}
      dangerouslySetInnerHTML={{ __html: footer.content }}
    />
  );
}