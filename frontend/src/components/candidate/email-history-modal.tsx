"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { candidatesApi } from "@/lib/api-client";

interface EmailHistoryModalProps {
  candidateId: string | null;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface EmailRecord {
  id: string;
  to: string;
  subject: string;
  message: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: string;
  deliveredAt?: string;
  failureReason?: string;
  readAt?: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'sent':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'delivered':
      return <CheckCircle className="h-4 w-4 text-green-700" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-600" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    default:
      return <Mail className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'sent':
      return 'Envoyé';
    case 'delivered':
      return 'Délivré';
    case 'failed':
      return 'Échec';
    case 'pending':
      return 'En attente';
    default:
      return 'Inconnu';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'sent':
      return 'bg-green-100 text-green-800';
    case 'delivered':
      return 'bg-green-200 text-green-900';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function EmailHistoryModal({ candidateId, candidateName, isOpen, onClose }: EmailHistoryModalProps) {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmailHistory = async () => {
    if (!candidateId) return;

    setIsLoading(true);
    try {
      const response = await candidatesApi.getEmailHistory(candidateId);
      const emailsData = response.data.emails || [];

      // Convertir les données de l'API au format attendu par le composant
      const formattedEmails: EmailRecord[] = emailsData.map((email: any) => ({
        id: email.id,
        to: email.to,
        subject: email.subject,
        message: email.message,
        status: email.status,
        sentAt: email.sentAt,
        deliveredAt: email.deliveredAt,
        readAt: email.readAt,
        failureReason: email.failureReason,
      }));

      setEmails(formattedEmails);
    } catch (error) {
      console.error('Error fetching email history:', error);
      toast.error('Erreur lors du chargement de l\'historique des emails');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && candidateId) {
      fetchEmailHistory();
    }
  }, [isOpen, candidateId]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Historique des emails - {candidateName}
          </DialogTitle>
          <DialogDescription>
            Historique complet des emails envoyés à ce candidat
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
              <span className="ml-2">Chargement de l'historique...</span>
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun email envoyé à ce candidat pour le moment
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {emails.map((email, index) => (
                  <div key={email.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(email.status)}
                        <Badge className={getStatusColor(email.status)}>
                          {getStatusLabel(email.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(email.sentAt)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">À : </span>
                        <span className="text-sm">{email.to}</span>
                      </div>

                      <div>
                        <span className="text-sm font-medium">Objet : </span>
                        <span className="text-sm">{email.subject}</span>
                      </div>

                      <div>
                        <span className="text-sm font-medium">Message : </span>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                          {email.message}
                        </p>
                      </div>

                      {/* Détails supplémentaires selon le statut */}
                      {email.status === 'delivered' && email.deliveredAt && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Délivré le {formatDateTime(email.deliveredAt)}
                          {email.readAt && (
                            <span className="ml-2">
                              • Lu le {formatDateTime(email.readAt)}
                            </span>
                          )}
                        </div>
                      )}

                      {email.status === 'failed' && email.failureReason && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <XCircle className="h-3 w-3" />
                          Échec : {email.failureReason}
                        </div>
                      )}

                      {email.status === 'pending' && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <Clock className="h-3 w-3" />
                          En cours d'envoi...
                        </div>
                      )}
                    </div>

                    {index < emails.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={fetchEmailHistory}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}