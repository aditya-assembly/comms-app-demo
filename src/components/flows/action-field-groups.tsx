import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Settings, ChevronDown, Play, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ActionInputField } from "./action-input-field";
import type { UseTriggerFormReturn } from "@/hooks/use-trigger-form";
import type { WorkflowTriggerItem } from "@/types/api";

// ── Animation variants ──────────────────────────────────────────────────────────

const collapseVariants = {
  open: { height: "auto", opacity: 1 },
  collapsed: { height: 0, opacity: 0 },
};

const collapseTransition = {
  duration: 0.4,
  ease: [0.04, 0.62, 0.23, 0.98],
};

// ── Props ──────────────────────────────────────────────────────────────────────

interface ActionFieldGroupsProps {
  form: UseTriggerFormReturn;
  action: WorkflowTriggerItem;
  assemblyId: string;
  workflowId: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ActionFieldGroups({ form, action, assemblyId, workflowId }: ActionFieldGroupsProps) {
  const { requiredInputs, optionalInputs, hasRequiredInputs, hasOptionalInputs } = form;
  const [requiredOpen, setRequiredOpen] = useState(true);
  const [optionalOpen, setOptionalOpen] = useState(true);

  return (
    <div className="space-y-8">
      {/* Required Inputs */}
      {hasRequiredInputs && (
        <div>
          <button onClick={() => setRequiredOpen((prev) => !prev)} className="flex items-center gap-3 w-full px-1 py-2 group cursor-pointer">
            <AlertCircle className="h-4.5 w-4.5 text-primary flex-shrink-0" />
            <h3 className="text-sm font-bold text-text-primary">Required Fields</h3>
            <Badge variant="primarySoft" className="text-xs px-2 py-0.5">
              {requiredInputs.length}
            </Badge>
            <div className="flex-1 h-px bg-border/30 mx-2" />
            <motion.div animate={{ rotate: requiredOpen ? 180 : 0 }} transition={collapseTransition}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>
          <AnimatePresence initial={false}>
            {requiredOpen && (
              <motion.div
                key="required-content"
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={collapseVariants}
                transition={collapseTransition}
                style={{ overflow: "hidden" }}
              >
                <div className="pt-2 space-y-3">
                  {requiredInputs.map((input) => (
                    <ActionInputField
                      key={`input-${input.name}`}
                      input={input}
                      isRequired={true}
                      value={form.formData.inputs[input.name] ?? ""}
                      onChange={form.handleInputChange}
                      isFieldEmpty={form.isFieldEmpty}
                      isExecuting={form.isExecuting}
                      assemblyId={assemblyId}
                      workflowId={workflowId}
                      eventManager={form.eventManager}
                      action={action}
                      templateMediaUrls={form.templateMediaUrls}
                      loadingTemplateIds={form.loadingTemplateIds}
                      deletingMediaIds={form.deletingMediaIds}
                      setDeletingMediaIds={form.setDeletingMediaIds}
                      onRemoveFile={form.removeFileFromInput}
                      onUpdateField={form.updateField}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Divider between sections */}
      {hasRequiredInputs && hasOptionalInputs && <div className="border-t border-border/40" />}

      {/* Optional Inputs */}
      {hasOptionalInputs && (
        <div>
          <button onClick={() => setOptionalOpen((prev) => !prev)} className="flex items-center gap-3 w-full px-1 py-2 group cursor-pointer">
            <Settings className="h-4.5 w-4.5 text-primary flex-shrink-0" />
            <h3 className="text-sm font-bold text-text-primary">Optional Fields</h3>
            <Badge variant="primarySoft" className="text-xs px-2 py-0.5">
              {optionalInputs.length}
            </Badge>
            <div className="flex-1 h-px bg-border/30 mx-2" />
            <motion.div animate={{ rotate: optionalOpen ? 180 : 0 }} transition={collapseTransition}>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>
          <AnimatePresence initial={false}>
            {optionalOpen && (
              <motion.div
                key="optional-content"
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={collapseVariants}
                transition={collapseTransition}
                style={{ overflow: "hidden" }}
              >
                <div className="pt-2 space-y-3">
                  {optionalInputs.map((input) => (
                    <ActionInputField
                      key={`input-${input.name}`}
                      input={input}
                      isRequired={false}
                      value={form.formData.inputs[input.name] ?? ""}
                      onChange={form.handleInputChange}
                      isFieldEmpty={form.isFieldEmpty}
                      isExecuting={form.isExecuting}
                      assemblyId={assemblyId}
                      workflowId={workflowId}
                      eventManager={form.eventManager}
                      action={action}
                      templateMediaUrls={form.templateMediaUrls}
                      loadingTemplateIds={form.loadingTemplateIds}
                      deletingMediaIds={form.deletingMediaIds}
                      setDeletingMediaIds={form.setDeletingMediaIds}
                      onRemoveFile={form.removeFileFromInput}
                      onUpdateField={form.updateField}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* No inputs - Ready to go */}
      {!hasRequiredInputs && !hasOptionalInputs && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex items-center justify-center py-16">
          <div className="text-center space-y-6 max-w-md">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative">
              <div className="mx-auto w-24 h-24 rounded-full bg-success-bg flex items-center justify-center border-2 border-success/40 shadow-lg">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Sparkles className="h-10 w-10 text-success" />
                </motion.div>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-success flex items-center justify-center shadow-md"
              >
                <Play className="h-4 w-4 text-white" />
              </motion.div>
            </motion.div>

            <div className="space-y-3">
              <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="text-xl font-bold text-foreground">
                Ready to Go!
              </motion.h3>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="text-muted-foreground leading-relaxed">
                This action doesn't require any configuration. Simply click the button below to execute it immediately.
              </motion.p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-bg border border-success/40">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-success">No setup needed</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
