"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useUploadCVs } from "@/hooks/mutations";
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileWithStatus {
  file: File;
  status: "pending" | "uploading" | "success" | "error" | "cancelled";
  progress: number;
  error?: string;
  abortController?: AbortController;
}

interface CVUploadProps {
  projectId: string;
  onUploadComplete?: (results: any) => void;
  maxFiles?: number;
  className?: string;
}

export function CVUpload({ 
  projectId, 
  onUploadComplete, 
  maxFiles = 50, // RÉDUIT DE 500 à 50 pour éviter l'overflow mémoire
  className 
}: CVUploadProps) {
  const stateKey = `cv-upload-${projectId}`;
  const getInitialFiles = () => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(stateKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((item: any) => ({
            ...item,
            file: new File([], item.fileName, { type: 'application/pdf' })
          }));
        } catch {
          return [];
        }
      }
    }
    return [];
  };

  const getInitialUploadState = () => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`${stateKey}-upload`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return { isUploading: false, currentFileIndex: 0, overallProgress: 0 };
        }
      }
    }
    return { isUploading: false, currentFileIndex: 0, overallProgress: 0 };
  };

  const [files, setFiles] = useState<FileWithStatus[]>(getInitialFiles);
  const [isUploading, setIsUploading] = useState(getInitialUploadState().isUploading);
  const [currentFileIndex, setCurrentFileIndex] = useState(getInitialUploadState().currentFileIndex);
  const [overallProgress, setOverallProgress] = useState(getInitialUploadState().overallProgress);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const uploadCVsMutation = useUploadCVs();

  // Function to clean up inconsistent states
  const cleanupStates = useCallback(() => {
    console.log("[CVUpload] cleanupStates called");
    const uploadState = getInitialUploadState();
    console.log("[CVUpload] Current upload state:", uploadState);
    console.log("[CVUpload] Files state:", files.map(f => ({ name: f.file.name, status: f.status, hasController: !!f.abortController })));
    
    // If we have upload state but no uploading files, reset the upload state
    if (uploadState.isUploading && files.every(f => f.status !== "uploading")) {
      console.log("[CVUpload] Resetting upload state - no uploading files found");
      setIsUploading(false);
      setCurrentFileIndex(0);
      setOverallProgress(0);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`${stateKey}-upload`);
      }
    }
  }, [stateKey]); // Remove 'files' dependency to avoid loops

  // Clean up states on mount and when returning focus
  useEffect(() => {
    console.log("[CVUpload] Component mounted, running cleanup");
    cleanupStates();
    
    const handleVisibilityChange = () => {
      console.log("[CVUpload] Visibility changed, document.hidden:", document.hidden);
      if (!document.hidden) {
        console.log("[CVUpload] Tab focused, running cleanup");
        cleanupStates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [cleanupStates]);

  // Additional cleanup for stuck files - only run once on mount and when isUploading changes
  useEffect(() => {
    if (!isUploading) return; // Only run when uploading
    
    const checkStuckFiles = () => {
      console.log("[CVUpload] Checking for stuck files");
      setFiles(prev => {
        let hasUpdates = false;
        const updated = prev.map(f => {
          // If file is uploading but has 0 progress and no abort controller, mark as error
          if (f.status === "uploading" && f.progress === 0 && !f.abortController) {
            console.log("[CVUpload] Found stuck file:", f.file.name, "marking as error");
            hasUpdates = true;
            return { ...f, status: "error" as const, error: "Upload failed - file stuck" };
          }
          return f;
        });
        
        if (hasUpdates) {
          console.log("[CVUpload] Updated stuck files");
          return updated;
        }
        return prev; // Return same reference to avoid re-renders
      });
    };

    // Check for stuck files after a delay
    const timer = setTimeout(checkStuckFiles, 3000);
    return () => clearTimeout(timer);
  }, [isUploading]); // Only depend on isUploading, not files

  useEffect(() => {
    if (typeof window !== 'undefined' && files.length > 0) {
      const dataToSave = files.map(f => ({
        fileName: f.file.name,
        size: f.file.size,
        status: f.status,
        progress: f.progress,
        error: f.error
      }));
      sessionStorage.setItem(stateKey, JSON.stringify(dataToSave));
    }
  }, [files, stateKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uploadState = {
        isUploading,
        currentFileIndex,
        overallProgress
      };
      sessionStorage.setItem(`${stateKey}-upload`, JSON.stringify(uploadState));
    }
  }, [isUploading, currentFileIndex, overallProgress, stateKey]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Vérifier la limite de fichiers
    if (files.length + acceptedFiles.length > maxFiles) {
      toast.error(`Limite dépassée: maximum ${maxFiles} fichiers autorisés. Actuellement ${files.length} fichiers.`);
      return;
    }

    const newFiles: FileWithStatus[] = acceptedFiles.map(file => ({
      file,
      status: "pending",
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    if (acceptedFiles.length > 0) {
      toast.success(`${acceptedFiles.length} file(s) added to queue`);
    }
  }, [files.length, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    disabled: isUploading
  });

  const cancelFileUpload = (index: number) => {
    const fileWithStatus = files[index];
    console.log("[CVUpload] cancelFileUpload called for:", fileWithStatus.file.name);
    console.log("[CVUpload] File status:", fileWithStatus.status);
    console.log("[CVUpload] Has abortController:", !!fileWithStatus.abortController);
    
    if (fileWithStatus.status === "uploading" || fileWithStatus.status === "pending") {
      // Abort the controller if it exists
      if (fileWithStatus.abortController) {
        console.log("[CVUpload] Aborting controller for:", fileWithStatus.file.name);
        fileWithStatus.abortController.abort();
      }
      
      // Force cancel the file even if no abort controller
      console.log("[CVUpload] Setting file status to cancelled for:", fileWithStatus.file.name);
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: "cancelled" as const, progress: 0, abortController: undefined } : f
      ));
      toast.info("Upload cancelled");
    } else {
      // If not uploading, remove the file
      console.log("[CVUpload] File not uploading, removing:", fileWithStatus.file.name);
      forceRemoveFile(index);
    }
  };

  const forceRemoveFile = (index: number) => {
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (newFiles.length === 0 && typeof window !== 'undefined') {
        sessionStorage.removeItem(stateKey);
        sessionStorage.removeItem(`${stateKey}-upload`);
      }
      return newFiles;
    });
    toast.info("File removed");
  };

  const removeFile = (index: number) => {
    const fileWithStatus = files[index];
    
    // If file is uploading, cancel it first
    if (fileWithStatus.status === "uploading") {
      cancelFileUpload(index);
      return;
    }
    
    setFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (newFiles.length === 0 && typeof window !== 'undefined') {
        sessionStorage.removeItem(stateKey);
        sessionStorage.removeItem(`${stateKey}-upload`);
      }
      return newFiles;
    });
  };

  const cancelAllUploads = () => {
    if (abortController) {
      abortController.abort();
      setFiles(prev => prev.map(f => 
        f.status === "uploading" ? { ...f, status: "cancelled" as const, progress: 0 } : f
      ));
      setIsUploading(false);
      setCurrentFileIndex(0);
      setOverallProgress(0);
      setAbortController(null);
      toast.info("All uploads cancelled");
    }
  };

  const uploadFiles = async () => {
    console.log("[CVUpload] uploadFiles called");
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    console.log("[CVUpload] Starting upload for", files.length, "files");
    const controller = new AbortController();
    setAbortController(controller);
    setIsUploading(true);
    setCurrentFileIndex(0);
    setOverallProgress(0);
    
    const CHUNK_SIZE = 2; // Upload 2 files at a time (reduced for memory efficiency)
    let successCount = 0;
    let failureCount = 0;
    const allResults = [];
    
    try {
      // Process files in chunks
      for (let chunkStart = 0; chunkStart < files.length; chunkStart += CHUNK_SIZE) {
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, files.length);
        const currentChunk = files.slice(chunkStart, chunkEnd);
        
        setCurrentFileIndex(chunkStart);
        
        // Update chunk files status to uploading and add abort controllers
        const chunkControllers = currentChunk.map(() => new AbortController());
        setFiles(prev => prev.map((f, idx) => {
          if (idx >= chunkStart && idx < chunkEnd) {
            const chunkIndex = idx - chunkStart;
            return { 
              ...f, 
              status: "uploading" as const, 
              progress: 0,
              abortController: chunkControllers[chunkIndex]
            };
          }
          return f;
        }));

        // Simulate progress for current chunk
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map((f, idx) => {
            if (idx >= chunkStart && idx < chunkEnd && f.status === "uploading" && f.progress < 90) {
              return { ...f, progress: f.progress + Math.random() * 10 };
            }
            return f;
          }));
        }, 300);

        try {
          // Upload chunk using TanStack Query mutation
          const chunkFiles = currentChunk.map(f => f.file);
          const result = await new Promise((resolve, reject) => {
            uploadCVsMutation.mutate(
              { projectId, files: chunkFiles },
              {
                onSuccess: (data) => resolve(data),
                onError: (error) => reject(error)
              }
            );
          });
          
          clearInterval(progressInterval);
          
          // Update chunk files status based on results
          setFiles(prev => prev.map((f, idx) => {
            if (idx >= chunkStart && idx < chunkEnd) {
              const chunkIndex = idx - chunkStart;
              const wasSuccessful = chunkIndex < (result.successful || 0);
              return {
                ...f,
                status: wasSuccessful ? "success" as const : "error" as const,
                progress: 100,
                error: wasSuccessful ? undefined : "Upload failed"
              };
            }
            return f;
          }));
          
          successCount += result.successful || 0;
          failureCount += result.failed || 0;
          allResults.push(result);
          
        } catch (error: any) {
          clearInterval(progressInterval);
          
          // Update chunk files status to error
          setFiles(prev => prev.map((f, idx) => {
            if (idx >= chunkStart && idx < chunkEnd) {
              return { 
                ...f, 
                status: "error" as const, 
                progress: 0,
                error: error.message || "Upload failed" 
              };
            }
            return f;
          }));
          
          failureCount += currentChunk.length;
        }
        
        // Update overall progress
        const progress = (chunkEnd / files.length) * 100;
        setOverallProgress(progress);
        
        // Increased delay between chunks for better stability
        if (chunkEnd < files.length) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 secondes entre batches
        }
      }

      // Call completion callback with aggregated results
      if (onUploadComplete) {
        onUploadComplete({
          successful: successCount,
          failed: failureCount,
          candidates: allResults.flatMap(r => r.candidates || [])
        });
      }

      // Toasts are now handled by the mutation hook
      // Show summary only if mixed results
      if (successCount > 0 && failureCount > 0) {
        toast.info(`Upload complete: ${successCount} successful, ${failureCount} failed`);
      }

      // Clear successful files after delay
      setTimeout(() => {
        setFiles(prev => {
          const remainingFiles = prev.filter(f => f.status === "error");
          if (remainingFiles.length === 0 && typeof window !== 'undefined') {
            sessionStorage.removeItem(stateKey);
            sessionStorage.removeItem(`${stateKey}-upload`);
          }
          return remainingFiles;
        });
      }, 3000);

    } catch (error: any) {
      toast.error(error.message || "Upload process failed");
    } finally {
      setIsUploading(false);
      setCurrentFileIndex(0);
      setOverallProgress(0);
      setAbortController(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`${stateKey}-upload`);
      }
    }
  };

  const getFileIcon = (status: string) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploading":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "cancelled":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload CV Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <motion.div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50",
            isUploading && "pointer-events-none opacity-50"
          )}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <input {...getInputProps()} />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <Upload className={cn(
              "h-12 w-12 mx-auto",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
            {isDragActive ? (
              <p className="text-primary font-medium">Drop the files here...</p>
            ) : (
              <>
                <p className="font-medium">Drop PDF files here or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Upload CV files (PDF only) - Maximum {maxFiles} files, processed by batch of 2
                </p>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <h4 className="font-medium text-sm">Selected Files ({files.length})</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((fileWithStatus, index) => (
                  <motion.div
                    key={`${fileWithStatus.file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                  >
                    {getFileIcon(fileWithStatus.status)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fileWithStatus.file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {(fileWithStatus.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(fileWithStatus.status)}
                        >
                          {fileWithStatus.status}
                        </Badge>
                      </div>
                      
                      {/* Progress Bar */}
                      {fileWithStatus.status === "uploading" && (
                        <Progress 
                          value={fileWithStatus.progress} 
                          className="mt-2 h-1"
                        />
                      )}
                      
                      {/* Error Message */}
                      {fileWithStatus.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {fileWithStatus.error}
                        </p>
                      )}
                    </div>

                    {/* Cancel/Remove Button */}
                    {fileWithStatus.status !== "success" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelFileUpload(index)}
                        className={cn(
                          "h-6 w-6 p-0",
                          fileWithStatus.status === "uploading" 
                            ? "text-red-600 hover:text-red-700" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title={fileWithStatus.status === "uploading" ? "Cancel upload" : "Remove file"}
                      >
                        {fileWithStatus.status === "uploading" ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overall Progress Bar */}
        {isUploading && files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Processing batch {Math.floor(currentFileIndex / 2) + 1} of {Math.ceil(files.length / 2)} 
                ({Math.min(currentFileIndex + 2, files.length)} files)
              </span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </motion.div>
        )}

        {/* Upload/Cancel Buttons */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            {isUploading ? (
              <>
                <Button
                  onClick={cancelAllUploads}
                  variant="outline"
                  className="flex-1 gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel All
                </Button>
                <div className="flex-2 flex items-center justify-center text-sm text-muted-foreground">
                  Uploading batch {Math.floor(currentFileIndex / 2) + 1}/{Math.ceil(files.length / 2)}...
                </div>
              </>
            ) : (
              <Button
                onClick={uploadFiles}
                disabled={uploadCVsMutation.isPending || files.every(f => f.status === "success")}
                className="w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload {files.filter(f => f.status === "pending").length} Files
              </Button>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}