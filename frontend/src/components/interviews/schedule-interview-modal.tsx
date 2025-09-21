"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateInterview } from "@/hooks/mutations";
import { useCompanyUsers } from "@/hooks/queries";
import { Candidate, CreateInterviewData } from "@/lib/api-client";
import { Calendar, Clock, Video, Phone, MapPin, Users, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface ScheduleInterviewModalProps {
  candidate: Candidate | null;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: (interview: any) => void;
}

interface InterviewParticipant {
  user_id: string;
  role: 'interviewer' | 'observer' | 'coordinator';
  is_required: boolean;
  notes?: string;
}

const INTERVIEW_TYPES = [
  { value: 'video_call', label: 'Visioconférence', icon: Video },
  { value: 'phone', label: 'Téléphone', icon: Phone },
  { value: 'in_person', label: 'En présentiel', icon: MapPin },
] as const;

const DURATIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 heure' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2 heures' },
];

// Les utilisateurs sont maintenant récupérés via l'API

export function ScheduleInterviewModal({
  candidate,
  projectId,
  isOpen,
  onClose,
  onScheduled
}: ScheduleInterviewModalProps) {
  const [formData, setFormData] = useState<CreateInterviewData>({
    title: "",
    description: "",
    scheduled_at: new Date(),
    duration_minutes: 60,
    type: 'video_call',
    meeting_link: "",
    location: "",
    notes: "",
    agenda: "",
    candidate_id: "",
    project_id: projectId,
    participants: []
  });

  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");

  const createInterviewMutation = useCreateInterview();

  // Récupérer les utilisateurs de la compagnie
  const { data: companyUsers = [], isLoading: usersLoading } = useCompanyUsers();

  // Pré-remplir les données quand le candidat change
  useEffect(() => {
    if (candidate && isOpen) {
      const tomorrow = addDays(new Date(), 1);
      const defaultTime = "14:00";

      setFormData(prev => ({
        ...prev,
        title: `Entretien avec ${candidate.name}`,
        candidate_id: candidate.id,
        scheduled_at: new Date(`${format(tomorrow, 'yyyy-MM-dd')}T${defaultTime}:00`)
      }));

      setDateInput(format(tomorrow, 'yyyy-MM-dd'));
      setTimeInput(defaultTime);
      setSelectedParticipants([]);
    }
  }, [candidate, isOpen, projectId]);

  const handleClose = () => {
    onClose();
    // Reset form après un délai pour éviter les glitches visuels
    setTimeout(() => {
      setFormData({
        title: "",
        description: "",
        scheduled_at: new Date(),
        duration_minutes: 60,
        type: 'video_call',
        meeting_link: "",
        location: "",
        notes: "",
        agenda: "",
        candidate_id: "",
        project_id: projectId,
        participants: []
      });
      setSelectedParticipants([]);
      setDateInput("");
      setTimeInput("");
    }, 200);
  };

  const handleDateTimeChange = (date: string, time: string) => {
    if (date && time) {
      const scheduledAt = new Date(`${date}T${time}:00`);
      setFormData(prev => ({ ...prev, scheduled_at: scheduledAt }));
    }
  };

  const handleParticipantToggle = (userId: string) => {
    setSelectedParticipants(prev => {
      const updated = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];

      // Mettre à jour les participants dans formData
      const participants: InterviewParticipant[] = updated.map(id => ({
        user_id: id,
        role: 'interviewer',
        is_required: true
      }));

      setFormData(prev => ({ ...prev, participants }));
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!candidate) {
      toast.error("Aucun candidat sélectionné");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (formData.scheduled_at < new Date()) {
      toast.error("La date ne peut pas être dans le passé");
      return;
    }

    try {
      const result = await createInterviewMutation.mutateAsync(formData);
      onScheduled?.(result);
      handleClose();
      toast.success("Entretien planifié avec succès");
    } catch (error) {
      console.error("Erreur lors de la planification:", error);
    }
  };

  const isSubmitting = createInterviewMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planifier un entretien
          </DialogTitle>
          <DialogDescription>
            {candidate ? (
              <>Planifiez un entretien avec <strong>{candidate.name}</strong></>
            ) : (
              "Planifiez un nouvel entretien"
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de l'entretien *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Entretien technique senior developer"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description optionnelle de l'entretien..."
                rows={3}
              />
            </div>
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={dateInput}
                onChange={(e) => {
                  setDateInput(e.target.value);
                  handleDateTimeChange(e.target.value, timeInput);
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Heure *</Label>
              <Input
                id="time"
                type="time"
                value={timeInput}
                onChange={(e) => {
                  setTimeInput(e.target.value);
                  handleDateTimeChange(dateInput, e.target.value);
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Durée</Label>
              <Select
                value={(formData.duration_minutes || 60).toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(duration => (
                    <SelectItem key={duration.value} value={duration.value.toString()}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type d'entretien */}
          <div>
            <Label>Type d'entretien *</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {INTERVIEW_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;

                return (
                  <motion.div
                    key={type.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className="w-full h-auto p-4 flex flex-col gap-2"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{type.label}</span>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Détails selon le type */}
          {formData.type === 'video_call' && (
            <div>
              <Label htmlFor="meeting_link">Lien de visioconférence</Label>
              <Input
                id="meeting_link"
                value={formData.meeting_link}
                onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
                placeholder="https://meet.google.com/... ou sera généré automatiquement"
              />
            </div>
          )}

          {formData.type === 'in_person' && (
            <div>
              <Label htmlFor="location">Lieu de l'entretien</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Adresse ou salle de réunion"
              />
            </div>
          )}

          {/* Participants */}
          <div>
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants ({selectedParticipants.length})
            </Label>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {usersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" text="Chargement des utilisateurs..." />
                </div>
              ) : companyUsers.length > 0 ? (
                companyUsers.map(user => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedParticipants.includes(user.id)}
                      onCheckedChange={() => handleParticipantToggle(user.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun utilisateur disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Agenda */}
          <div>
            <Label htmlFor="agenda">Agenda de l'entretien</Label>
            <Textarea
              id="agenda"
              value={formData.agenda}
              onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
              placeholder="Ex: Présentation (10min), Questions techniques (30min), Questions candidat (20min)"
              rows={3}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes visibles uniquement par l'équipe..."
              rows={2}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title.trim()}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                Planification...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                Planifier l'entretien
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}