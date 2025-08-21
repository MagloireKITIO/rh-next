import { useCallback } from 'react';
import { projectsApi, candidatesApi, analysisApi, configurationApi, apiKeysApi } from '@/lib/api-client';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export function useProjects() {
  const { projects, setProjects, setLoading, setError, updateProject } = useAppStore();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsApi.getAll();
      setProjects(response.data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error fetching projects';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [setProjects, setLoading, setError]);

  const createProject = useCallback(async (data: { name: string; jobDescription: string; customPrompt?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsApi.create(data);
      await fetchProjects(); // Refresh list
      toast.success('Project created successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error creating project';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, setLoading, setError]);

  const updateProjectData = useCallback(async (id: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsApi.update(id, data);
      updateProject(response.data);
      toast.success('Project updated successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error updating project';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateProject, setLoading, setError]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await projectsApi.delete(id);
      await fetchProjects(); // Refresh list
      toast.success('Project deleted successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error deleting project';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, setLoading, setError]);

  return {
    projects,
    fetchProjects,
    createProject,
    updateProject: updateProjectData,
    deleteProject,
  };
}

export function useCandidates() {
  const { 
    candidates, 
    setCandidates, 
    addCandidates, 
    updateCandidate, 
    setRankingChanges,
    setLoading, 
    setError 
  } = useAppStore();

  const fetchCandidatesByProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await candidatesApi.getByProject(projectId);
      setCandidates(response.data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error fetching candidates';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [setCandidates, setLoading, setError]);

  const uploadCVs = useCallback(async (projectId: string, files: File[]) => {
    try {
      setLoading(true);
      setError(null);
      const response = await candidatesApi.uploadCVs(projectId, files);
      
      if (response.data.successful > 0) {
        addCandidates(response.data.candidates);
        toast.success(`${response.data.successful} CV(s) uploaded successfully`);
      }
      
      if (response.data.failed > 0) {
        toast.warning(`${response.data.failed} CV(s) failed to upload`);
      }
      
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error uploading CVs';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addCandidates, setLoading, setError]);

  const analyzeCandidate = useCallback(async (candidateId: string) => {
    try {
      setError(null);
      await candidatesApi.analyze(candidateId);
      toast.success('Analysis started');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error starting analysis';
      setError(message);
      toast.error(message);
      throw error;
    }
  }, [setError]);

  const fetchRankingChanges = useCallback(async (projectId: string) => {
    try {
      setError(null);
      const response = await candidatesApi.getRankingChanges(projectId);
      setRankingChanges(response.data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error fetching ranking changes';
      setError(message);
      console.error(message);
    }
  }, [setRankingChanges, setError]);

  const deleteCandidate = useCallback(async (candidateId: string, projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      await candidatesApi.delete(candidateId);
      await fetchCandidatesByProject(projectId); // Refresh list
      toast.success('Candidate deleted successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error deleting candidate';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchCandidatesByProject, setLoading, setError]);

  return {
    candidates,
    fetchCandidatesByProject,
    uploadCVs,
    analyzeCandidate,
    fetchRankingChanges,
    deleteCandidate,
    updateCandidate,
  };
}

export function useAnalysis() {
  const { analyses, setAnalyses, setLoading, setError } = useAppStore();

  const fetchAnalysesByProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await analysisApi.getByProject(projectId);
      setAnalyses(response.data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error fetching analyses';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [setAnalyses, setLoading, setError]);

  const generateReport = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await analysisApi.generateReport(projectId);
      toast.success('Report generated successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error generating report';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    analyses,
    fetchAnalysesByProject,
    generateReport,
  };
}

export function useConfiguration() {
  const { setLoading, setError } = useAppStore();

  const getAIConfiguration = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await configurationApi.getAIConfig();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error fetching AI configuration';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const setConfigurationValue = useCallback(async (key: string, value: string, description?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await configurationApi.setValue(key, value, description);
      toast.success('Configuration updated successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error updating configuration';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    getAIConfiguration,
    setConfigurationValue,
  };
}

export function useApiKeys() {
  const { setLoading, setError } = useAppStore();

  const fetchApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiKeysApi.getAll();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error fetching API keys';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const addApiKey = useCallback(async (data: { key: string; name?: string; provider?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiKeysApi.create(data);
      toast.success('API key added successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error adding API key';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const updateApiKey = useCallback(async (id: string, data: { name?: string; isActive?: boolean }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiKeysApi.update(id, data);
      toast.success('API key updated successfully');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error updating API key';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const toggleApiKey = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiKeysApi.toggle(id);
      toast.success('API key status updated');
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error toggling API key';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deleteApiKey = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiKeysApi.delete(id);
      toast.success('API key deleted successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error deleting API key';
      setError(message);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const getStats = useCallback(async () => {
    try {
      setError(null);
      const response = await apiKeysApi.getStats();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error fetching API keys stats';
      setError(message);
      console.error(message);
      throw error;
    }
  }, [setError]);

  return {
    fetchApiKeys,
    addApiKey,
    updateApiKey,
    toggleApiKey,
    deleteApiKey,
    getStats,
  };
}