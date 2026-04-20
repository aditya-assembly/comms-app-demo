import { MediaViewer } from "@/components/shared/media/media-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useConversation, useConversationSession } from "@/hooks/use-comms-api";
import { getBadgeVariantForConversationItemType } from "@/lib/badge-semantics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { commsAPI } from "@/services/comms-api";
import type { Participant } from "@/types/api";
import type {
  Conversation,
  ConversationItem,
  ConversationItemResponse,
  ConversationRecording,
  ConversationSession,
  MediaFile,
  Message,
} from "@/types/orchestration-dashboard-types";
import { format } from "date-fns";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  FileText,
  MessageSquare,
  Pause,
  Phone,
  PhoneIncoming,
  Play,
  Search,
  SkipBack,
  SkipForward,
  User,
  Users,
  Video,
  X,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONVERSATION_ITEM_TYPE_FORM_DATA,
  CONVERSATION_ITEM_TYPE_MEDIA_REQUEST,
  FORM_FIELD_TYPE_DATE,
} from "./constants";

const typeIcons = {
  INCOMING_CALL: PhoneIncoming,
  OUTGOING_CALL: Phone,
  VIDEO_CALL: Video,
  ASSISTANT_CHAT: MessageSquare,
};

const typeLabels = {
  INCOMING_CALL: "Incoming Call",
  OUTGOING_CALL: "Outgoing Call",
  VIDEO_CALL: "Video Call",
  ASSISTANT_CHAT: "Assistant Chat",
};

function formatDuration(startTime?: number, endTime?: number | null): string {
  if (!startTime) return "N/A";
  if (!endTime) return "In progress";

  const durationMs = endTime - startTime;
  const durationSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatRecordingDuration(duration: string | number | undefined): string {
  if (!duration) return "N/A";
  const seconds = typeof duration === "string" ? parseInt(duration) : duration;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatVideoTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// MessageWithItem interface - matches reference implementation
interface MessageWithItem {
  message: Message;
  conversationItem: ConversationItemResponse;
}

// VideoPlayer Component - matches reference implementation
interface VideoPlayerProps {
  recording: ConversationRecording;
  sessionId: string;
  onSeekReady?: (seekFunction: (seconds: number) => void) => void;
}

function VideoPlayer({ recording, sessionId, onSeekReady }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (recording.mediaPath) {
      setIsLoading(true);
      commsAPI
        .getConversationRecordingSignedUrl(sessionId, recording.mediaPath)
        .then((url) => setVideoUrl(url))
        .catch((error) => {
          console.error("Failed to load video:", error);
          toast.error("Failed to load video");
        })
        .finally(() => setIsLoading(false));
    }
  }, [recording.mediaPath, sessionId]);

  const handleSeekToTimestamp = useCallback((seconds: number) => {
    if (videoRef.current) {
      // Validate that seconds is a finite number before setting currentTime
      if (!isFinite(seconds) || seconds < 0) {
        console.warn("Invalid seek time:", seconds);
        return;
      }

      // Ensure video is ready before seeking
      if (videoRef.current.readyState >= 2) {
        videoRef.current.currentTime = seconds;
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err);
        });
        setIsPlaying(true);

        // Auto-scroll to video player
        videoRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        // Wait for video to be ready
        const handleCanPlay = () => {
          if (videoRef.current && isFinite(seconds) && seconds >= 0) {
            videoRef.current.currentTime = seconds;
            videoRef.current.play().catch((err) => {
              console.error("Error playing video:", err);
            });
            setIsPlaying(true);
            videoRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
          videoRef.current?.removeEventListener("canplay", handleCanPlay);
          videoRef.current?.removeEventListener("loadedmetadata", handleCanPlay);
        };
        videoRef.current.addEventListener("canplay", handleCanPlay);
        videoRef.current.addEventListener("loadedmetadata", handleCanPlay);
      }
    }
  }, []);

  useEffect(() => {
    if (onSeekReady) {
      onSeekReady(handleSeekToTimestamp);
    }
  }, [handleSeekToTimestamp, onSeekReady]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  };

  const handleSkipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = recording.mediaPath || "recording.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("Video URL not available");
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  if (!videoUrl && !isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Video URL not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlay}
                onPause={handlePause}
                controls
                preload="metadata"
              />
            ) : null}
          </div>

          {videoUrl && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePlayPause} disabled={!videoUrl}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={handleSkipBack} disabled={!videoUrl}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleSkipForward} disabled={!videoUrl}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!videoUrl}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// MessageItem Component - matches reference implementation exactly
