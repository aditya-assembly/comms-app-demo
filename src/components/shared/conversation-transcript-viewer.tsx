import { useState, useMemo, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, X, User, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import type { Message, ConversationItemResponse, ConversationItem } from "@/types/orchestration-dashboard-types";
import { cn } from "@/lib/utils";

function getMessageContent(msg: Message | Record<string, unknown>): string {
  const m = msg as Record<string, unknown>;
  const text = m?.message ?? m?.content ?? m?.text ?? "";
  return text != null ? String(text) : "";
}

function getMessageAuthor(msg: Message | Record<string, unknown>): string {
  const m = msg as Record<string, unknown>;
  const a = m?.author ?? "";
  return a != null ? String(a) : "";
}

function messageMatchesSearch(msg: Message | Record<string, unknown>, query: string): boolean {
  if (!query) return true;
  const content = getMessageContent(msg).toLowerCase();
  const author = getMessageAuthor(msg).toLowerCase();
  const context = String((msg as Record<string, unknown>)?.context ?? "").toLowerCase();
  return content.includes(query) || author.includes(query) || context.includes(query);
}

const itemTypeColors: Record<string, string> = {
  QUESTION: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  DISCUSSION: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  MEDIA_REQUEST: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  REVIEW_MATERIAL: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  WALK_THROUGH: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  FORM_DATA: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  CUSTOMER_SUPPORT: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
};

function TranscriptMessageItem({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const messageContent = getMessageContent(message);
  const formattedTimestamp = message.createdAt
    ? format(new Date(message.createdAt), "MMM dd, yyyy 'at' h:mm a")
    : "N/A";

  return (
    <div className="flex gap-3 items-start p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary/10" : "bg-secondary/10"
        )}
      >
        {isUser ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-secondary" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground">
            {message.author || (isUser ? "User" : "Assistant")}
          </span>
          <Badge variant="outline" className="text-xs h-4">
            {message.role || (isUser ? "user" : "system")}
          </Badge>
          <span className="text-xs text-muted-foreground">{formattedTimestamp}</span>
        </div>
        <div className={cn("rounded-lg px-4 py-2", isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
          <p className="text-sm whitespace-pre-wrap">{messageContent}</p>
        </div>
      </div>
    </div>
  );
}

interface ConversationItemHeaderProps {
  conversationItem: ConversationItemResponse;
  conversationItemsLookup: Record<string, { title?: string; description?: string }>;
  isExpanded: boolean;
  onToggle: () => void;
  messageCount: number;
}

function ConversationItemHeader({
  conversationItem,
  conversationItemsLookup,
  isExpanded,
  onToggle,
  messageCount,
}: ConversationItemHeaderProps) {
  const itemId = conversationItem.conversationItem?.id || conversationItem.conversationItemId || conversationItem.itemId || "";
  const itemData = conversationItemsLookup[itemId];
  const title = itemData?.title?.trim() || conversationItem.conversationItem?.title?.trim() || `${(conversationItem.type || "").replace(/_/g, " ")} Item`;
  const description = itemData?.description?.trim();

  return (
    <div
      className="p-4 bg-muted/50 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge
            variant="outline"
            className={itemTypeColors[conversationItem.type as string] || itemTypeColors.QUESTION}
          >
            {(conversationItem.type || "").replace(/_/g, " ")}
          </Badge>
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

export interface ConversationTranscriptViewerProps {
  conversationItemResponses: ConversationItemResponse[];
  flatMessages?: Message[];
  conversationItems?: ConversationItem[];
  maxHeight?: number;
  className?: string;
}

export function ConversationTranscriptViewer({
  conversationItemResponses,
  flatMessages = [],
  conversationItems = [],
  maxHeight = 500,
  className,
}: ConversationTranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const query = searchQuery.trim().toLowerCase();

  const effectiveItemResponses = useMemo((): ConversationItemResponse[] => {
    if (conversationItemResponses.length > 0) {
      return conversationItemResponses;
    }
    if (flatMessages.length > 0) {
      return [
        {
          type: "DISCUSSION",
          conversationItem: { id: "synthetic-transcript", title: "Transcript" } as ConversationItem,
          messages: flatMessages,
        } as ConversationItemResponse,
      ];
    }
    return [];
  }, [conversationItemResponses, flatMessages]);

  const firstItemId = useMemo(() => {
    if (effectiveItemResponses.length === 0) return "";
    const item = effectiveItemResponses[0];
    return item.conversationItem?.id || item.conversationItemId || item.itemId || "synthetic-transcript";
  }, [effectiveItemResponses]);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() =>
    firstItemId ? new Set([firstItemId]) : new Set()
  );

  useEffect(() => {
    if (firstItemId && expandedItems.size === 0) {
      setExpandedItems(new Set([firstItemId]));
    }
  }, [firstItemId, expandedItems.size]);

  const conversationItemsLookup = useMemo(() => {
    const lookup: Record<string, { title?: string; description?: string }> = {};
    conversationItems.forEach((item) => {
      if (item.id) {
        lookup[item.id] = { title: item.title, description: item.description };
      }
    });
    effectiveItemResponses.forEach((r) => {
      const item = r.conversationItem;
      if (item?.id && !lookup[item.id]) {
        lookup[item.id] = { title: item.title, description: (item as { description?: string }).description };
      }
    });
    return lookup;
  }, [conversationItems, effectiveItemResponses]);

  const filteredItemResponses = useMemo(() => {
    if (!query) return effectiveItemResponses;
    return effectiveItemResponses.filter((itemResponse) => {
      const itemId = itemResponse.conversationItem?.id || itemResponse.conversationItemId || itemResponse.itemId || "";
      const itemData = conversationItemsLookup[itemId];
      const title = (itemData?.title || itemResponse.conversationItem?.title || "").toLowerCase();
      const description = (itemData?.description || "").toLowerCase();
      if (title.includes(query) || description.includes(query)) return true;
      const messages = itemResponse.messages || [];
      return messages.some((msg) => messageMatchesSearch(msg, query));
    });
  }, [effectiveItemResponses, query, conversationItemsLookup]);

  const getMessagesToShow = useCallback(
    (item: ConversationItemResponse): Message[] => {
      const messages = item.messages ?? [];
      if (!query) return messages;
      return messages.filter((msg) => messageMatchesSearch(msg, query));
    },
    [query]
  );

  const handleToggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set<string>();
    filteredItemResponses.forEach((item, idx) => {
      const id = item.conversationItem?.id || item.conversationItemId || item.itemId || `item-${idx}`;
      allIds.add(id);
    });
    setExpandedItems(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedItems(new Set());
  };

  const hasContent = filteredItemResponses.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center h-10 gap-2 rounded-md border border-input bg-background px-3 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 -mr-1"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {hasContent && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll}>
            Collapse All
          </Button>
        </div>
      )}

      <div className="space-y-4 pr-2 scrollbar-thin pb-4" style={{ maxHeight: `${maxHeight}px`, overflowY: "auto" }}>
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              {query ? "No messages match your search" : "No transcript content"}
            </p>
          </div>
        ) : (
          filteredItemResponses.map((itemResponse, idx) => {
            const itemId =
              itemResponse.conversationItem?.id ||
              itemResponse.conversationItemId ||
              itemResponse.itemId ||
              `item-${idx}`;
            const isExpanded = expandedItems.has(itemId);
            const messagesToShow = getMessagesToShow(itemResponse);

            return (
              <div key={itemId} className="space-y-2">
                <ConversationItemHeader
                  conversationItem={itemResponse}
                  conversationItemsLookup={conversationItemsLookup}
                  isExpanded={isExpanded}
                  onToggle={() => handleToggleItem(itemId)}
                  messageCount={messagesToShow.length}
                />
                {isExpanded && (
                  <div className="pl-4 space-y-2">
                    {messagesToShow.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        {query ? "No messages in this item match your search" : "No messages available"}
                      </p>
                    ) : (
                      messagesToShow.map((message, index) => (
                        <TranscriptMessageItem key={`${message.createdAt ?? index}-${index}`} message={message} />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
