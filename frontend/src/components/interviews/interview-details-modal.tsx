"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUpdateInterview, useUpdateInterviewStatus, useDeleteInterview } from "@/hooks/mutations";
import { useInterviewEvaluations } from "@/hooks/queries";
import { Interview, UpdateInterviewData } from "@/lib/api-client";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  Users,
  Edit,
  Save,
  X,
  Trash2,
  ExternalLink,
  Star,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Play,
  Pause
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InterviewDetailsModalProps {
  interview: Interview | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (interview: Interview) => void;
  onDeleted?: () => void;
}

const STATUS_CONFIG = {
  scheduled: {
    label: "Programmé",
    color: "bg-blue-100 text-blue-800",
    icon: Calendar,
    actions: ['start', 'reschedule', 'cancel']
  },
  in_progress: {
    label: "En cours",
    color: "bg-green-100 text-green-800",
    icon: Play,
    actions: ['complete', 'cancel']
  },
  completed: {
    label: "Terminé",
    color: "bg-gray-100 text-gray-800",
    icon: CheckCircle,
    actions: ['reopen']
  },
  cancelled: {
    label: "Annulé",
    color: "bg-red-100 text-red-800",
    icon: X,
    actions: ['reschedule']
  },
  rescheduled: {
    label: "Reporté",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    actions: ['reschedule', 'cancel']
  }
};

const TYPE_ICONS = {
  video_call: Video,
  phone: Phone,
  in_person: MapPin
};

export function InterviewDetailsModal({
  interview,
  isOpen,
  onClose,
  onUpdated,
  onDeleted
}: InterviewDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateInterviewData>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateInterviewMutation = useUpdateInterview();
  const updateStatusMutation = useUpdateInterviewStatus();
  const deleteInterviewMutation = useDeleteInterview();

  const { data: evaluations = [] } = useInterviewEvaluations(interview?.id || "");

  useEffect(() => {
    if (interview) {
      setFormData({
        title: interview.title,
        description: interview.description,
        notes: interview.notes,
        agenda: interview.agenda,
        meeting_link: interview.meeting_link,
        location: interview.location
      });
    }
  }, [interview]);

  if (!interview) return null;

  const statusConfig = STATUS_CONFIG[interview.status];
  const TypeIcon = TYPE_ICONS[interview.type];

  const handleSave = async () => {
    try {
      const result = await updateInterviewMutation.mutateAsync({
        id: interview.id,
        data: formData
      });
      setIsEditing(false);
      onUpdated?.(result);
      toast.success("Entretien mis à jour");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  const handleStatusChange = async (newStatus: Interview['status']) => {
    try {
      const result = await updateStatusMutation.mutateAsync({
        id: interview.id,
        status: newStatus
      });
      onUpdated?.(result);
      toast.success("Statut mis à jour");
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInterviewMutation.mutateAsync(interview.id);
      onDeleted?.();
      onClose();
      toast.success("Entretien supprimé");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setShowDeleteConfirm(false);
    onClose();
  };

  const isLoading = updateInterviewMutation.isPending || updateStatusMutation.isPending || deleteInterviewMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TypeIcon className="h-5 w-5" />
              <div>
                <DialogTitle className="text-xl">
                  {isEditing ? (
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="text-xl font-semibold"
                    />
                  ) : (
                    interview.title
                  )}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <span>Entretien avec {interview.candidate?.name}</span>
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="participants">
              Participants ({interview.participants?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="evaluations">
              Évaluations ({evaluations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date et heure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(interview.scheduled_at), 'EEEE dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(interview.scheduled_at), 'HH:mm')} ({interview.duration_minutes} min)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">
                      {interview.type === 'video_call' && 'Visioconférence'}
                      {interview.type === 'phone' && 'Téléphone'}
                      {interview.type === 'in_person' && 'En présentiel'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {interview.status === 'scheduled' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={isLoading}
                      className="w-full gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Commencer l'entretien
                    </Button>
                  )}

                  {interview.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange('completed')}
                      disabled={isLoading}
                      className="w-full gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Terminer l'entretien
                    </Button>
                  )}

                  {interview.meeting_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(interview.meeting_link, '_blank')}
                      className="w-full gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Rejoindre la réunion
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isLoading}
                    className="w-full gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {(interview.description || isEditing) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={formData.description || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description de l'entretien..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {interview.description || "Aucune description"}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Agenda */}
            {(interview.agenda || isEditing) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agenda</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={formData.agenda || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
                      placeholder="Agenda de l'entretien..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {interview.agenda || "Aucun agenda défini"}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Détails techniques */}
            {(interview.meeting_link || interview.location || isEditing) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Détails techniques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interview.type === 'video_call' && (
                    <div>
                      <Label>Lien de visioconférence</Label>
                      {isEditing ? (
                        <Input
                          value={formData.meeting_link || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
                          placeholder="https://..."
                        />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={interview.meeting_link || "Non défini"}
                            readOnly
                            className="bg-muted"
                          />
                          {interview.meeting_link && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(interview.meeting_link, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {interview.type === 'in_person' && (
                    <div>
                      <Label>Lieu</Label>
                      {isEditing ? (
                        <Input
                          value={formData.location || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Adresse ou salle..."
                        />
                      ) : (
                        <Input
                          value={interview.location || "Non défini"}
                          readOnly
                          className="bg-muted mt-1"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {(interview.notes || isEditing) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes internes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={formData.notes || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notes internes..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {interview.notes || "Aucune note"}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="participants" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participants à l'entretien
                </CardTitle>
              </CardHeader>
              <CardContent>
                {interview.participants && interview.participants.length > 0 ? (
                  <div className="space-y-3">
                    {interview.participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {participant.user?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{participant.user?.name || 'Utilisateur inconnu'}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {participant.role === 'interviewer' && 'Recruteur'}
                              {participant.role === 'observer' && 'Observateur'}
                              {participant.role === 'coordinator' && 'Coordinateur'}
                            </div>
                          </div>
                        </div>
                        <Badge variant={participant.status === 'accepted' ? 'default' : 'outline'}>
                          {participant.status === 'invited' && 'Invité'}
                          {participant.status === 'accepted' && 'Accepté'}
                          {participant.status === 'declined' && 'Décliné'}
                          {participant.status === 'tentative' && 'Incertain'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun participant ajouté</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Évaluations de l'entretien
                </CardTitle>
              </CardHeader>
              <CardContent>
                {evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {evaluations.map((evaluation) => (
                      <div key={evaluation.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium">{evaluation.evaluator?.name}</div>
                          {evaluation.recommendation && (
                            <Badge variant={evaluation.recommendation === 'hire' ? 'default' : 'outline'}>
                              {evaluation.recommendation === 'hire' && 'À recruter'}
                              {evaluation.recommendation === 'strong_hire' && 'Recruter fortement'}
                              {evaluation.recommendation === 'no_hire' && 'Ne pas recruter'}
                              {evaluation.recommendation === 'strong_no_hire' && 'Rejeter fortement'}
                              {evaluation.recommendation === 'neutral' && 'Neutre'}
                            </Badge>
                          )}
                        </div>
                        {evaluation.comments && (
                          <p className="text-sm text-muted-foreground">{evaluation.comments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune évaluation pour le moment</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Ajouter une évaluation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <AnimatePresence>
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-2"
              >
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
            )}
          </AnimatePresence>
        </DialogFooter>

        {/* Dialog de confirmation de suppression */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Confirmer la suppression
              </DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer cet entretien ? Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}