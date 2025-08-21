"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ScoreIndicator } from "@/components/ui/score-indicator";
import { 
  ArrowLeft, 
  FileText, 
  Download,
  User,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { candidatesApi } from "@/lib/api-client";

interface Candidate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  extractedText: string;
  fileName: string;
  fileUrl: string;
  extractedData?: any;
  score: number;
  previousScore?: number;
  status: string;
  summary?: string;
  ranking: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  analyses?: any[];
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const candidateId = params.candidateId as string;
  
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setIsLoading(true);
        const response = await candidatesApi.getCandidateInProject(projectId, candidateId);
        const candidateData = response.data;
        
        // S'assurer que les scores sont des nombres
        if (candidateData.score) {
          candidateData.score = typeof candidateData.score === 'string' ? parseFloat(candidateData.score) : candidateData.score;
        }
        if (candidateData.previousScore) {
          candidateData.previousScore = typeof candidateData.previousScore === 'string' ? parseFloat(candidateData.previousScore) : candidateData.previousScore;
        }
        setCandidate(candidateData);
      } catch (error) {
        console.error("Error fetching candidate:", error);
        toast.error("Error loading candidate");
        router.push(`/projects/${projectId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId && candidateId) {
      fetchCandidate();
    }
  }, [projectId, candidateId, router]);

  const handleDownloadCV = () => {
    if (candidate?.fileUrl) {
      const link = document.createElement('a');
      // Si l'URL commence par http, c'est déjà une URL complète (Supabase)
      // Sinon, c'est un chemin local qui nécessite le backend URL
      link.href = candidate.fileUrl.startsWith('http') 
        ? candidate.fileUrl 
        : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/${candidate.fileUrl}`;
      link.download = candidate.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading candidate details..." />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Candidate not found</h2>
          <p className="text-muted-foreground mb-4">
            The candidate you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push(`/projects/${projectId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </div>
      </div>
    );
  }

  const latestAnalysis = candidate.analyses?.[0];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push(`/projects/${projectId}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{candidate.name}</h1>
          <p className="text-muted-foreground">
            Candidate Details • Ranking #{candidate.ranking}
          </p>
        </div>
        <Badge 
          variant={candidate.status === 'analyzed' ? 'default' : 'secondary'}
          className="text-sm"
        >
          {candidate.status}
        </Badge>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Analysis Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ScoreIndicator score={candidate.score} size="lg" />
                  <div>
                    <p className="text-2xl font-bold">{candidate.score}/100</p>
                    {candidate.previousScore && (
                      <p className="text-sm text-muted-foreground">
                        Previous: {candidate.previousScore}
                      </p>
                    )}
                  </div>
                </div>
                {candidate.summary && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm">{candidate.summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Analysis Details */}
          {latestAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Analysis</CardTitle>
                  <CardDescription>
                    Latest analysis from {new Date(latestAnalysis.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {latestAnalysis.analysisData?.strengths && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {latestAnalysis.analysisData.strengths.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {latestAnalysis.analysisData?.weaknesses && (
                    <div>
                      <h4 className="font-medium text-orange-600 mb-2">Areas for Improvement</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {latestAnalysis.analysisData.weaknesses.map((weakness: string, index: number) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestAnalysis.analysisData?.recommendations && (
                    <div>
                      <h4 className="font-medium text-blue-600 mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {latestAnalysis.analysisData.recommendations.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* CV Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  CV Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {candidate.extractedText}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{candidate.name}</span>
                </div>
                
                {candidate.extractedData?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.extractedData.email}</span>
                  </div>
                )}
                
                {candidate.extractedData?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{candidate.extractedData.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Added {new Date(candidate.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleDownloadCV}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                  Download CV
                </Button>
                
                <Button 
                  onClick={() => window.open(candidate.fileUrl.startsWith('http') ? candidate.fileUrl : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/${candidate.fileUrl}`, '_blank')}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <FileText className="h-4 w-4" />
                  View PDF
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* File Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>File Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Original filename</p>
                  <p className="text-sm text-muted-foreground">{candidate.fileName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Upload date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(candidate.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(candidate.updatedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}