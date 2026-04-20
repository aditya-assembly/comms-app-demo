import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FileText, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { MediaGrid } from "@/components/shared";
import type { MediaFile } from "@/types/orchestration-dashboard-types";

interface ReferenceTemplateFilesProps {
  templateMedia: MediaFile;
  triggerId?: string;
}

export function ReferenceTemplateFiles({ templateMedia, triggerId }: ReferenceTemplateFilesProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-border/40 shadow-sm overflow-hidden bg-card/50">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-6 hover:bg-muted/20 transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950/40 dark:to-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 shadow-sm">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <h5 className="font-semibold text-sm text-foreground">Reference Template</h5>
            <p className="text-xs text-muted-foreground">Review this file to understand the expected format</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="infoSoft" className="text-xs px-2 py-0.5">
            Template
          </Badge>
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
            <MediaGrid mediaList={[templateMedia]} triggerId={triggerId} variant="compact" title="" className="bg-transparent border-0 p-0 shadow-none" showDelete={false} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
