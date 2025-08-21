'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Check, X, Users, Calendar, Mail, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { teamRequestsApi } from '@/lib/api-client';
import { useNotifications } from '@/hooks/use-notifications';

interface TeamRequest {
  id: string;
  requester_email: string;
  requester_name: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at?: string;
  processedBy?: {
    id: string;
    name: string;
  };
  rejection_reason?: string;
}

interface TeamRequestsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamRequestsModal({ open, onOpenChange }: TeamRequestsModalProps) {
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TeamRequest | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');
  
  const { refreshNotifications } = useNotifications();

  useEffect(() => {
    if (open) {
      fetchRequests();
    }
  }, [open]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await teamRequestsApi.getAll();
      setRequests(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      if (action === 'approve') {
        await teamRequestsApi.approve(selectedRequest.id);
        toast.success('Demande approuvée ! Un email d\'invitation a été envoyé à ' + selectedRequest.requester_email);
      } else {
        await teamRequestsApi.reject(selectedRequest.id, rejectionReason);
        toast.success('Demande rejetée');
      }
      await fetchRequests();
      refreshNotifications(); // Mettre à jour le compteur de notifications
      setShowProcessDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du traitement de la demande');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;

    try {
      await teamRequestsApi.delete(requestId);
      toast.success('Demande supprimée');
      await fetchRequests();
      refreshNotifications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const openProcessDialog = (request: TeamRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setProcessingAction(action);
    setShowProcessDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');
  const currentRequests = activeTab === 'pending' ? pendingRequests : processedRequests;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Demandes d'équipe
            </DialogTitle>
            <DialogDescription>
              Gérez les demandes d'accès à votre équipe
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                En attente ({pendingRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('processed')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'processed'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Traitées ({processedRequests.length})
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : currentRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {activeTab === 'pending' 
                    ? 'Aucune demande en attente'
                    : 'Aucune demande traitée'
                  }
                </div>
              ) : (
                currentRequests.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{request.requester_name}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusText(request.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {request.requester_email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        
                        {request.message && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                              <MessageSquare className="w-4 h-4" />
                              Message
                            </div>
                            <p className="text-sm text-gray-700">{request.message}</p>
                          </div>
                        )}

                        {request.rejection_reason && (
                          <div className="bg-red-50 p-3 rounded-lg mb-3">
                            <div className="text-sm font-medium text-red-700 mb-1">
                              Raison du rejet
                            </div>
                            <p className="text-sm text-red-700">{request.rejection_reason}</p>
                          </div>
                        )}

                        {request.processedBy && (
                          <p className="text-sm text-gray-600">
                            Traité par : {request.processedBy.name}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {request.status === 'pending' ? (
                          <>
                            <Button
                              onClick={() => openProcessDialog(request, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => openProcessDialog(request, 'reject')}
                              variant="destructive"
                              size="sm"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleDeleteRequest(request.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de traitement */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processingAction === 'approve' ? 'Approuver' : 'Rejeter'} la demande
            </DialogTitle>
            <DialogDescription>
              Demande de : {selectedRequest?.requester_name} ({selectedRequest?.requester_email})
            </DialogDescription>
          </DialogHeader>
          
          {processingAction === 'approve' ? (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                En approuvant cette demande, un compte sera automatiquement créé pour cet utilisateur 
                avec le rôle HR. Il recevra un email d'invitation pour compléter son inscription.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Raison du rejet (optionnel)</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Expliquez pourquoi cette demande est rejetée..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowProcessDialog(false);
                setRejectionReason('');
              }}
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button 
              onClick={() => handleProcessRequest(processingAction!)}
              disabled={isProcessing}
              variant={processingAction === 'approve' ? 'default' : 'destructive'}
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isProcessing ? 'Traitement...' : (processingAction === 'approve' ? 'Approuver' : 'Rejeter')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}