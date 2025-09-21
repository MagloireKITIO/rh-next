"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCreateEvaluation, useUpdateEvaluation } from "@/hooks/mutations";
import { Interview, InterviewEvaluation, CreateEvaluationData } from "@/lib/api-client";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle,
  Save,
  X,
  Target,
  Brain,
  Users,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

interface InterviewEvaluationModalProps {
  interview: Interview | null;
  evaluation?: InterviewEvaluation | null; // Pour édition
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (evaluation: InterviewEvaluation) => void;
}

interface CriteriaScore {
  label: string;
  score: number;
  icon: React.ComponentType<any>;
  description: string;
}

const EVALUATION_CRITERIA: Record<string, CriteriaScore> = {
  technical_skills: {
    label: "Compétences techniques",
    score: 5,
    icon: Brain,
    description: "Maîtrise technique et expertise métier"
  },
  communication: {
    label: "Communication",
    score: 5,
    icon: MessageSquare,
    description: "Clarté d'expression et écoute active"
  },
  cultural_fit: {
    label: "Adéquation culturelle",
    score: 5,
    icon: Users,
    description: "Alignement avec les valeurs de l'entreprise"
  },
  motivation: {
    label: "Motivation",
    score: 5,
    icon: Target,
    description: "Intérêt pour le poste et l'entreprise"
  },
  experience: {
    label: "Expérience",
    score: 5,
    icon: Star,
    description: "Pertinence et richesse de l'expérience"
  }
};

