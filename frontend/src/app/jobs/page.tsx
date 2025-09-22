'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calendar, Building, MapPin, Clock, ExternalLink, Share2, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ShareButton } from '@/components/ui/share-button';
import { publicApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

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

interface FilterState {
  searchKeyword: string;
  companies: string[];
  dateRange: string;
  status: string[];
}

type DateRangeOption = {
  value: string;
  label: string;
  filter: (job: JobOffer) => boolean;
};

export default function JobsPage() {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchKeyword: '',
    companies: [],
    dateRange: 'all',
    status: []
  });

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

  // Get unique companies for filter
  const availableCompanies = Array.from(
    new Set(jobOffers.map(job => job.company.name))
  ).sort();

  // Date range options
  const dateRangeOptions: DateRangeOption[] = [
    {
      value: 'all',
      label: 'Toutes les périodes',
      filter: () => true
    },
    {
      value: 'today',
      label: "Aujourd'hui",
      filter: (job) => {
        const jobDate = new Date(job.createdAt);
        const today = new Date();
        return jobDate.toDateString() === today.toDateString();
      }
    },
    {
      value: 'week',
      label: 'Cette semaine',
      filter: (job) => {
        const jobDate = new Date(job.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return jobDate >= weekAgo;
      }
    },
    {
      value: 'month',
      label: 'Ce mois',
      filter: (job) => {
        const jobDate = new Date(job.createdAt);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return jobDate >= monthAgo;
      }
    }
  ];

  // Apply filters to job offers
  const filteredJobOffers = jobOffers.filter(job => {
    // Keyword search
    if (filters.searchKeyword) {
      const searchTerm = filters.searchKeyword.toLowerCase();
      const matchesKeyword =
        job.name.toLowerCase().includes(searchTerm) ||
        job.jobDescription.toLowerCase().includes(searchTerm) ||
        (job.offerDescription?.toLowerCase() || '').includes(searchTerm) ||
        job.company.name.toLowerCase().includes(searchTerm);
      if (!matchesKeyword) return false;
    }

    // Company filter
    if (filters.companies.length > 0) {
      if (!filters.companies.includes(job.company.name)) return false;
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const dateOption = dateRangeOptions.find(option => option.value === filters.dateRange);
      if (dateOption && !dateOption.filter(job)) return false;
    }

    // Status filter
    if (filters.status.length > 0) {
      const isExpiring = isJobExpiringSoon(job.endDate);
      const isActive = !job.endDate || new Date(job.endDate) > new Date();

      if (filters.status.includes('expiring') && !isExpiring) return false;
      if (filters.status.includes('active') && !isActive) return false;
    }

    return true;
  });

  // Filter update handlers
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleCompanyFilter = (company: string) => {
    setFilters(prev => ({
      ...prev,
      companies: prev.companies.includes(company)
        ? prev.companies.filter(c => c !== company)
        : [...prev.companies, company]
    }));
  };

  const toggleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchKeyword: '',
      companies: [],
      dateRange: 'all',
      status: []
    });
  };

  const hasActiveFilters = filters.searchKeyword || filters.companies.length > 0 || filters.dateRange !== 'all' || filters.status.length > 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Filter Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-30 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 overflow-y-auto",
        sidebarCollapsed ? "w-16" : "w-80"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-lg">Filtres</h2>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            )}
          </button>
        </div>

        {/* Sidebar Content */}
        {!sidebarCollapsed && (
          <div className="p-4 space-y-6">
            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {filteredJobOffers.length} résultat{filteredJobOffers.length > 1 ? 's' : ''}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-7"
                >
                  <X className="w-3 h-3 mr-1" />
                  Effacer
                </Button>
              </div>
            )}

            {/* Keyword Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Mot-clé, entreprise..."
                  value={filters.searchKeyword}
                  onChange={(e) => updateFilter('searchKeyword', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Période de publication</label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => updateFilter('dateRange', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status-active"
                    checked={filters.status.includes('active')}
                    onCheckedChange={() => toggleStatusFilter('active')}
                  />
                  <label htmlFor="status-active" className="text-sm cursor-pointer">
                    Offres actives
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status-expiring"
                    checked={filters.status.includes('expiring')}
                    onCheckedChange={() => toggleStatusFilter('expiring')}
                  />
                  <label htmlFor="status-expiring" className="text-sm cursor-pointer">
                    Expire bientôt
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Company Filter */}
            {availableCompanies.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Entreprises</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableCompanies.map(company => (
                    <div key={company} className="flex items-center space-x-2">
                      <Checkbox
                        id={`company-${company}`}
                        checked={filters.companies.includes(company)}
                        onCheckedChange={() => toggleCompanyFilter(company)}
                      />
                      <label
                        htmlFor={`company-${company}`}
                        className="text-sm cursor-pointer truncate flex-1"
                        title={company}
                      >
                        {company}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-80"
      )}>
        <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Offres d'emploi</h1>
            <p className="text-xl opacity-90">
              Découvrez nos opportunités de carrière et rejoignez notre équipe
            </p>
            {hasActiveFilters && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm">
                  {filteredJobOffers.length} offre{filteredJobOffers.length > 1 ? 's' : ''} trouvée{filteredJobOffers.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Stats */}
          <div className="mb-8">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {hasActiveFilters ? filteredJobOffers.length : jobOffers.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters ? (
                      <span>
                        offre{filteredJobOffers.length > 1 ? 's' : ''} trouvée{filteredJobOffers.length > 1 ? 's' : ''}
                        <span className="text-xs ml-1">sur {jobOffers.length}</span>
                      </span>
                    ) : (
                      <span>offre{jobOffers.length > 1 ? 's' : ''} disponible{jobOffers.length > 1 ? 's' : ''}</span>
                    )}
                  </p>
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
          {filteredJobOffers.length === 0 ? (
            hasActiveFilters ? (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h2 className="text-xl font-semibold mb-2">Aucun résultat</h2>
                  <p className="mb-4">Aucune offre ne correspond à vos critères de recherche.</p>
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Effacer les filtres
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Building className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h2 className="text-xl font-semibold mb-2">Aucune offre disponible</h2>
                  <p>Aucune offre d'emploi n'est actuellement publiée. Revenez prochainement !</p>
                </div>
              </Card>
            )
          ) : (
            <div className="space-y-6">
              {filteredJobOffers.map((job) => (
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
      </div>
    </div>
  );
}