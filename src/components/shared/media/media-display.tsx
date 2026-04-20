import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Image, Trash2, Loader2 } from "lucide-react";
import { MediaViewer } from "./media-viewer";
import { getMediaType, getFileIcon, formatFileSize } from "./utils";
import { getBadgeVariantForFileType } from "@/lib/badge-semantics";
import type { MediaFile } from "@/types/orchestration-dashboard-types";
import { motion } from "framer-motion";

interface MediaDisplayProps {
  media: MediaFile;
  workflowId?: string;
  taskId?: string;
  ticketId?: string;
  triggerId?: string;
  variant?: "attachment" | "compact";
  className?: string;
  onDelete?: (mediaId: string) => void;
  showDelete?: boolean;
  isDeleting?: boolean;
}

interface MediaGridProps {
  mediaList: MediaFile[];
  workflowId?: string;
  taskId?: string;
  ticketId?: string;
  triggerId?: string;
  variant?: "attachment" | "compact";
  title?: string;
  className?: string;
  onDelete?: (mediaId: string) => void;
  showDelete?: boolean;
  deletingMediaIds?: Set<string>;
}

export function MediaDisplay({ media, workflowId, taskId, ticketId, triggerId, variant = "attachment", className = "", onDelete, showDelete = false, isDeleting = false }: MediaDisplayProps) {
  const mediaType = getMediaType(media.name);
  const fileConfig = getFileIcon(mediaType, media.name);
  const IconComponent = fileConfig.icon;

  if (variant === "compact") {
    return (
      <motion.div initial={{ opacity: 1, scale: 1 }} animate={isDeleting ? { opacity: 0.5, scale: 0.95 } : { opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="relative">
        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm rounded-xl z-10" style={{ backgroundColor: 'hsl(var(--background) / 0.8)' }}>
            <div className="flex items-center gap-2" style={{ color: 'hsl(var(--red-600))' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Deleting...</span>
            </div>
          </div>
        )}
        <MediaViewer media={media} workflowId={workflowId} taskId={taskId} ticketId={ticketId} triggerId={triggerId}>
          <div
            className={`group flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/5 hover:border-accent/30 transition-all duration-200 cursor-pointer ${
              isDeleting ? "pointer-events-none" : ""
            } ${className}`}
          >
            {/* File Icon */}
            <div className="relative flex-shrink-0">
              <div className={`w-14 h-14 rounded-lg ${fileConfig.bg} ${fileConfig.text} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                {mediaType === "image" ? <Image className="h-7 w-7" /> : <IconComponent className="h-7 w-7" />}
              </div>
            </div>

            {/* File Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm text-foreground truncate group-hover:text-accent transition-colors">{media.name}</p>
                <Badge variant={getBadgeVariantForFileType(mediaType)} className="text-xs font-medium">
                  {fileConfig.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatFileSize(media.sizeMB)}</p>
            </div>

            {/* Delete Button - ghostDestructive keeps hover red for accessibility */}
            {showDelete && onDelete && !isDeleting && (
              <Button
                variant="ghostDestructive"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(media.id);
                }}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </MediaViewer>
      </motion.div>
    );
  }

  // Default attachment variant - like modern file attachments
  return (
    <motion.div initial={{ opacity: 1, scale: 1 }} animate={isDeleting ? { opacity: 0.5, scale: 0.95 } : { opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="relative">
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm rounded-2xl z-10" style={{ backgroundColor: 'hsl(var(--background) / 0.8)' }}>
          <div className="flex items-center gap-2" style={{ color: 'hsl(var(--red-600))' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Deleting...</span>
          </div>
        </div>
      )}
      <MediaViewer media={media} workflowId={workflowId} taskId={taskId} ticketId={ticketId} triggerId={triggerId}>
        <div
          className={`group relative bg-card border border-border/50 rounded-2xl p-6 min-h-[120px] hover:shadow-lg hover:shadow-accent/5 hover:border-accent/40 transition-all duration-300 cursor-pointer ${
            isDeleting ? "pointer-events-none" : ""
          } ${className}`}
        >
          {/* File Icon */}
          <div className="flex items-start gap-5">
            <div className="relative flex-shrink-0">
              <div className="relative">
                <div className={`w-20 h-24 rounded-xl ${fileConfig.bg} ${fileConfig.text} flex flex-col items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                  {mediaType === "image" ? <Image className="h-8 w-8 mb-1" /> : <IconComponent className="h-8 w-8 mb-1" />}
                  <span className="text-xs font-bold tracking-wider">{fileConfig.label}</span>
                </div>
              </div>
            </div>

            {/* File Details */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="mb-2">
                <h4 className="font-semibold text-base text-foreground truncate group-hover:text-accent transition-colors duration-200 mb-1">{media.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">{formatFileSize(media.sizeMB)}</span>
                  <div className="w-1 h-1 bg-muted-foreground/40 rounded-full"></div>
                  <Badge variant={getBadgeVariantForFileType(mediaType)} className="text-xs font-medium">
                    {fileConfig.label}
                  </Badge>
                </div>
              </div>

              {media.description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{media.description}</p>}

              {media.owners && media.owners.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Owners:</span>
                    <span className="text-xs text-foreground">{media.owners.join(", ")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 pointer-events-none" />

          {/* Click indicator */}
          <div className={`absolute top-4 ${showDelete && onDelete ? "right-16" : "right-4"} opacity-0 group-hover:opacity-100 transition-all duration-200`}>
            <div className="bg-accent/10 backdrop-blur-sm rounded-full p-2">
              <Eye className="h-4 w-4 text-accent" />
            </div>
          </div>

          {/* Delete Button - ghostDestructive keeps hover red for accessibility */}
          {showDelete && onDelete && !isDeleting && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button
                variant="ghostDestructive"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(media.id);
                }}
                className="backdrop-blur-sm rounded-full p-2 h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </MediaViewer>
    </motion.div>
  );
}

export function MediaGrid({ mediaList, workflowId, taskId, ticketId, triggerId, variant = "attachment", title, className = "", onDelete, showDelete = false, deletingMediaIds }: MediaGridProps) {
  if (!mediaList || mediaList.length === 0) return null;

  const gridClasses = variant === "compact" ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <div className={`space-y-5 ${className}`}>
      {title && (
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/10">
            <FileText className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h4 className="font-semibold text-lg text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">
              {mediaList.length} file{mediaList.length !== 1 ? "s" : ""} attached
            </p>
          </div>
        </div>
      )}
      <div className={gridClasses}>
        {mediaList.map((media) => (
          <MediaDisplay
            key={media.id}
            media={media}
            workflowId={workflowId}
            taskId={taskId}
            ticketId={ticketId}
            triggerId={triggerId}
            variant={variant}
            onDelete={onDelete}
            showDelete={showDelete}
            isDeleting={deletingMediaIds?.has(media.id) || false}
          />
        ))}
      </div>
    </div>
  );
}
