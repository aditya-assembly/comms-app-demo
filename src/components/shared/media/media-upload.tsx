import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getMediaType, getFileIcon, formatFileSizeFromBytes } from "./utils";
import type { MediaFile } from "@/types/orchestration-dashboard-types";

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  mediaFile?: MediaFile;
}

interface DescriptionModalFile {
  id: string;
  file: File;
  description: string;
  name: string;
  baseName: string;
  extension: string;
}

export interface UploadFunction {
  (file: File, onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void, description?: string, name?: string): Promise<MediaFile>;
}

export interface DeleteFunction {
  (mediaId: string): Promise<void>;
}

interface MediaUploadProps {
  uploadFunction: UploadFunction;
  deleteFunction?: DeleteFunction;
  onFilesUploaded?: (files: MediaFile[]) => void;
  onUploadError?: (error: string) => void;
  onFileDeleted?: (mediaId: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedTypes?: string[]; // MIME types or empty/undefined for all types
  fileTypeDisplay?: string[]; // Human-readable file types like ["CSV", "PDF", "XLSX"]
  disabled?: boolean;
  className?: string;
  title?: string;
  description?: string;
}

export function MediaUpload({
  uploadFunction,
  onFilesUploaded,
  onUploadError,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
  allowedTypes,
  fileTypeDisplay,
  disabled = false,
  className,
  title = "Upload Files",
  description = "Drag and drop files here, or click to browse",
}: MediaUploadProps) {
  // Use all types if none specified
  const effectiveAllowedTypes = useMemo(
    () => allowedTypes && allowedTypes.length > 0 ? allowedTypes : ["*/*"],
    [allowedTypes]
  );
  const getFileIconComponent = (fileName: string) => {
    const mediaType = getMediaType(fileName);
    const fileConfig = getFileIcon(mediaType, fileName);
    const IconComponent = fileConfig.icon;
    return <IconComponent className="h-4 w-4" />;
  };
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [descriptionModalFiles, setDescriptionModalFiles] = useState<DescriptionModalFile[]>([]);
  const [currentDescriptionFileIndex, setCurrentDescriptionFileIndex] = useState(0);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);

