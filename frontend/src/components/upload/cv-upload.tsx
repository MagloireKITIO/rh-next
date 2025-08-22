"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCandidates } from "@/hooks/use-api";
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileWithStatus {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
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
  maxFiles = 500, 
  className 
}: CVUploadProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const { uploadCVs } = useCandidates();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithStatus[] = acceptedFiles.map(file => ({
      file,
      status: "pending",
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    if (acceptedFiles.length > 0) {
      toast.success(`${acceptedFiles.length} file(s) added to queue`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    disabled: isUploading
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setCurrentFileIndex(0);
    setOverallProgress(0);
    
    const CHUNK_SIZE = 8; // Upload 8 files at a time
    let successCount = 0;
    let failureCount = 0;
    const allResults = [];
    
    try {
      // Process files in chunks
      for (let chunkStart = 0; chunkStart < files.length; chunkStart += CHUNK_SIZE) {
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, files.length);
        const currentChunk = files.slice(chunkStart, chunkEnd);
        
        setCurrentFileIndex(chunkStart);
        
        // Update chunk files status to uploading
        setFiles(prev => prev.map((f, idx) => {
          if (idx >= chunkStart && idx < chunkEnd) {
            return { ...f, status: "uploading" as const, progress: 0 };
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
          // Upload chunk
          const chunkFiles = currentChunk.map(f => f.file);
          const result = await uploadCVs(projectId, chunkFiles);
          
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
        
        // Small delay between chunks to avoid overwhelming the server
        if (chunkEnd < files.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
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

      // Show completion message
      if (successCount > 0) {
        toast.success(`${successCount} CV(s) uploaded successfully`);
      }
      if (failureCount > 0) {
        toast.warning(`${failureCount} CV(s) failed to upload`);
      }

      // Clear successful files after delay
      setTimeout(() => {
        setFiles(prev => prev.filter(f => f.status === "error"));
      }, 3000);

    } catch (error: any) {
      toast.error(error.message || "Upload process failed");
    } finally {
      setIsUploading(false);
      setCurrentFileIndex(0);
      setOverallProgress(0);
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
                  Upload CV files (PDF only) - No limit, processed one by one
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

                    {/* Remove Button */}
                    {!isUploading && fileWithStatus.status !== "uploading" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
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
                Processing batch {Math.floor(currentFileIndex / 8) + 1} of {Math.ceil(files.length / 8)} 
                ({Math.min(currentFileIndex + 8, files.length)} files)
              </span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </motion.div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={uploadFiles}
              disabled={isUploading || files.every(f => f.status === "success")}
              className="w-full gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading batch {Math.floor(currentFileIndex / 8) + 1}/{Math.ceil(files.length / 8)}...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload {files.filter(f => f.status === "pending").length} Files
                </>
              )}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}