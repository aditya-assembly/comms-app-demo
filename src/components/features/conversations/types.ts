export interface ConversationItem {
  id: string;
  type: "QUESTION" | "DISCUSSION" | "MEDIA_REQUEST" | "REVIEW_MATERIAL" | "WALK_THROUGH" | "FORM_DATA" | "CUSTOMER_SUPPORT" | "SUMMARY";
  title?: string;
  description?: string;
  useMcp?: boolean;
  mcpContext?: string;
  ragAssistantID?: string;
  ragAssistantContext?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ConversationFormData {
  name: string;
  description: string;
  prompt?: string;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  chatWindowEnabled: boolean;
  allowAnyoneToStartConversation: boolean;
  summaryPrompt?: string;
  scoringRubric: {
    scoringRubricInstructions: string;
    criteria: Record<string, string>;
    jsonMode?: string;
    jsonSchema?: string;
  };
  language?: string;
  completionNotificationEmails?: string[];
  conversationItems: ConversationItem[];
}
