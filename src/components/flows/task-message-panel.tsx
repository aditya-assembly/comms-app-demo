import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Paperclip, Send, X, Download } from "lucide-react";
import { useTaskMessages, useSendTaskMessage } from "@/hooks/use-comms-api";
import { cn } from "@/lib/utils";
import { commsAPI } from "@/services/comms-api";
import type { TaskMessage } from "@/types/api";

interface TaskMessagePanelProps {
  taskId: string;
  taskLabel: string;
}

function formatMessageTime(ms: number | undefined): string {
  if (!ms) return "";
  const d = new Date(ms);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"]);

function isImageFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

function AttachmentLink({ taskId, mediaId, name }: { taskId: string; mediaId: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await commsAPI.getTaskMessageAttachmentUrl(taskId, mediaId);
      setUrl(result.url);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const [downloading, setDownloading] = useState(false);

  const handleClose = () => {
    setOpen(false);
    setUrl(null);
  };

  const handleDownload = async () => {
    if (!url || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(false);
    }
  };

  const isImage = isImageFile(name);

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 hover:bg-primary/20 rounded px-1.5 py-0.5 transition-colors cursor-pointer disabled:opacity-50"
      >
        {loading
          ? <Loader2 className="h-2.5 w-2.5 animate-spin" />
          : <Paperclip className="h-2.5 w-2.5" />
        }
        {name}
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm truncate">{name}</DialogTitle>
            <DialogDescription className="sr-only">Attachment preview</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {url && isImage && (
              <img
                src={url}
                alt={name}
                className="max-h-[60vh] max-w-full rounded-md object-contain border"
              />
            )}
            {url && !isImage && (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Paperclip className="h-10 w-10" />
                <p className="text-sm">{name}</p>
              </div>
            )}
            {url && (
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {downloading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Download className="h-4 w-4" />
                }
                {downloading ? "Downloading…" : "Download"}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MessageBubble({ message, taskId }: { message: TaskMessage; taskId: string }) {
  const isManager = message.role === "MANAGER";
  const isSystem = message.role === "SYSTEM";
  const isAssistant = message.role === "ASSISTANT";

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <p className="text-[11px] text-muted-foreground italic bg-muted/50 rounded-full px-3 py-1">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-0.5 max-w-[85%]", isManager ? "ml-auto items-end" : "mr-auto items-start")}>
      <div className="flex items-center gap-1.5 px-1">
        <span className="text-[10px] font-medium text-muted-foreground">
          {message.authorDisplayName ?? message.authorId ?? (isAssistant ? "Assistant" : "Unknown")}
        </span>
        {message.channel === "EMAIL" && (
          <span className="text-[9px] text-muted-foreground/60 border rounded px-1">email</span>
        )}
      </div>
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
          isManager
            ? "bg-primary text-primary-foreground rounded-br-md"
            : isAssistant
              ? "bg-violet-100 dark:bg-violet-900/30 text-foreground rounded-bl-md"
              : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {message.content}
      </div>
      {message.attachments && message.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1 mt-0.5">
          {message.attachments.filter((a) => a.id).map((a, i) => (
            <AttachmentLink
              key={a.id}
              taskId={taskId}
              mediaId={a.id!}
              name={a.name ?? `file-${i + 1}`}
            />
          ))}
        </div>
      )}
      <span className="text-[10px] text-muted-foreground/60 px-1">
        {formatMessageTime(message.createdAt)}
      </span>
    </div>
  );
}

export function TaskMessagePanel({ taskId, taskLabel }: TaskMessagePanelProps) {
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef(0);

  const { data, isLoading, isFetching } = useTaskMessages(taskId, 0, 200);
  const sendMutation = useSendTaskMessage();

  const messages = data?.items ?? [];

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      const timer = window.setTimeout(scrollToBottom, 50);
      prevCountRef.current = messages.length;
      return () => window.clearTimeout(timer);
    }
    prevCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    const files = selectedFiles.length > 0 ? [...selectedFiles] : undefined;
    setInput("");
    setSelectedFiles([]);
    await sendMutation.mutateAsync({ taskId, content: text, files });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 py-3 border-b">
        <h3 className="text-sm font-semibold truncate">{taskLabel}</h3>
        <p className="text-[11px] text-muted-foreground">
          {messages.length > 0 ? `${messages.length} message${messages.length !== 1 ? "s" : ""}` : "No messages yet"}
        </p>
      </div>

      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="flex flex-col gap-3 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Start the conversation by sending a message.
            </p>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} taskId={taskId} />)
          )}
          {isFetching && !isLoading && (
            <div className="flex justify-center py-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t p-3">
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedFiles.map((file, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] bg-muted rounded-md px-2 py-1 max-w-[180px]"
              >
                <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="shrink-0 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9"
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 min-h-[36px] max-h-[120px] resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            rows={1}
          />
          <Button
            size="icon"
            className="shrink-0 h-9 w-9"
            disabled={!input.trim() || sendMutation.isPending}
            onClick={() => void handleSend()}
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
