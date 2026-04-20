import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2, ChevronRight, CheckCircle2 } from "lucide-react";
import { useBootstrapStep, useEmailOutreachInStep, useUpdateEmailOutreachInStep, useAddFollowUpInStep } from "@/hooks/use-comms-api";
import LoadingScreen from "@/components/shared/ui/loading-screen";
import { FlowStepActions, FlowStepFormInner } from "@/components/flows/flow-step-layout";
import { EmailOutreachEditor } from "./email-outreach-editor";
import type { EmailOutreachCreatorFlowStep, EmailOutreach, EmailReceiver, SendTimeWindow } from "@/types/orchestration-dashboard-types";

/** Default: all times, all days. User can restrict if desired. */
const DEFAULT_SEND_TIME_WINDOW: SendTimeWindow = {
  timezone: "America/Los_Angeles",
  startTimeOfDay: "00:00",
  endTimeOfDay: "23:59",
  allowedDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
};

function ensureCompleteSendTimeWindow(v: SendTimeWindow | null | undefined): SendTimeWindow {
  if (!v) return DEFAULT_SEND_TIME_WINDOW;
  return {
    timezone: v.timezone ?? DEFAULT_SEND_TIME_WINDOW.timezone,
    startTimeOfDay: v.startTimeOfDay ?? DEFAULT_SEND_TIME_WINDOW.startTimeOfDay,
    endTimeOfDay: v.endTimeOfDay ?? DEFAULT_SEND_TIME_WINDOW.endTimeOfDay,
    allowedDaysOfWeek: v.allowedDaysOfWeek?.length ? v.allowedDaysOfWeek : (DEFAULT_SEND_TIME_WINDOW.allowedDaysOfWeek ?? [0, 1, 2, 3, 4, 5, 6]),
  };
}

function prepareOutreachForApi(outreach: EmailOutreach): EmailOutreach {
  const ensureReceiver = (r: EmailReceiver) =>
    r.email ? { ...r, emailAddress: r.email } : r;
  const sendWindow = ensureCompleteSendTimeWindow(outreach.defaultSendTimeWindow ?? outreach.sendTimeWindow);
  return {
    ...outreach,
    to: outreach.to?.map(ensureReceiver),
    cc: outreach.cc?.map(ensureReceiver),
    bcc: outreach.bcc?.map(ensureReceiver),
    defaultSendTimeWindow: sendWindow,
    sendTimeWindow: sendWindow,
  };
}

interface EmailOutreachCreatorStepProps {
  step: EmailOutreachCreatorFlowStep;
  assemblyId?: string;
  emailOutreachId?: string | null;
  emailOutreach?: EmailOutreach | null;
  onEmailOutreachCreated?: (outreach: EmailOutreach) => void;
  onComplete?: () => void;
  isLastStep?: boolean;
  sessionId?: string;
  stepIndex?: number;
}

function isEmailOutreach(obj: unknown): obj is EmailOutreach {
  return (
    typeof obj === "object" &&
    obj !== null &&
    ("initialOutreach" in obj || "followUps" in obj || "to" in obj || "name" in obj)
  );
}


