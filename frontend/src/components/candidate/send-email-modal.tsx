"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Candidate } from "@/lib/api-client";
import { Mail, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

interface SendEmailModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: EmailData) => Promise<void>;
}

export interface EmailData {
  to: string;
  subject: string;
  message: string;
  attachments: File[];
}

export function SendEmailModal({ candidate, isOpen, onClose, onSend }: SendEmailModalProps) {
  const [emailData, setEmailData] = useState<EmailData>({
    to: "",
    subject: "",
    message: "",
    attachments: []
  });
  const [isSending, setIsSending] = useState(false);

  // Pré-remplir les données quand le candidat change
  React.useEffect(() => {
    if (candidate && isOpen) {
      setEmailData({
        to: candidate.extractedData?.email || candidate.email || "",
        subject: `À propos de votre candidature - ${candidate.name}`,
        message: `Bonjour ${candidate.name},\n\nNous avons bien reçu votre candidature et souhaiterions vous contacter concernant votre profil.\n\n`,
        attachments: []
      });
    }
  }, [candidate, isOpen]);

  const handleClose = () => {
    onClose();
    // Reset form after close animation
    setTimeout(() => {
      setEmailData({ to: "", subject: "", message: "", attachments: [] });
    }, 200);
  };

  const handleSend = async () => {
    if (!emailData.to.trim()) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }
    if (!emailData.subject.trim()) {
      toast.error("Veuillez saisir un objet");
      return;
    }
    if (!emailData.message.trim()) {
      toast.error("Veuillez saisir un message");
      return;
    }

    setIsSending(true);
    try {
      await onSend(emailData);
      toast.success("Email envoyé avec succès");
      handleClose();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 5;

    // Vérifier la taille et le nombre de fichiers
    if (emailData.attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} pièces jointes autorisées`);
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`Le fichier ${file.name} est trop volumineux (max 10MB)`);
        return false;
      }
      return true;
    });

    setEmailData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }));
  };

  const removeAttachment = (index: number) => {
    setEmailData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer un email à {candidate?.name}
          </DialogTitle>
          <DialogDescription>
            Rédigez votre message personnalisé pour ce candidat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Destinataire */}
          <div className="space-y-2">
            <Label htmlFor="email-to">Destinataire *</Label>
            <Input
              id="email-to"
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="email@exemple.com"
              disabled={isSending}
            />
          </div>

          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="email-subject">Objet *</Label>
            <Input
              id="email-subject"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Objet de l'email"
              disabled={isSending}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="email-message">Message *</Label>
            <Textarea
              id="email-message"
              value={emailData.message}
              onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Votre message..."
              rows={8}
              className="resize-none"
              disabled={isSending}
            />
          </div>

          {/* Pièces jointes */}
          <div className="space-y-2">
            <Label htmlFor="email-attachments">Pièces jointes</Label>
            <div className="flex items-center gap-2">
              <Input
                id="email-attachments"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={isSending}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('email-attachments')?.click()}
                className="gap-2"
                disabled={isSending || emailData.attachments.length >= 5}
              >
                <Paperclip className="h-4 w-4" />
                Ajouter des fichiers
              </Button>
              <span className="text-sm text-muted-foreground">
                (max 5 fichiers, 10MB chacun)
              </span>
            </div>

            {/* Liste des fichiers attachés */}
            {emailData.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {emailData.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-3 w-3" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      disabled={isSending}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informations candidat */}
          {candidate && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Informations du candidat</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Nom :</strong> {candidate.name}</p>
                {candidate.extractedData?.email && (
                  <p><strong>Email :</strong> {candidate.extractedData.email}</p>
                )}
                {candidate.extractedData?.phone && (
                  <p><strong>Téléphone :</strong> {candidate.extractedData.phone}</p>
                )}
                {candidate.score && (
                  <p><strong>Score :</strong> {Number(candidate.score).toFixed(1)}/100</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !emailData.to.trim() || !emailData.subject.trim() || !emailData.message.trim()}
            className="gap-2"
          >
            {isSending && <LoadingSpinner size="sm" />}
            Envoyer l'email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}