import { Badge } from '@/components/ui/badge';
import { CandidateSource } from '@/lib/api-client';
import { Upload, FileText } from 'lucide-react';

interface CandidateSourceBadgeProps {
  source: CandidateSource;
  className?: string;
}

export function CandidateSourceBadge({ source, className }: CandidateSourceBadgeProps) {
  const getSourceConfig = (source: CandidateSource) => {
    switch (source) {
      case CandidateSource.IMPORT:
        return {
          label: 'Importé',
          variant: 'outline' as const,
          icon: Upload,
          className: 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100'
        };
      case CandidateSource.APPLICATION:
        return {
          label: 'Postulé',
          variant: 'outline' as const,
          icon: FileText,
          className: 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100'
        };
      default:
        return {
          label: 'Inconnu',
          variant: 'secondary' as const,
          icon: FileText,
          className: ''
        };
    }
  };

  const config = getSourceConfig(source);
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`gap-1 text-xs ${config.className} ${className || ''}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}