const RECOMMENDATIONS = [
  {
    value: 'strong_hire',
    label: 'Recruter fortement',
    description: 'Candidat exceptionnel, à recruter en priorité',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  {
    value: 'hire',
    label: 'À recruter',
    description: 'Bon candidat qui correspond au poste',
    color: 'bg-blue-100 text-blue-800',
    icon: ThumbsUp
  },
  {
    value: 'neutral',
    label: 'Neutre',
    description: 'Candidat moyen, besoin de plus d\'informations',
    color: 'bg-yellow-100 text-yellow-800',
    icon: AlertTriangle
  },
  {
    value: 'no_hire',
    label: 'Ne pas recruter',
    description: 'Candidat qui ne correspond pas au poste',
    color: 'bg-red-100 text-red-800',
    icon: ThumbsDown
  },
  {
    value: 'strong_no_hire',
    label: 'Rejeter fortement',
    description: 'Candidat totalement inadéquat',
    color: 'bg-red-200 text-red-900',
    icon: X
  }
];

export function InterviewEvaluationModal({
  interview,
  evaluation,
  isOpen,
  onClose,
  onSaved
}: InterviewEvaluationModalProps) {
  const [formData, setFormData] = useState<CreateEvaluationData>({
    interview_id: "",
    criteria_scores: {},
    overall_score: 5,
    strengths: "",
    weaknesses: "",
    comments: "",
    notes: "",
    recommendation: undefined,
    confidence_level: 70,
    is_completed: false
  });

  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>(
    Object.keys(EVALUATION_CRITERIA).reduce((acc, key) => {
      acc[key] = 5;
      return acc;
    }, {} as Record<string, number>)
  );

  const createEvaluationMutation = useCreateEvaluation();
  const updateEvaluationMutation = useUpdateEvaluation();

  const isEditing = !!evaluation;
  const isSubmitting = createEvaluationMutation.isPending || updateEvaluationMutation.isPending;

  useEffect(() => {
    if (interview) {
      setFormData(prev => ({
        ...prev,
        interview_id: interview.id
      }));
    }

    if (evaluation) {
      setFormData({
        interview_id: evaluation.interview_id,
        criteria_scores: evaluation.criteria_scores || {},
        overall_score: evaluation.overall_score || 5,
        strengths: evaluation.strengths || "",
        weaknesses: evaluation.weaknesses || "",
        comments: evaluation.comments || "",
        notes: evaluation.notes || "",
        recommendation: evaluation.recommendation,
        confidence_level: evaluation.confidence_level || 70,
        is_completed: evaluation.is_completed
      });

      if (evaluation.criteria_scores) {
        setCriteriaScores({
          ...criteriaScores,
          ...evaluation.criteria_scores
        });
      }
    }
  }, [interview, evaluation]);

  const handleClose = () => {
    onClose();
    if (!isEditing) {
      // Reset form seulement si on n'est pas en édition
      setTimeout(() => {
        setFormData({
          interview_id: "",
          criteria_scores: {},
          overall_score: 5,
          strengths: "",
          weaknesses: "",
          comments: "",
          notes: "",
          recommendation: undefined,
          confidence_level: 70,
          is_completed: false
        });
        setCriteriaScores(
          Object.keys(EVALUATION_CRITERIA).reduce((acc, key) => {
            acc[key] = 5;
            return acc;
          }, {} as Record<string, number>)
        );
      }, 200);
    }
  };

  const handleCriteriaScoreChange = (criteria: string, score: number) => {
    setCriteriaScores(prev => {
      const updated = { ...prev, [criteria]: score };

      // Calculer le score global automatiquement
      const scores = Object.values(updated);
      const averageScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

      setFormData(prevFormData => ({
        ...prevFormData,
        criteria_scores: updated,
        overall_score: averageScore
      }));

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!interview) {
      toast.error("Aucun entretien sélectionné");
      return;
    }

    if (!formData.recommendation) {
      toast.error("Veuillez sélectionner une recommandation");
      return;
    }

    try {
      let result;
      if (isEditing && evaluation) {
        result = await updateEvaluationMutation.mutateAsync({
          id: evaluation.id,
          data: formData
        });
        toast.success("Évaluation mise à jour");
      } else {
        result = await createEvaluationMutation.mutateAsync(formData);
        toast.success("Évaluation créée avec succès");
      }

      onSaved?.(result);
      handleClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  if (!interview) return null;

  const selectedRecommendation = RECOMMENDATIONS.find(r => r.value === formData.recommendation);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {isEditing ? "Modifier l'évaluation" : "Évaluer l'entretien"}
          </DialogTitle>
          <DialogDescription>
            Évaluez l'entretien avec <strong>{interview.candidate?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Grille d'évaluation par critères */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évaluation par critères</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(EVALUATION_CRITERIA).map(([key, criteria]) => {
                const Icon = criteria.icon;
                const score = criteriaScores[key];

                return (
                  <div key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="font-medium">{criteria.label}</Label>
                          <p className="text-xs text-muted-foreground">{criteria.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="min-w-[3rem]">
                        {score}/10
                      </Badge>
                    </div>
                    <Slider
                      value={[score]}
                      onValueChange={(value: number[]) => handleCriteriaScoreChange(key, value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Insuffisant</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                );
              })}

              {/* Score global */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Score global</Label>
                  <Badge className="text-lg px-3 py-1">
                    {formData.overall_score}/10
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Calculé automatiquement à partir des critères ci-dessus
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recommandation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommandation finale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {RECOMMENDATIONS.map(recommendation => {
                  const Icon = recommendation.icon;
                  const isSelected = formData.recommendation === recommendation.value;

                  return (
                    <motion.div
                      key={recommendation.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        className="w-full h-auto p-4 flex flex-col gap-2 text-left"
                        onClick={() => setFormData(prev => ({ ...prev, recommendation: recommendation.value as any }))}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{recommendation.label}</span>
                        </div>
                        <p className="text-xs opacity-80 line-clamp-2">
                          {recommendation.description}
                        </p>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Niveau de confiance */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Niveau de confiance</Label>
                  <Badge variant="outline">{formData.confidence_level}%</Badge>
                </div>
                <Slider
                  value={[formData.confidence_level || 70]}
                  onValueChange={(value: number[]) => setFormData(prev => ({ ...prev, confidence_level: value[0] }))}
                  max={100}
                  min={1}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Peu confiant</span>
                  <span>Très confiant</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points forts et axes d'amélioration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  Points forts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.strengths}
                  onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                  placeholder="Quels sont les principaux points forts du candidat ?"
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Axes d'amélioration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.weaknesses}
                  onChange={(e) => setFormData(prev => ({ ...prev, weaknesses: e.target.value }))}
                  placeholder="Quels sont les points à améliorer ou les faiblesses identifiées ?"
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Commentaires généraux */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Commentaires généraux</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Commentaires généraux sur l'entretien, impression globale, éléments marquants..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Notes internes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes internes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes internes, informations confidentielles, éléments pour la suite du processus..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Résumé de l'évaluation */}
          {selectedRecommendation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-lg">Résumé de l'évaluation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className={selectedRecommendation.color}>
                      {selectedRecommendation.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Score: {formData.overall_score}/10 • Confiance: {formData.confidence_level}%
                    </span>
                  </div>
                  <p className="text-sm">{selectedRecommendation.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </form>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.recommendation}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                {isEditing ? "Mise à jour..." : "Sauvegarde..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? "Mettre à jour" : "Sauvegarder l'évaluation"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}