  // Notify parent when uploaded files change and clear internal state
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      onFilesUploaded?.(uploadedFiles);
      // Clear uploaded files after notifying parent to prevent infinite display
      setUploadedFiles([]);
    }
  }, [uploadedFiles, onFilesUploaded]);

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (file.size > maxFileSize * 1024 * 1024) {
        return {
          valid: false,
          error: `File size must be less than ${maxFileSize}MB`,
        };
      }

      // Skip type validation if all types are allowed
      if (effectiveAllowedTypes[0] !== "*/*" && !effectiveAllowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File type not supported`,
        };
      }

      return { valid: true };
    },
    [maxFileSize, effectiveAllowedTypes]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error("Upload failed", {
          description: validation.error,
        });
        return;
      }

      const uploadId = crypto.randomUUID();
      const uploadingFile: UploadingFile = {
        id: uploadId,
        file,
        progress: 0,
        status: "uploading",
      };

      setUploadingFiles((prev) => [...prev, uploadingFile]);

      // Add to modal queue - no upload yet
      const fileName = file.name;
      const lastDotIndex = fileName.lastIndexOf('.');
      const baseName = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
      const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
      
      const modalFile: DescriptionModalFile = {
        id: uploadId,
        file,
        description: "",
        name: fileName,
        baseName,
        extension,
      };

      setDescriptionModalFiles((prev) => {
        const newFiles = [...prev, modalFile];
        // If this is the first file and modal isn't open, show it
        if (prev.length === 0 && !isDescriptionModalOpen) {
          setIsDescriptionModalOpen(true);
          setCurrentDescriptionFileIndex(0);
        }
        return newFiles;
      });
    },
    [validateFile, isDescriptionModalOpen]
  );

  const startUpload = useCallback(
    async (uploadingFile: UploadingFile, description?: string, name?: string) => {
      console.log("Starting upload for file:", uploadingFile.file.name);
      try {
        const mediaFile = await uploadFunction(
          uploadingFile.file,
          (progress) => {
            setUploadingFiles((prev) => prev.map((uf) => (uf.id === uploadingFile.id ? { ...uf, progress: progress.percentage } : uf)));
          },
          description,
          name
        );

        // Mark as completed
        setUploadingFiles((prev) => prev.map((uf) => (uf.id === uploadingFile.id ? { ...uf, status: "completed", mediaFile } : uf)));

        // Add to uploaded files
        setUploadedFiles((prev) => [...prev, mediaFile]);

        // Remove from uploading list after a delay to show completion status
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((uf) => uf.id !== uploadingFile.id));
        }, 2000);
      } catch (error) {
        console.error("Upload failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Upload failed";

        setUploadingFiles((prev) => prev.map((uf) => (uf.id === uploadingFile.id ? { ...uf, status: "error", error: errorMessage } : uf)));

        onUploadError?.(errorMessage);
        toast.error("Upload failed", {
          description: errorMessage,
        });
      }
    },
    [uploadFunction, onUploadError]
  );

  const handleFileSelect = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const totalFiles = uploadedFiles.length + uploadingFiles.length + fileArray.length;

      if (totalFiles > maxFiles) {
        toast.error("Too many files", {
          description: `Maximum ${maxFiles} files allowed`,
        });
        return;
      }

      // Process each file individually - they will be queued for modal processing
      fileArray.forEach((file) => uploadFile(file));
    },
    [uploadFile, uploadedFiles.length, uploadingFiles.length, maxFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const removeUploadingFile = useCallback((uploadId: string) => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.id !== uploadId));
  }, []);

  const handleDescriptionSave = useCallback(() => {
    const currentFile = descriptionModalFiles[currentDescriptionFileIndex];
    if (currentFile) {
      // Find the uploading file and start the actual upload now
      const uploadingFile = uploadingFiles.find((uf) => uf.id === currentFile.id);
      if (uploadingFile) {
        // Start upload asynchronously (don't await) - it will handle success/failure internally
        startUpload(uploadingFile, currentFile.description, currentFile.name);
      }
      
      // Immediately move to next file or close modal (don't wait for upload)
      const nextIndex = currentDescriptionFileIndex + 1;
      if (nextIndex < descriptionModalFiles.length) {
        setCurrentDescriptionFileIndex(nextIndex);
      } else {
        // All files processed, close modal and clear queue
        setIsDescriptionModalOpen(false);
        setDescriptionModalFiles([]);
        setCurrentDescriptionFileIndex(0);
      }
    }
  }, [descriptionModalFiles, currentDescriptionFileIndex, uploadingFiles, startUpload]);

  const handleDescriptionCancel = useCallback(() => {
    const currentFile = descriptionModalFiles[currentDescriptionFileIndex];
    if (currentFile) {
      // Remove this file from uploading files since no upload happened
      setUploadingFiles((prev) => prev.filter((uf) => uf.id !== currentFile.id));
    }
    
    // Move to next file or close modal
    const nextIndex = currentDescriptionFileIndex + 1;
    if (nextIndex < descriptionModalFiles.length) {
      setCurrentDescriptionFileIndex(nextIndex);
    } else {
      // All files processed, close modal and clear queue
      setIsDescriptionModalOpen(false);
      setDescriptionModalFiles([]);
      setCurrentDescriptionFileIndex(0);
    }
  }, [descriptionModalFiles, currentDescriptionFileIndex]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200",
          isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-muted/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" multiple={maxFiles > 1} accept={effectiveAllowedTypes.join(",")} onChange={handleFileInputChange} disabled={disabled} className="sr-only" />

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-4">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-2">{title}</h4>
          <p className="text-xs text-muted-foreground mb-4">{description}</p>
          
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={disabled} className="text-xs">
            <Upload className="h-3 w-3 mr-2" />
            {maxFiles === 1 ? "Choose File" : "Choose Files"}
          </Button>
          
          {/* File constraints as badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
            {/* File count badge */}
            <span className="px-2.5 py-1 text-xs font-medium bg-info-bg text-info rounded-md border border-info/40">
              {maxFiles === 1 ? "Single file" : `Up to ${maxFiles} files`}
            </span>
            
            {/* File size badge */}
            <span className="px-2.5 py-1 text-xs font-medium bg-warning-bg text-warning rounded-md border border-warning/40">
              Max {maxFileSize}MB {maxFiles === 1 ? "" : "each"}
            </span>
          </div>
          
          {/* Supported file types */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
            {fileTypeDisplay && fileTypeDisplay.length > 0 ? (
              <>
                <span className="text-xs text-muted-foreground">Supported:</span>
                {fileTypeDisplay.map((type) => (
                  <span key={type} className="px-2 py-0.5 text-xs font-medium bg-muted rounded-md border border-border">
                    {type}
                  </span>
                ))}
              </>
            ) : (
              <span className="px-2.5 py-1 text-xs font-medium bg-success-bg text-success rounded-md border border-success/40">
                All file types supported
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-semibold text-foreground">Uploading</h5>
          {uploadingFiles.map((uploadingFile) => (
            <div key={uploadingFile.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
              <div className="flex-shrink-0">
                {uploadingFile.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {uploadingFile.status === "completed" && <CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--emerald-600))' }} />}
                {uploadingFile.status === "error" && <AlertCircle className="h-4 w-4" style={{ color: 'hsl(var(--red-600))' }} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getFileIconComponent(uploadingFile.file.name)}
                  <span className="text-sm font-medium truncate">{uploadingFile.file.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSizeFromBytes(uploadingFile.file.size)}</span>
                </div>

                {uploadingFile.status === "uploading" && <Progress value={uploadingFile.progress} className="h-1" />}
                {uploadingFile.status === "error" && <p className="text-xs" style={{ color: 'hsl(var(--red-600))' }}>{uploadingFile.error}</p>}
                {uploadingFile.status === "completed" && <p className="text-xs" style={{ color: 'hsl(var(--emerald-600))' }}>Upload completed</p>}
              </div>

              {uploadingFile.status === "error" && (
                <Button variant="ghost" size="sm" onClick={() => removeUploadingFile(uploadingFile.id)} className="h-8 w-8 p-0">
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Professional File Upload Modal */}
      <Dialog open={isDescriptionModalOpen} onOpenChange={setIsDescriptionModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden border-0 shadow-2xl" style={{ backgroundColor: 'hsl(var(--background))' }}>
          <DialogHeader className="space-y-6 pb-6 border-b" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
                <Upload className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                  Upload File
                </DialogTitle>
                <DialogDescription className="mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Prepare your file for upload with a custom name and description
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {descriptionModalFiles.length > 0 && (
            <motion.div 
              key={currentDescriptionFileIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8 py-2"
            >
              {(() => {
                const currentFile = descriptionModalFiles[currentDescriptionFileIndex];
                if (!currentFile) return null;
                
                return (
                  <>
                    {/* File Progress Indicator - only for multiple files */}
                    {maxFiles > 1 && descriptionModalFiles.length > 1 && (
                      <div className="flex items-center justify-between text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        <span>File {currentDescriptionFileIndex + 1} of {descriptionModalFiles.length}</span>
                        <div className="flex gap-1">
                          {descriptionModalFiles.map((_, index) => (
                            <div
                              key={index}
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: index < currentDescriptionFileIndex
                                  ? 'hsl(var(--emerald-500))'
                                  : index === currentDescriptionFileIndex
                                  ? 'hsl(var(--blue-500))'
                                  : 'hsl(var(--gray-300))'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Professional File Preview Card */}
                    <div className="rounded-lg p-6 border" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)', borderColor: 'hsl(var(--border))' }}>
                      <div className="flex items-start gap-4">
                        {/* Professional File Icon */}
                        <div className="flex-shrink-0">
                          {(() => {
                            const mediaType = getMediaType(currentFile.file.name);
                            const fileConfig = getFileIcon(mediaType, currentFile.file.name);
                            const IconComponent = fileConfig.icon;
                            return (
                              <div className={`w-16 h-16 rounded-lg ${fileConfig.bg} ${fileConfig.text} flex items-center justify-center border border-white/20`}>
                                <IconComponent className="h-8 w-8" />
                              </div>
                            );
                          })()}
                        </div>

                        {/* Professional File Details */}
                        <div className="flex-1 min-w-0">
                          <div>
                            <h4 className="font-semibold text-lg truncate mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                              {currentFile.file.name}
                            </h4>
                            <div className="flex items-center gap-4 text-sm mb-3">
                              <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {formatFileSizeFromBytes(currentFile.file.size)}
                              </span>
                              <span className="font-medium" style={{ color: 'hsl(var(--emerald-600))' }}>Ready to upload</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {currentFile.extension && (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium" style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}>
                                  {currentFile.extension.replace('.', '').toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Professional Form Section */}
                    <div className="space-y-6">
                      {/* File Name Input */}
                      <div className="space-y-2">
                        <Label htmlFor="file-name" className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          File Name *
                        </Label>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Choose a descriptive name. The file extension will be preserved automatically.
                        </p>
                        <div className="relative">
                          <Input
                            id="file-name"
                            placeholder="Enter file name"
                            value={currentFile.baseName}
                            onChange={(e) => {
                              const updatedFiles = [...descriptionModalFiles];
                              updatedFiles[currentDescriptionFileIndex] = { ...currentFile, baseName: e.target.value, name: e.target.value + currentFile.extension };
                              setDescriptionModalFiles(updatedFiles);
                            }}
                            className="h-12 text-base focus:ring-0 rounded-md transition-colors pr-16"
                            style={{ 
                              backgroundColor: 'hsl(var(--background))',
                              borderColor: 'hsl(var(--border))',
                              color: 'hsl(var(--foreground))'
                            }}
                          />
                          {currentFile.extension && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {currentFile.extension}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description Input */}
                      <div className="space-y-2">
                        <Label htmlFor="file-description" className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                          Description
                        </Label>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          Add context about the file's content or purpose.
                        </p>
                        <Input
                          id="file-description"
                          placeholder="Add description (optional)"
                          value={currentFile.description}
                          onChange={(e) => {
                            const updatedFiles = [...descriptionModalFiles];
                            updatedFiles[currentDescriptionFileIndex] = { ...currentFile, description: e.target.value };
                            setDescriptionModalFiles(updatedFiles);
                          }}
                          className="h-12 text-base focus:ring-0 rounded-md transition-colors"
                          style={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--foreground))'
                          }}
                        />
                      </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t" style={{ borderColor: 'hsl(var(--border) / 0.6)' }}>
                      <Button 
                        variant="outline" 
                        onClick={handleDescriptionCancel} 
                        className="flex-1 h-12 rounded-xl font-semibold transition-all duration-200"
                        style={{
                          borderColor: 'hsl(var(--border))',
                          backgroundColor: 'hsl(var(--background))',
                          color: 'hsl(var(--foreground))'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
                        }}
                      >
                        {maxFiles > 1 && currentDescriptionFileIndex < descriptionModalFiles.length - 1 ? 'Skip' : 'Cancel'}
                      </Button>
                      <Button 
                        onClick={handleDescriptionSave} 
                        disabled={!currentFile.baseName.trim()}
                        className="flex-1 h-12 rounded-xl font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        style={{
                          background: 'linear-gradient(to right, hsl(var(--blue-600)), hsl(var(--indigo-600)))',
                          color: 'hsl(var(--primary-foreground))',
                          boxShadow: '0 10px 15px -3px hsl(var(--blue-500) / 0.25)'
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.background = 'linear-gradient(to right, hsl(var(--blue-700)), hsl(var(--indigo-700)))';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.background = 'linear-gradient(to right, hsl(var(--blue-600)), hsl(var(--indigo-600)))';
                          }
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {maxFiles > 1 && currentDescriptionFileIndex < descriptionModalFiles.length - 1 ? 'Upload & Next' : 'Upload File'}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
