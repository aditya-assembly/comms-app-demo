import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useSessionMessages } from "@/hooks/use-comms-api";
import { cn } from "@/lib/utils";
import {
  FLOW_BUILDER_STARTER_PROMPTS,
  FLOW_BUILDER_TAGLINE,
  FLOW_CONVERSATION_CHAT_BANNER,
  FLOW_EMAIL_OUTREACH_CHAT_BANNER,
} from "@/config/orchestration-constants";

const MARKDOWN_COMPONENTS = {
  a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary no-underline hover:underline" {...props}>
      {children}
    </a>
  ),
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
  code: ({ children, ...props }: { children?: React.ReactNode; inline?: boolean }) => {
    const { inline } = props as { inline?: boolean };
    return inline ? (
      <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-foreground">{children}</code>
    ) : (
      <code className="block p-2 rounded-md bg-muted text-xs font-mono overflow-x-auto border border-border text-foreground">{children}</code>
    );
  },
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="text-sm">{children}</li>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 my-2 italic text-muted-foreground">{children}</blockquote>
  ),
};

/** Empty-state copy + starter prompts for Builder (active step and completed session chat). */
export function FlowBuilderStarterSection({
  onSelectPrompt,
  disabled,
}: {
  onSelectPrompt: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3 px-1">
      <p className="text-xs text-muted-foreground">{FLOW_BUILDER_TAGLINE}</p>
      <div className="flex flex-wrap gap-1.5">
        {FLOW_BUILDER_STARTER_PROMPTS.map((text) => (
          <Button
            key={text}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-7 px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => onSelectPrompt(text)}
          >
            {text}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface BuildAndQueryChatPanelProps {
  sessionId: string;
  stepIndex: number | undefined;
  stepType: string;
  /** Seeds the composer when empty (e.g. session userQuery from dispatcher). */
  initialUserQuery?: string | null;
  /** Called when user sends a message. Parent handles streaming, optimistic UI, etc. */
  onSendMessage: (messageText: string) => Promise<void>;
  isStreaming: boolean;
  streamingContent: string;
  optimisticUserMessage: { content: string; createdAtMs: number } | null;
}

/**
 * Chat panel with a strict 2-row layout:
 * - messages row grows/shrinks and scrolls
 * - input row stays visible at the bottom
 */
export function BuildAndQueryChatPanel({
  sessionId,
  stepIndex,
  stepType,
  initialUserQuery,
  onSendMessage,
  isStreaming,
  streamingContent,
  optimisticUserMessage,
}: BuildAndQueryChatPanelProps) {
  const [message, setMessage] = useState("");
  const initialQuerySeededRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initialQuerySeededRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    const q = initialUserQuery?.trim();
    if (!q || initialQuerySeededRef.current) return;
    setMessage((m) => {
      if (m.trim()) return m;
      initialQuerySeededRef.current = true;
      return q;
    });
  }, [initialUserQuery, sessionId]);

  const { data: messages = [], isLoading: isLoadingMessages } = useSessionMessages(
    sessionId,
    stepIndex,
    50,
    { enabled: true }
  );


  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages.length, streamingContent, optimisticUserMessage]);

  const handleSend = async () => {
    if (!message.trim() || isStreaming) return;
    const text = message.trim();
    setMessage("");
    await onSendMessage(text);
  };

  const showBanner = stepType === "CONVERSATION_CREATOR" || stepType === "EMAIL_OUTREACH_CREATOR";
  const bannerText = stepType === "CONVERSATION_CREATOR" ? FLOW_CONVERSATION_CHAT_BANNER : FLOW_EMAIL_OUTREACH_CHAT_BANNER;

  return (
    <div className="h-full min-h-0 grid grid-rows-[1fr_auto] overflow-hidden">
      {/* Messages row - scrollable */}
      <div className="min-h-0 overflow-y-auto">
        <div className="space-y-3 p-3 pb-4 scrollbar-thin bg-background/50 rounded-md">
          {showBanner && (
            <p className="text-[11px] text-muted-foreground mb-2 px-1">
              {bannerText}
            </p>
          )}
          {isLoadingMessages && !optimisticUserMessage && !streamingContent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 && !optimisticUserMessage && !streamingContent ? (
            <div className="py-4">
              <FlowBuilderStarterSection
                disabled={isStreaming}
                onSelectPrompt={(text) => {
                  void onSendMessage(text);
                }}
              />
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex", msg.role === "USER" ? "justify-end" : "justify-start")}
                >
                  <Card
                    className={cn(
                      "max-w-[85%]",
                      msg.role === "USER"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-background border-2 border-border shadow-sm text-foreground"
                    )}
                  >
                    <CardContent className="p-4">
                      {msg.role === "USER" ? (
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-p:leading-relaxed prose-p:my-1 prose-p:text-sm prose-headings:text-foreground prose-headings:font-semibold prose-headings:my-2 prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={MARKDOWN_COMPONENTS}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      <div
                        className={cn(
                          "text-xs mt-2",
                          msg.role === "USER" ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {optimisticUserMessage &&
                !messages.some(
                  (m) =>
                    m.role === "USER" &&
                    m.content.trim() === optimisticUserMessage.content.trim() &&
                    new Date(m.createdAt).getTime() >= optimisticUserMessage.createdAtMs - 2_000
                ) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.1 }} className="flex justify-end">
                  <Card className="max-w-[85%] bg-primary text-primary-foreground shadow-md">
                    <CardContent className="p-4">
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{optimisticUserMessage.content}</div>
                      <div className="text-xs mt-2 text-primary-foreground/90">
                        {new Date(optimisticUserMessage.createdAtMs).toLocaleTimeString()}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              {streamingContent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.1 }} className="flex justify-start">
                  <Card className="max-w-[85%] bg-background border-2 border-border shadow-sm text-foreground">
                    <CardContent className="p-4">
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-p:leading-relaxed prose-p:my-1 prose-p:text-sm prose-headings:text-foreground prose-headings:font-semibold prose-headings:my-2 prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={MARKDOWN_COMPONENTS}>
                          {streamingContent}
                        </ReactMarkdown>
                      </div>
                      {isStreaming && (
                        <div className="flex items-center gap-2 mt-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Streaming...</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input row - always visible at bottom */}
      <div className="border-t-2 border-border bg-background/95 p-3">
        <div className="flex items-end gap-3 bg-background rounded-lg border-2 border-border shadow-md p-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            disabled={isStreaming}
            rows={3}
            className="min-h-[4.5rem] resize-none flex-1 text-base bg-background border-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 placeholder:text-muted-foreground py-3"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isStreaming}
            size="icon"
            className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
