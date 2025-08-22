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
import { ArrowLeft, Briefcase, Save } from "lucide-react";
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
    customPrompt: ""
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    createProjectMutation.mutate(
      {
        name: formData.name.trim(),
        jobDescription: formData.jobDescription.trim(),
        customPrompt: formData.customPrompt.trim() || undefined
      },
      {
        onSuccess: (project) => {
          toast.success("Project created successfully!");
          router.push(`/projects/${project.id}`);
        },
        onError: (error) => {
          console.error("Error creating project:", error);
          toast.error("Failed to create project");
        },
        onSettled: () => {
          setIsSubmitting(false);
        }
      }
    );
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
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
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-muted-foreground">
            Set up a new recruitment project for CV analysis
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
              Project Details
            </CardTitle>
            <CardDescription>
              Configure your recruitment project settings and AI analysis parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Senior Frontend Developer - 2024"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description *</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                  placeholder="Describe the position, required skills, experience, and qualifications..."
                  rows={8}
                  className={errors.jobDescription ? "border-red-500" : ""}
                />
                {errors.jobDescription && (
                  <p className="text-sm text-red-600">{errors.jobDescription}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Be specific about requirements, skills, and experience needed. This will be used by AI to score candidates.
                </p>
              </div>

              {/* Custom AI Prompt */}
              <div className="space-y-2">
                <Label htmlFor="customPrompt">Custom AI Prompt (Optional)</Label>
                <Textarea
                  id="customPrompt"
                  value={formData.customPrompt}
                  onChange={(e) => handleInputChange("customPrompt", e.target.value)}
                  placeholder={defaultPrompt}
                  rows={10}
                />
                <p className="text-sm text-muted-foreground">
                  Customize how the AI analyzes CVs. Leave empty to use the default prompt.
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
                      Create Project
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