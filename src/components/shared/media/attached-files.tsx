import { useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, ChevronDown } from "lucide-react";
import { MediaGrid } from "./media-display";
import type { MediaFile } from "@/types/orchestration-dashboard-types";

interface AttachedFilesProps {
  mediaList: MediaFile[];
  workflowId?: string;
  taskId?: string;
  ticketId?: string;
  triggerId?: string;
  title?: string;
  description?: string;
  onDelete?: (mediaId: string) => void;
  showDelete?: boolean;
  deletingMediaIds?: Set<string>;
  className?: string;
  defaultExpanded?: boolean;
}

export function AttachedFiles({
  mediaList,
  workflowId,
  taskId,
  ticketId,
  triggerId,
  title = "Attached Files",
  description = "Files attached to this item",
  onDelete,
  showDelete = false,
  deletingMediaIds,
  className = "",
  defaultExpanded = false,
}: AttachedFilesProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!mediaList || mediaList.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card/50 ${className}`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-muted/20 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/30 border border-border/50 shadow-sm">
            <Paperclip className="h-4 w-4 text-brand-primary" />
          </div>
          <div className="text-left">
            <h5 className="font-semibold text-sm text-foreground">{title}</h5>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1 bg-muted/40 text-muted-foreground text-xs font-medium rounded-full border border-border/40">
            <Paperclip className="h-3 w-3 text-brand-primary" />
            <span>{mediaList.length}</span>
          </div>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ overflow: "hidden" }}
      >
        <div className="px-6 pb-6 border-t border-border/30">
          <div className="pt-4">
            <MediaGrid
              mediaList={mediaList}
              workflowId={workflowId}
              taskId={taskId}
              ticketId={ticketId}
              triggerId={triggerId}
              variant="compact"
              title=""
              className="bg-transparent border-0 p-0 shadow-none"
              onDelete={onDelete}
              showDelete={showDelete}
              deletingMediaIds={deletingMediaIds}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
