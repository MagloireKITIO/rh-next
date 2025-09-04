'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Calendar, Building, MapPin, Clock, ExternalLink, Share2 } from 'lucide-react';
import Link from 'next/link';
import { ShareButton } from '@/components/ui/share-button';
import { publicApi } from '@/lib/api-client';

interface JobOffer {
  id: string;
  name: string;
  jobDescription: string;
  offerDescription?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
  };
}

export default function JobsPage() {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobOffers = async () => {
      try {
        const response = await publicApi.getAllJobOffers();
        setJobOffers(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des offres');
      } finally {
        setLoading(false);
      }
    };

    fetchJobOffers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-destructive mb-2">Erreur</h1>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Offres d'emploi</h1>
          <p className="text-xl opacity-90">
            Découvrez nos opportunités de carrière et rejoignez notre équipe
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{jobOffers.length}</p>
                <p className="text-sm text-muted-foreground">offre{jobOffers.length > 1 ? 's' : ''} disponible{jobOffers.length > 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Mise à jour quotidienne</p>
                <p className="text-xs text-muted-foreground">
                  Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Job Offers */}
        {jobOffers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <Building className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Aucune offre disponible</h2>
              <p>Aucune offre d'emploi n'est actuellement publiée. Revenez prochainement !</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {jobOffers.map((job) => (
              <Card key={job.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-1">
                          {job.name}
                        </h2>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Building className="w-4 h-4" />
                          {job.company.name}
                        </div>
                      </div>
                      {job.endDate && isJobExpiringSoon(job.endDate) && (
                        <Badge variant="destructive" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Expire bientôt
                        </Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {job.offerDescription || job.jobDescription}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Publié le {formatDate(job.createdAt)}
                      </div>
                      {job.startDate && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Début: {formatDate(job.startDate)}
                        </div>
                      )}
                      {job.endDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Expire le {formatDate(job.endDate)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:min-w-[160px]">
                    <Link href={`/jobs/${job.id}`}>
                      <Button className="w-full gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Voir l'offre
                      </Button>
                    </Link>
                    <ShareButton 
                      url={`/jobs/${job.id}`}
                      title={`${job.name} - ${job.company.name}`}
                      description={job.offerDescription || job.jobDescription}
                      variant="button"
                      size="sm"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-muted-foreground">
          <p className="text-sm">
            Vous ne trouvez pas l'offre qui vous correspond ? 
            <br />
            N'hésitez pas à nous envoyer une candidature spontanée !
          </p>
        </div>
      </div>
    </div>
  );
}