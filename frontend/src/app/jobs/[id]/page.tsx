'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Building, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  FileText, 
  Send, 
  Upload,
  ExternalLink,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ShareButton } from '@/components/ui/share-button';

interface JobOffer {
  id: string;
  name: string;
  jobDescription: string;
  offerDescription?: string;
  offerDocumentUrl?: string;
  offerDocumentFileName?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
  };
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [applicationData, setApplicationData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
    cv: null as File | null
  });

  useEffect(() => {
    const fetchJobOffer = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/public/job-offers/${id}`);
        if (!response.ok) {
          throw new Error('Offre d\'emploi non trouvée');
        }
        const data = await response.json();
        setJobOffer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobOffer();
    }
  }, [id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isJobExpiringSoon = (endDate?: string) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Seuls les fichiers PDF sont acceptés');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Le fichier ne doit pas dépasser 5MB');
        return;
      }
      setApplicationData(prev => ({ ...prev, cv: file }));
    }
  };

  const handleApplication = async () => {
    if (!applicationData.name || !applicationData.email || !applicationData.cv) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', applicationData.name);
      formData.append('email', applicationData.email);
      formData.append('phone', applicationData.phone);
      formData.append('coverLetter', applicationData.coverLetter);
      formData.append('cv', applicationData.cv);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/public/job-offers/${id}/apply`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Votre candidature a été envoyée avec succès !');
        setShowApplicationDialog(false);
        setApplicationData({
          name: '',
          email: '',
          phone: '',
          coverLetter: '',
          cv: null
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erreur lors de l\'envoi de la candidature');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de la candidature');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDocument = () => {
    if (jobOffer?.offerDocumentUrl) {
      window.open(jobOffer.offerDocumentUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !jobOffer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-destructive mb-2">Erreur</h1>
          <p className="text-muted-foreground mb-4">{error || 'Offre non trouvée'}</p>
          <Link href="/jobs">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux offres
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/jobs" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour aux offres
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{jobOffer.name}</h1>
              <div className="flex items-center gap-2 text-primary-foreground/80">
                <Building className="w-5 h-5" />
                {jobOffer.company.name}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <ShareButton 
                  url={`/jobs/${jobOffer.id}`}
                  title={`${jobOffer.name} - ${jobOffer.company.name}`}
                  description={jobOffer.offerDescription || jobOffer.jobDescription}
                  variant="button"
                  size="sm"
                />
                {jobOffer.endDate && isJobExpiringSoon(jobOffer.endDate) && (
                  <Badge variant="destructive" className="gap-1 bg-red-600">
                    <Clock className="w-3 h-3" />
                    Expire bientôt
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations sur le poste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Publié le {formatDate(jobOffer.createdAt)}
                  </div>
                  {jobOffer.startDate && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Début: {formatDate(jobOffer.startDate)}
                    </div>
                  )}
                  {jobOffer.endDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Expire le {formatDate(jobOffer.endDate)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Offer Document */}
            {jobOffer.offerDocumentUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Description détaillée de l'offre</CardTitle>
                  <CardDescription>
                    Consultez le document complet de l'offre d'emploi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={openDocument} className="w-full gap-2" variant="outline">
                    <FileText className="w-4 h-4" />
                    Consulter le document PDF
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </Button>
                  {jobOffer.offerDocumentFileName && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Fichier: {jobOffer.offerDocumentFileName}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description du poste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-foreground">
                    {jobOffer.offerDescription || jobOffer.jobDescription}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application */}
            <Card>
              <CardHeader>
                <CardTitle>Postuler à cette offre</CardTitle>
                <CardDescription>
                  Envoyez votre candidature en quelques clics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full gap-2">
                      <Send className="w-4 h-4" />
                      Postuler maintenant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Postuler à {jobOffer.name}</DialogTitle>
                      <DialogDescription>
                        Remplissez le formulaire ci-dessous pour envoyer votre candidature
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input
                          id="name"
                          value={applicationData.name}
                          onChange={(e) => setApplicationData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Votre nom complet"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={applicationData.email}
                          onChange={(e) => setApplicationData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="votre.email@example.com"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          value={applicationData.phone}
                          onChange={(e) => setApplicationData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+33 6 12 34 56 78"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cv">CV (PDF) *</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-4">
                          <input
                            id="cv"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                            className="hidden"
                          />
                          <Label htmlFor="cv" className="cursor-pointer">
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-8 h-8 text-muted-foreground" />
                              <p className="text-sm text-center">
                                {applicationData.cv ? 
                                  `Fichier sélectionné: ${applicationData.cv.name}` : 
                                  'Cliquez pour sélectionner votre CV (PDF)'
                                }
                              </p>
                            </div>
                          </Label>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="coverLetter">Lettre de motivation</Label>
                        <Textarea
                          id="coverLetter"
                          value={applicationData.coverLetter}
                          onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
                          placeholder="Présentez-vous et expliquez pourquoi ce poste vous intéresse..."
                          disabled={isSubmitting}
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowApplicationDialog(false)}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                      <Button 
                        onClick={handleApplication}
                        disabled={isSubmitting || !applicationData.name || !applicationData.email || !applicationData.cv}
                        className="flex-1"
                      >
                        {isSubmitting ? 'Envoi...' : 'Envoyer ma candidature'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>À propos de l'entreprise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{jobOffer.company.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Une entreprise innovante qui recrute les meilleurs talents.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}