interface MessageItemProps {
  message: Message;
  recordingStartTime: number;
  onSeekToTimestamp: (seconds: number) => void;
}

function MessageItem({ message, recordingStartTime, onSeekToTimestamp }: MessageItemProps) {
  const handleSeekClick = () => {
    // Calculate time offset from recording start in seconds - EXACTLY as in reference
    const messageTime = message.createdAt;
    if (!messageTime || !isFinite(messageTime) || !isFinite(recordingStartTime) || recordingStartTime <= 0) {
      console.warn("Invalid message time or recording start time:", messageTime, recordingStartTime);
      return;
    }
    const offsetSeconds = (messageTime - recordingStartTime) / 1000;
    if (isFinite(offsetSeconds) && offsetSeconds >= 0) {
      onSeekToTimestamp(offsetSeconds);
    }
  };

  const isUser = message.role === "user";
  const messageTime = message.createdAt;

  // Only calculate video offset if we have a valid recording start time (greater than 0)
  const hasRecording = recordingStartTime > 0 && isFinite(recordingStartTime);
  const videoOffsetSeconds = hasRecording && messageTime && isFinite(messageTime) ? (messageTime - recordingStartTime) / 1000 : null;
  // Enable the button if the message is within the recording range or slightly before (within 5 seconds)
  // const isWithinRange = hasRecording && videoOffsetSeconds !== null && isFinite(videoOffsetSeconds) && videoOffsetSeconds >= -5;

  const messageContent = message.message || message.content || "";

  // Format timestamp: use video time format if we have a recording, otherwise use date format
  const formattedTimestamp =
    hasRecording && videoOffsetSeconds !== null && isFinite(videoOffsetSeconds) && videoOffsetSeconds >= 0
      ? `@${formatVideoTime(videoOffsetSeconds)}`
      : message.createdAt
        ? format(new Date(message.createdAt), "MMM dd, yyyy 'at' h:mm a")
        : "N/A";

  return (
    <div className="flex gap-3 items-start p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", isUser ? "bg-primary-bg" : "bg-surface-elevated")}>
        {isUser ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-secondary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">{message.author || (isUser ? "User" : "Assistant")}</span>
          <Badge variant="outline" className="text-xs h-4">
            {message.role || (isUser ? "user" : "system")}
          </Badge>
          <span className="text-xs text-muted-foreground">{formattedTimestamp}</span>
          {hasRecording && videoOffsetSeconds !== null && isFinite(videoOffsetSeconds) && videoOffsetSeconds >= 0 && (
            <button
              onClick={handleSeekClick}
              className="inline-flex items-center gap-1 rounded-md border-2 border-border-light bg-primary-bg px-2.5 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary-selected hover:border-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
              title={`Jump to ${formatVideoTime(videoOffsetSeconds)} in video`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Go to video</span>
            </button>
          )}
        </div>
        <div className={`rounded-lg px-4 py-2 ${isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
          <p className="text-sm whitespace-pre-wrap">{messageContent}</p>
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="rounded-lg border bg-card p-2 max-w-[300px]">
                <MediaViewer media={attachment as MediaFile} workflowId={undefined}>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded p-2 transition-colors">
                    <span className="text-sm font-medium truncate">{attachment.name}</span>
                  </div>
                </MediaViewer>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ConversationItemHeader Component - matches reference implementation
interface ConversationItemHeaderProps {
  conversationItem: ConversationItemResponse;
  conversationItemsLookup: Record<string, ConversationItem>;
  isExpanded: boolean;
  onToggle: () => void;
  messageCount: number;
}

function ConversationItemHeader({ conversationItem, conversationItemsLookup, isExpanded, onToggle, messageCount }: ConversationItemHeaderProps) {
  // Get the actual conversation item data with proper title and description - EXACTLY as in reference
  // Try multiple possible ID fields to match against the lookup
  const itemId = conversationItem.conversationItem?.id || conversationItem.conversationItemId || conversationItem.itemId || "";
  const conversationItemData = conversationItemsLookup[itemId];
  const title = conversationItemData?.title?.trim() || `${conversationItem.type.replace("_", " ")} Item`;
  const description = conversationItemData?.description?.trim();

  return (
    <div className="p-4 bg-muted/50 border rounded-lg cursor-pointer hover:bg-muted transition-colors" onClick={onToggle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge variant={getBadgeVariantForConversationItemType(conversationItem.type)}>{conversationItem.type.replace("_", " ")}</Badge>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1 italic">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {messageCount} message{messageCount !== 1 ? "s" : ""}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// RecordingMessagesViewer Component - EXACTLY matches reference implementation logic
interface RecordingMessagesViewerProps {
  selectedRecording: ConversationRecording;
  conversationItemResponses: ConversationItemResponse[];
  conversationItemsLookup: Record<string, ConversationItem>;
  onSeekToTimestamp: (seconds: number) => void;
}

function RecordingMessagesViewer({ selectedRecording, conversationItemResponses, conversationItemsLookup, onSeekToTimestamp }: RecordingMessagesViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Step 1: Flatten messages with their conversation items - EXACTLY as in reference
  const messagesWithItems: MessageWithItem[] = [];
  conversationItemResponses.forEach((itemResponse) => {
    if (itemResponse.messages && Array.isArray(itemResponse.messages)) {
      itemResponse.messages.forEach((message) => {
        messagesWithItems.push({
          message,
          conversationItem: itemResponse,
        });
      });
    }
  });

  // Step 2: Filter messages by recording time range - EXACTLY as in reference
  const recordingStartTime = parseInt(selectedRecording.startTime || "0");
  const recordingEndTime = parseInt(selectedRecording.endTime || "0");

  // Validate recording times
  if (!isFinite(recordingStartTime) || !isFinite(recordingEndTime)) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Invalid recording time range</p>
        </CardContent>
      </Card>
    );
  }

  // Filter messages to only show those within the recording time range
  // But also include messages slightly before (within 5 seconds) to account for timing precision
  const timeFilteredMessages = messagesWithItems.filter(({ message }) => {
    const messageTime = message.createdAt; // Direct access, no fallback - EXACTLY as in reference
    // Only include messages with valid createdAt timestamps
    if (!messageTime || !isFinite(messageTime)) {
      return false;
    }
    // Include messages from 5 seconds before recording start to recording end
    return messageTime >= recordingStartTime - 5000 && messageTime <= recordingEndTime;
  });

  // Step 3: Apply search filter - EXACTLY as in reference
  const searchFilteredMessages = searchQuery
    ? timeFilteredMessages.filter(({ message }) => {
        const content = (message.message || message.content || "").toLowerCase();
        const author = (message.author || "").toLowerCase();
        const context = (message.context || "").toLowerCase();
        return content.includes(searchQuery.toLowerCase()) || author.includes(searchQuery.toLowerCase()) || context.includes(searchQuery.toLowerCase());
      })
    : timeFilteredMessages;

  // Step 4: Group messages by conversation item - EXACTLY as in reference
  const messagesByItem = new Map<string, MessageWithItem[]>();
  searchFilteredMessages.forEach((messageWithItem) => {
    // Try multiple possible ID fields to match against the lookup
    const itemId = messageWithItem.conversationItem.conversationItem?.id || messageWithItem.conversationItem.conversationItemId || messageWithItem.conversationItem.itemId || "";
    if (!messagesByItem.has(itemId)) {
      messagesByItem.set(itemId, []);
    }
    messagesByItem.get(itemId)!.push(messageWithItem);
  });

  // Step 5: Sort messages within each group by timestamp - EXACTLY as in reference
  messagesByItem.forEach((messages) => {
    messages.sort((a, b) => (a.message.createdAt || 0) - (b.message.createdAt || 0));
  });

  const totalMessages = searchFilteredMessages.length;

  const handleToggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleExpandAll = () => {
    const allIds = new Set(Array.from(messagesByItem.keys()));
    setExpandedItems(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedItems(new Set());
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Recording Transcript</h3>
              <Badge variant="secondary">{totalMessages}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(recordingStartTime), "MMM dd, yyyy 'at' h:mm a")} → {format(new Date(recordingEndTime), "MMM dd, yyyy 'at' h:mm a")}
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input type="text" placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-10" />
            {searchQuery && (
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 bottom-0 h-full w-10" onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {totalMessages > 0 && messagesByItem.size > 1 && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleExpandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={handleCollapseAll}>
                Collapse All
              </Button>
            </div>
          )}

          {totalMessages > 0 ? (
            <div className="max-h-[600px] overflow-y-auto space-y-4 pb-4">
              {Array.from(messagesByItem.entries()).map(([itemId, messages]) => {
                const conversationItem = messages[0].conversationItem;
                return (
                  <div key={itemId} className="space-y-2">
                    <ConversationItemHeader
                      conversationItem={conversationItem}
                      conversationItemsLookup={conversationItemsLookup}
                      isExpanded={expandedItems.has(itemId)}
                      onToggle={() => handleToggleItem(itemId)}
                      messageCount={messages.length}
                    />
                    {expandedItems.has(itemId) && (
                      <div className="pl-4 space-y-2">
                        {messages.map((messageWithItem, index) => (
                          <MessageItem
                            key={`${messageWithItem.message.createdAt}-${index}`}
                            message={messageWithItem.message}
                            recordingStartTime={recordingStartTime}
                            onSeekToTimestamp={onSeekToTimestamp}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">{searchQuery ? "No messages found matching the current filters" : "No messages found in this recording time range"}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ConversationRecordingsPreview Component - matches reference implementation
interface ConversationRecordingsPreviewProps {
  recordings: ConversationRecording[];
  sessionId: string;
  conversationItemResponses: ConversationItemResponse[];
  conversationItemsLookup: Record<string, ConversationItem>;
  onSeekFunctionReady?: (seekFunction: (seconds: number) => void) => void;
}

function ConversationRecordingsPreview({ recordings, sessionId, conversationItemResponses, conversationItemsLookup, onSeekFunctionReady }: ConversationRecordingsPreviewProps) {
  const [selectedRecording, setSelectedRecording] = useState<ConversationRecording | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const seekToTimestampRef = useRef<((seconds: number) => void) | null>(null);
  const [seekToTimestampFn, setSeekToTimestampFn] = useState<((seconds: number) => void) | null>(null);

  const handleSelectRecording = async (recording: ConversationRecording) => {
    // Reset when selecting a new recording
    setVideoUrl(null);
    seekToTimestampRef.current = null;
    setSeekToTimestampFn(null);
    setIsLoading(true);
    if (!sessionId || !recording.mediaPath) {
      console.error("Missing sessionId or mediaPath");
      setIsLoading(false);
      return;
    }
    try {
      const url = await commsAPI.getConversationRecordingSignedUrl(sessionId, recording.mediaPath || "");
      setSelectedRecording(recording);
      setVideoUrl(url);
    } catch (error) {
      console.error("Failed to load recording:", error);
      toast.error("Failed to load recording");
      setSelectedRecording(null);
      setVideoUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!recordings || recordings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No recordings available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {recordings.length} recording{recordings.length > 1 ? "s" : ""} available
      </p>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Select Recording</h3>
          <div className="space-y-2">
            {recordings.map((recording, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-colors ${selectedRecording === recording ? "border-primary bg-primary-bg" : ""}`}
                onClick={() => handleSelectRecording(recording)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Recording {index + 1}</p>
                        <p className="text-xs text-muted-foreground">Duration: {formatRecordingDuration(recording.duration)}</p>
                        {recording.startTime && <p className="text-xs text-muted-foreground">Started: {format(new Date(parseInt(recording.startTime)), "MMM dd, yyyy 'at' h:mm a")}</p>}
                      </div>
                    </div>
                    <Button
                      variant={selectedRecording === recording ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRecording(recording);
                      }}
                      disabled={isLoading}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {selectedRecording === recording ? "Selected" : "Select"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedRecording && videoUrl && (
        <div className="space-y-6 border-t pt-6">
          <VideoPlayer
            recording={selectedRecording}
            sessionId={sessionId}
            onSeekReady={(seekFn) => {
              // Store the seek function directly in ref and state
              seekToTimestampRef.current = seekFn;
              // Store the function directly (not wrapped)
              setSeekToTimestampFn(seekFn);
              if (onSeekFunctionReady) {
                onSeekFunctionReady(seekFn);
              }
            }}
          />
          <RecordingMessagesViewer
            selectedRecording={selectedRecording}
            conversationItemResponses={conversationItemResponses}
            conversationItemsLookup={conversationItemsLookup}
            onSeekToTimestamp={(seconds: number) => {
              // Validate before calling the stored seek function
              const fn = seekToTimestampRef.current || seekToTimestampFn;
              if (isFinite(seconds) && seconds >= 0 && fn) {
                fn(seconds);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

function formatFormFieldValue(value: unknown, fieldType?: string): { display: React.ReactNode; isJson: boolean } {
  if (value === null || value === undefined) {
    return { display: "—", isJson: false };
  }
  if (typeof value === "boolean") {
    return { display: value ? "Yes" : "No", isJson: false };
  }
  if (typeof value === "number") {
    if (fieldType === FORM_FIELD_TYPE_DATE) {
      const date = new Date(value * 1000);
      return { display: format(date, "MMM d, yyyy"), isJson: false };
    }
    return { display: String(value), isJson: false };
  }
  if (Array.isArray(value)) {
    const list = value.map((v) => (typeof v === "string" ? v : String(v)));
    return { display: list.join(", "), isJson: false };
  }
  if (typeof value === "object") {
    try {
      const str = JSON.stringify(value, null, 2);
      return { display: str, isJson: true };
    } catch {
      return { display: String(value), isJson: false };
    }
  }
  return { display: String(value), isJson: false };
}

interface FormFieldResponsesViewProps {
  itemResponse: ConversationItemResponse;
}

function FormFieldResponsesView({ itemResponse }: FormFieldResponsesViewProps) {
  const fieldResponses = itemResponse.fieldResponses;
  const fieldByKey = useMemo(() => {
    const fields = (itemResponse.conversationItem?.fields || []) as Array<{ fieldName: string; fieldLabel: string; fieldType?: string }>;
    const map: Record<string, { fieldLabel: string; fieldType?: string }> = {};
    fields.forEach((f) => {
      map[f.fieldName] = { fieldLabel: f.fieldLabel || f.fieldName, fieldType: f.fieldType };
    });
    return map;
  }, [itemResponse]);

  if (!fieldResponses || Object.keys(fieldResponses).length === 0) return null;

  const entries = Object.entries(fieldResponses);
  const cells: Array<{ fieldName: string; value: unknown } | null> = entries.map(([fieldName, value]) => ({ fieldName, value }));
  if (cells.length % 2 === 1) cells.push(null);

  return (
    <div className="mt-3 rounded-lg border bg-card overflow-hidden">
      <div className="px-3 py-2 bg-muted/50 border-b">
        <span className="text-sm font-medium">Collected form data</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border">
        {cells.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} aria-hidden />;
          }
          const { fieldName, value } = cell;
          const meta = fieldByKey[fieldName];
          const label = meta?.fieldLabel || fieldName;
          const { display, isJson } = formatFormFieldValue(value, meta?.fieldType);
          return (
            <div key={fieldName} className="min-w-0 px-3 py-2.5 flex flex-col gap-1 items-center text-center">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              {isJson ? (
                <pre className="w-full text-sm font-mono whitespace-pre-wrap break-words bg-muted/30 rounded p-2 max-h-[280px] overflow-y-auto text-center">{display}</pre>
              ) : (
                <span className="text-sm text-foreground">{display}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RequestedMediaViewProps {
  itemResponse: ConversationItemResponse;
  conversationId: string;
}

function RequestedMediaView({ itemResponse, conversationId }: RequestedMediaViewProps) {
  const [loadingMediaId, setLoadingMediaId] = useState<string | null>(null);

  const requestedMedia = itemResponse.requestedMedia ?? [];
  const openableMedia = requestedMedia.filter((m): m is MediaFile & { id: string } => Boolean(m?.id?.trim()));

  const handleOpenDocument = useCallback(
    async (media: MediaFile & { id: string }) => {
      if (!conversationId || !media.id) return;
      setLoadingMediaId(media.id);
      try {
        const url = await commsAPI.getConversationItemMediaUrl(conversationId, media.id);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.error("Failed to open document:", err);
        toast.error("Could not open document. Please try again.");
      } finally {
        setLoadingMediaId(null);
      }
    },
    [conversationId],
  );

  if (openableMedia.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border bg-card overflow-hidden">
      <div className="px-3 py-2 bg-muted/50 border-b">
        <span className="text-sm font-medium">Uploaded documents</span>
      </div>
      <ul className="divide-y divide-border">
        {openableMedia.map((media) => {
          const isLoading = loadingMediaId === media.id;
          return (
            <li key={media.id}>
              <button
                type="button"
                onClick={() => handleOpenDocument(media)}
                disabled={isLoading}
                className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none disabled:opacity-50 transition-colors"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={media.name}>
                  {media.name || "Unnamed file"}
                </span>
                {media.sizeMB != null && media.sizeMB > 0 && <span className="text-xs text-muted-foreground shrink-0">{(media.sizeMB * 1024).toFixed(1)} KB</span>}
                {isLoading ? (
                  <div className="h-4 w-4 shrink-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export interface ConversationSessionDetailViewProps {
  conversationSessionId: string;
  assemblyId: string;
  onBack: () => void;
}

export function ConversationSessionDetailView({
  conversationSessionId,
  assemblyId,
  onBack,
}: ConversationSessionDetailViewProps) {
  const { data: sessionData, isLoading: isLoadingSession, error } = useConversationSession(
    conversationSessionId,
    Boolean(conversationSessionId)
  );
  const session = sessionData as ConversationSession | undefined;

  const { data: conversationData } = useConversation(
    session?.conversationId || "",
    Boolean(session?.conversationId && session.conversationId.trim() !== ""),
    session?.assemblyLineID
  );
  const conversation = conversationData as Conversation | undefined;

  const conversationItemsLookup = useMemo(() => {
    const lookup: Record<string, ConversationItem> = {};
    if (conversation?.conversationItems) {
      conversation.conversationItems.forEach((item) => {
        if (item.id) {
          lookup[item.id] = item;
        }
      });
    }
    return lookup;
  }, [conversation?.conversationItems]);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [seekToTimestampFn, setSeekToTimestampFn] = useState<((seconds: number) => void) | null>(null);
  const [sessionParticipants, setSessionParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const participantIds = session?.participants;
    if (!participantIds?.length) {
      setSessionParticipants([]);
      return;
    }
    let cancelled = false;
    commsAPI
      .getParticipantsBatch(participantIds)
      .then((list) => {
        if (!cancelled) setSessionParticipants(list);
      })
      .catch(() => {
        if (!cancelled) setSessionParticipants([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.participants?.length]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConversationTranscriptionExpanded, setIsConversationTranscriptionExpanded] = useState(true);

  // Process conversation item responses
  const conversationItemResponses: ConversationItemResponse[] = useMemo(() => {
    return session?.conversationItemResponses || [];
  }, [session?.conversationItemResponses]);

  // Filter conversation item responses based on search query (for full transcript)
  const filteredItemResponses = useMemo(() => {
    if (!searchQuery.trim()) return conversationItemResponses;

    const query = searchQuery.toLowerCase();
    return conversationItemResponses.filter((itemResponse) => {
      // Check title/description from lookup
      // Try multiple possible ID fields to match against the lookup
      const itemId = itemResponse.conversationItem?.id || itemResponse.conversationItemId || itemResponse.itemId || "";
      const itemData = conversationItemsLookup[itemId];
      const title = (itemData?.title || "").toLowerCase();
      const description = (itemData?.description || "").toLowerCase();
      if (title.includes(query) || description.includes(query)) {
        return true;
      }

      // Check messages
      if (itemResponse.messages) {
        return itemResponse.messages.some((msg) => {
          const content = (msg.message || msg.content || "").toLowerCase();
          return content.includes(query);
        });
      }

      return false;
    });
  }, [conversationItemResponses, searchQuery, conversationItemsLookup]);

  if (isLoadingSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-[240px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading session details…</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
        <p className="text-muted-foreground mb-4">The session you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => onBack()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const handleBack = () => {
    onBack();
  };

  const handleToggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleExpandAll = () => {
    const allIds = new Set(conversationItemResponses.map((item) => item.conversationItem?.id || "").filter(Boolean));
    setExpandedItems(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedItems(new Set());
  };

  const TypeIcon = typeIcons[session.type as keyof typeof typeIcons] || MessageSquare;
  const startDate = session.conversationStartedAt ? new Date(session.conversationStartedAt) : null;
  const endDate = session.conversationEndedAt ? new Date(session.conversationEndedAt) : null;
  const duration = formatDuration(session.conversationStartedAt, session.conversationEndedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{session.title?.trim() || "Conversation"}</h1>
            <p className="text-muted-foreground">Session details and transcription</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <TypeIcon className="h-5 w-5 text-primary" />
                <Badge variant="outline">{typeLabels[session.type as keyof typeof typeLabels] || session.type}</Badge>
                {session.sessionComplete ? (
                  <Badge variant="successSoft">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="infoSoft">
                    <Play className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {startDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Started</p>
                      <p className="text-sm font-medium">{format(startDate, "MMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                )}
                {endDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ended</p>
                      <p className="text-sm font-medium">{format(endDate, "MMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">{duration}</p>
                  </div>
                </div>
                {session.participants.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">Participants</p>
                      {sessionParticipants.length > 0 ? (
                        <ul className="mt-1 flex flex-col gap-1">
                          {sessionParticipants.map((p) => (
                            <li key={p.id} className="text-sm font-medium text-foreground">
                              {p.email ?? ([p.firstName, p.lastName].filter(Boolean).join(" ") || p.id)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">Loading participants…</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {conversation?.name ? (
              <span className="text-sm text-muted-foreground shrink-0 max-w-[12rem] truncate" title={conversation.name}>
                {conversation.name}
              </span>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {session.recordings && session.recordings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Recordings & Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConversationRecordingsPreview
              recordings={session.recordings}
              sessionId={session.id}
              conversationItemResponses={conversationItemResponses}
              conversationItemsLookup={conversationItemsLookup}
              onSeekFunctionReady={setSeekToTimestampFn}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Button variant="ghost" size="icon" onClick={() => setIsConversationTranscriptionExpanded(!isConversationTranscriptionExpanded)} className="h-8 w-8">
                {isConversationTranscriptionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation Transcription
              </CardTitle>
            </div>
            {isConversationTranscriptionExpanded && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExpandAll}>
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={handleCollapseAll}>
                  Collapse All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        {isConversationTranscriptionExpanded && (
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input type="text" placeholder="Search messages..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-10" />
                {searchQuery && (
                  <Button variant="ghost" size="icon" className="absolute right-0 top-0 bottom-0 h-full w-10" onClick={() => setSearchQuery("")}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto space-y-4 pb-4">
              {filteredItemResponses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">{searchQuery ? "No messages match your search" : "No conversation items available"}</p>
                </div>
              ) : (
                filteredItemResponses.map((itemResponse) => {
                  // Try multiple possible ID fields to match against the lookup
                  const itemId = itemResponse.conversationItem?.id || itemResponse.conversationItemId || itemResponse.itemId || "";
                  const isExpanded = expandedItems.has(itemId);
                  const messages = itemResponse.messages || [];

                  return (
                    <div key={itemId} className="space-y-2">
                      <ConversationItemHeader
                        conversationItem={itemResponse}
                        conversationItemsLookup={conversationItemsLookup}
                        isExpanded={isExpanded}
                        onToggle={() => handleToggleItem(itemId)}
                        messageCount={messages.length}
                      />
                      {isExpanded && (
                        <div className="pl-4 space-y-2">
                          {messages.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No messages available</p>
                          ) : (
                            messages.map((message, index) => {
                              // Find which recording contains this message for seek functionality
                              let recordingStartTime: number | undefined;
                              if (session.recordings && session.recordings.length > 0) {
                                const messageTime = message.createdAt;
                                if (messageTime && isFinite(messageTime)) {
                                  for (const recording of session.recordings) {
                                    const startTime = parseInt(recording.startTime || "0");
                                    const endTime = parseInt(recording.endTime || "0");
                                    if (isFinite(startTime) && isFinite(endTime) && messageTime >= startTime && messageTime <= endTime) {
                                      recordingStartTime = startTime;
                                      break;
                                    }
                                  }
                                }
                              }

                              // eslint-disable-next-line @typescript-eslint/no-empty-function
                              const noopSeek = () => {};
                              return (
                                <MessageItem
                                  key={`${message.createdAt || index}-${index}`}
                                  message={message}
                                  recordingStartTime={recordingStartTime ?? 0}
                                  onSeekToTimestamp={seekToTimestampFn || noopSeek}
                                />
                              );
                            })
                          )}
                          {itemResponse.type === CONVERSATION_ITEM_TYPE_FORM_DATA && itemResponse.fieldResponses && Object.keys(itemResponse.fieldResponses).length > 0 && (
                            <FormFieldResponsesView itemResponse={itemResponse} />
                          )}
                          {itemResponse.type === CONVERSATION_ITEM_TYPE_MEDIA_REQUEST && session.conversationId && itemResponse.requestedMedia && itemResponse.requestedMedia.length > 0 && (
                            <RequestedMediaView itemResponse={itemResponse} conversationId={session.conversationId} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        )}
      </Card>

    </div>
  );
}