export function EmailOutreachCreatorStep({
  step,
  assemblyId,
  emailOutreachId,
  emailOutreach,
  onEmailOutreachCreated,
  onComplete,
  isLastStep = false,
  sessionId,
  stepIndex,
}: EmailOutreachCreatorStepProps) {
  const [instructions, setInstructions] = useState("");
  const [bootstrappedOutreach, setBootstrappedOutreach] = useState<EmailOutreach | null>(null);
  const [noOpMessage, setNoOpMessage] = useState<string | null>(null);
  const [editableOutreach, setEditableOutreach] = useState<EmailOutreach | null>(null);

  const hasEmailOutreachId = Boolean(emailOutreachId && String(emailOutreachId).trim());
  const shouldFetchEmailOutreach = hasEmailOutreachId;

  const {
    data: fetchedEmailOutreach,
    isLoading: isLoadingEmailOutreach,
    error: emailOutreachError,
    refetch: refetchEmailOutreach,
  } = useEmailOutreachInStep(sessionId || "", stepIndex ?? -1, shouldFetchEmailOutreach);

  const bootstrapMutation = useBootstrapStep();
  const updateMutation = useUpdateEmailOutreachInStep();
  const addFollowUpMutation = useAddFollowUpInStep();

  const displayOutreach: EmailOutreach | null | undefined =
    editableOutreach ?? fetchedEmailOutreach ?? emailOutreach ?? bootstrappedOutreach;
  const hasOutreachContent = Boolean(
    displayOutreach &&
    (displayOutreach.id ||
      displayOutreach.initialOutreach ||
      (displayOutreach.followUps && displayOutreach.followUps.length > 0) ||
      (displayOutreach.to && displayOutreach.to.length > 0) ||
      displayOutreach.name)
  );
  const hasOutreach = hasOutreachContent || Boolean(emailOutreachId);

  const handleBootstrap = async () => {
    if (!sessionId || stepIndex === undefined) return;

    setNoOpMessage(null);

    const raw: unknown = await bootstrapMutation.mutateAsync({
      sessionId,
      stepIndex,
      request: instructions.trim() ? { instructions: instructions.trim() } : undefined,
    });

    if (isEmailOutreach(raw)) {
      const outreach = raw as EmailOutreach;
      setBootstrappedOutreach(outreach);
      setEditableOutreach(outreach);
      onEmailOutreachCreated?.(outreach);
    } else if (
      typeof raw === "object" &&
      raw !== null &&
      "noOp" in raw &&
      (raw as { noOp?: boolean }).noOp === true &&
      "message" in raw &&
      typeof (raw as { message?: unknown }).message === "string"
    ) {
      setNoOpMessage((raw as { message: string }).message);
    }
  };

  const handleOutreachChange = useCallback((outreach: EmailOutreach) => {
    setEditableOutreach(outreach);
  }, []);

  const handleSave = useCallback(async () => {
    if (!sessionId || stepIndex === undefined || !displayOutreach) return;
    const payload = prepareOutreachForApi(displayOutreach);
    const updated = (await updateMutation.mutateAsync({
      sessionId,
      stepIndex,
      request: {
        emailOutreachId: payload.id ?? emailOutreachId ?? undefined,
        emailOutreach: payload,
      },
    })) as EmailOutreach;
    setEditableOutreach(updated);
    onEmailOutreachCreated?.(updated);
  }, [sessionId, stepIndex, displayOutreach, emailOutreachId, updateMutation, onEmailOutreachCreated]);

  const handleAddFollowUp = useCallback(async () => {
    if (!sessionId || stepIndex === undefined) return;
    const updated = (await addFollowUpMutation.mutateAsync({
      sessionId,
      stepIndex,
      request: {
        emailOutreachId: displayOutreach?.id ?? emailOutreachId ?? undefined,
      },
    })) as EmailOutreach;
    setEditableOutreach(updated);
    onEmailOutreachCreated?.(updated);
  }, [sessionId, stepIndex, displayOutreach?.id, emailOutreachId, addFollowUpMutation, onEmailOutreachCreated]);

  useEffect(() => {
    const source = fetchedEmailOutreach ?? emailOutreach ?? bootstrappedOutreach;
    if (source) {
      setEditableOutreach(source);
    }
  }, [fetchedEmailOutreach, emailOutreach, bootstrappedOutreach]);

  if (emailOutreachError && shouldFetchEmailOutreach) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load email outreach</p>
          <p className="text-sm text-muted-foreground mb-4">{String(emailOutreachError)}</p>
          <Button onClick={() => refetchEmailOutreach()} variant="default">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (shouldFetchEmailOutreach && isLoadingEmailOutreach) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingScreen variant="inline" message="Loading email outreach..." />
      </div>
    );
  }

  if (hasOutreach) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <FlowStepFormInner
          variant="conversation"
          className="w-full max-w-none space-y-6 px-4 py-6 sm:px-8 sm:py-8"
        >
          {displayOutreach ? (
            <EmailOutreachEditor
              outreach={displayOutreach}
              assemblyId={assemblyId}
              onChange={handleOutreachChange}
              onSave={handleSave}
              isSaving={updateMutation.isPending}
              onAddFollowUp={handleAddFollowUp}
              isAddingFollowUp={addFollowUpMutation.isPending}
              sessionId={sessionId}
              stepIndex={stepIndex}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Email outreach created. Use the Builder panel on the right to view or update it.
            </p>
          )}
          {onComplete && (
            <div className="pt-4 border-t border-border/40">
              <FlowStepActions>
                <Button onClick={onComplete} className="gap-2" size="lg">
                  {isLastStep ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Done
                    </>
                  ) : (
                    <>
                      Next Step
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </FlowStepActions>
            </div>
          )}
        </FlowStepFormInner>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full min-w-0"
    >
      <Card className="border-border/40 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground">Send this to one or more people</h4>
              <p className="text-sm text-muted-foreground">
                Configure email content, follow-ups, and scheduling.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="bootstrap-instructions" className="mb-2 block text-sm font-medium text-foreground">
              Optionally customize your outreach
            </label>
            <Textarea
              id="bootstrap-instructions"
              placeholder="e.g. This is critical for our strategy meeting next Tuesday. Thanks for getting to it."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={bootstrapMutation.isPending}
            />
          </div>

          {noOpMessage && (
            <p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-500">
              {noOpMessage}
            </p>
          )}

          <div className="flex justify-center pt-1">
            <Button onClick={handleBootstrap} disabled={bootstrapMutation.isPending} className="gap-2" size="lg">
              {bootstrapMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Create Outreach
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
