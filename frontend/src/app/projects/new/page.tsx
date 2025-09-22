"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { NavBar } from "@/components/ui/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCreateProject } from "@/hooks/mutations";
import { projectsApi } from "@/lib/api-client";
import { ArrowLeft, Briefcase, Save, Upload, Calendar, FileText, X, Download } from "lucide-react";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const createProjectMutation = useCreateProject();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);
  
  const [formData, setFormData] = useState({
    name: "",
    jobDescription: "",
    customPrompt: "",
    startDate: "",
    endDate: "",
    offerDescription: ""
  });
  
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // States pour les URLs locales (prévisualisation)
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    
    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = "Job description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOfferDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Please select a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size must be less than 10MB");
      return;
    }

    // Créer une URL locale pour la prévisualisation
    const localUrl = URL.createObjectURL(file);
    setCurrentDocumentUrl(localUrl);

    // Reset the file input
    event.target.value = '';
  };

  const handleOfferImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPEG, PNG or WebP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Créer une URL locale pour la prévisualisation
    const localUrl = URL.createObjectURL(file);
    setCurrentImageUrl(localUrl);

    // Reset the file input
    event.target.value = '';
  };

  const handleRemoveOfferDocument = () => {
    setCurrentDocumentUrl('');
  };

  const handleRemoveOfferImage = () => {
    setCurrentImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Créer le projet d'abord
      const projectData = {
        name: formData.name.trim(),
        jobDescription: formData.jobDescription.trim(),
        customPrompt: formData.customPrompt.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        offerDescription: formData.offerDescription.trim() || undefined
      };

      const project = await new Promise<any>((resolve, reject) => {
        createProjectMutation.mutate(projectData, {
          onSuccess: resolve,
          onError: reject
        });
      });

      // Upload des fichiers après création du projet (si présents)
      const uploadPromises = [];

      if (currentDocumentUrl && project.id) {
        const documentBlob = await fetch(currentDocumentUrl).then(r => r.blob());
        const documentFormData = new FormData();
        documentFormData.append('document', documentBlob, 'offer-document.pdf');
        uploadPromises.push(projectsApi.uploadOfferDocument(project.id, documentFormData));
      }

      if (currentImageUrl && project.id) {
        const imageBlob = await fetch(currentImageUrl).then(r => r.blob());
        const imageFormData = new FormData();
        imageFormData.append('image', imageBlob, 'offer-image.jpg');
        uploadPromises.push(projectsApi.uploadOfferImage(project.id, imageFormData));
      }

      // Attendre que tous les uploads se terminent
      if (uploadPromises.length > 0) {
        try {
          await Promise.all(uploadPromises);
        } catch (error) {
          console.warn('Erreur lors de l\'upload des fichiers, mais projet créé avec succès');
        }
      }

      toast.success("Offre d'emploi créée avec succès!");
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Erreur lors de la création de l'offre");
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultPrompt = `You are an expert HR recruiter. Analyze the provided CV against the job description and rate the candidate's fit for the position. Consider skills match, experience relevance, education background, and overall profile alignment.

Provide a detailed analysis including:
- Overall score (0-100)
- Brief summary of the candidate
- Key strengths related to the position
- Potential weaknesses or gaps
- Recommendations for the recruiter

Be objective and focus on job-relevant criteria.`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Créer une nouvelle offre d'emploi</h1>
          <p className="text-muted-foreground">
            Configurez votre offre d'emploi et système d'analyse des candidatures
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Détails de l'offre
            </CardTitle>
            <CardDescription>
              Configurez les détails de votre offre d'emploi et les paramètres d'analyse IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Titre de l'offre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="ex: Développeur Frontend Senior - CDI"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Job Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début de l'offre</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Date à partir de laquelle l'offre sera visible
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin de l'offre</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Date limite pour postuler
                  </p>
                </div>
              </div>

              {/* Offer Description for Public */}
              <div className="space-y-2">
                <Label htmlFor="offerDescription">Description publique de l'offre</Label>
                <Textarea
                  id="offerDescription"
                  value={formData.offerDescription}
                  onChange={(e) => handleInputChange("offerDescription", e.target.value)}
                  placeholder="Description de l'offre qui sera visible par les candidats sur le site public..."
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Cette description sera affichée aux candidats. Vous pouvez aussi télécharger un PDF détaillé ci-dessous.
                </p>
              </div>

              {/* Offer Image */}
              <div className="space-y-2">
                <Label>Image de présentation de l'offre</Label>
                <div className="space-y-3">
                  {currentImageUrl ? (
                    <div className="relative group">
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Image sélectionnée</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(currentImageUrl, '_blank')}
                            className="border-green-300 text-green-700 hover:bg-green-100"
                          >
                            <Download className="h-4 w-4" />
                            Voir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveOfferImage}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Supprimer
                          </Button>
                        </div>
                      </div>

                      {/* Prévisualisation au hover */}
                      <div className="absolute bottom-full left-0 w-full z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="mb-2 p-2 bg-white border rounded-lg shadow-lg">
                          <img
                            src={currentImageUrl}
                            alt="Preview"
                            className="w-full h-48 object-contain rounded"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <div className="text-sm text-gray-600 mb-2">
                          Sélectionnez une image (JPEG, PNG, WebP - max 5MB)
                        </div>
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleOfferImageUpload}
                          disabled={uploadingImage}
                          className="max-w-xs mx-auto cursor-pointer"
                        />
                        {uploadingImage && (
                          <div className="mt-2">
                            <LoadingSpinner size="sm" />
                            <span className="ml-2 text-sm">Upload en cours...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Offer Document */}
              <div className="space-y-2">
                <Label>Document descriptif de l'offre (PDF)</Label>
                <div className="space-y-3">
                  {currentDocumentUrl ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Document PDF sélectionné</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(currentDocumentUrl, '_blank')}
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          <Download className="h-4 w-4" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveOfferDocument}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <div className="text-sm text-gray-600 mb-2">
                          Sélectionnez un document PDF (max 10MB)
                        </div>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handleOfferDocumentUpload}
                          disabled={uploadingDocument}
                          className="max-w-xs mx-auto cursor-pointer"
                        />
                        {uploadingDocument && (
                          <div className="mt-2">
                            <LoadingSpinner size="sm" />
                            <span className="ml-2 text-sm">Upload en cours...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description for AI */}
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Description du poste (pour l'analyse IA) *</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                  placeholder="Décrivez précisément le poste, les compétences requises, l'expérience nécessaire..."
                  rows={8}
                  className={errors.jobDescription ? "border-red-500" : ""}
                />
                {errors.jobDescription && (
                  <p className="text-sm text-red-600">{errors.jobDescription}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Cette description sera utilisée par l'IA pour évaluer les candidats. Soyez précis sur les exigences.
                </p>
              </div>

              {/* Custom AI Prompt */}
              <div className="space-y-2">
                <Label htmlFor="customPrompt">Prompt IA personnalisé (Optionnel)</Label>
                <Textarea
                  id="customPrompt"
                  value={formData.customPrompt}
                  onChange={(e) => handleInputChange("customPrompt", e.target.value)}
                  placeholder={defaultPrompt}
                  rows={10}
                />
                <p className="text-sm text-muted-foreground">
                  Personnalisez la façon dont l'IA analyse les CV. Laissez vide pour utiliser le prompt par défaut.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  disabled={isSubmitting || createProjectMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || createProjectMutation.isPending}
                  className="flex-1 gap-2"
                >
                  {(isSubmitting || createProjectMutation.isPending) ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Créer l'offre
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Tips for Better Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Job Description</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be specific about required skills and technologies</li>
                <li>• Mention experience level (junior, senior, etc.)</li>
                <li>• Include soft skills and team requirements</li>
                <li>• Add any industry-specific knowledge needed</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Custom AI Prompt</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Focus the AI on what matters most for your role</li>
                <li>• Ask for specific scoring criteria</li>
                <li>• Request structured output for easier comparison</li>
                <li>• Include any company-specific requirements</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
}