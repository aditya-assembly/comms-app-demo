export const CONVO_DOMAIN = import.meta.env.VITE_CONVO_DOMAIN || "https://convo.assembly-industries.com";

export function getConversationUrl(conversationId: string, allowAnyoneToStartConversation?: boolean): string {
  const baseUrl = `${CONVO_DOMAIN}/c/${conversationId}`;
  return allowAnyoneToStartConversation ? `${baseUrl}/public` : baseUrl;
}

export const CONVERSATION_CREATION_DELAY_MS = 2000;

export const CONVERSATION_ITEM_TYPES = [
  "QUESTION",
  "DISCUSSION",
  "MEDIA_REQUEST",
  "REVIEW_MATERIAL",
  "WALK_THROUGH",
  "FORM_DATA",
  "CUSTOMER_SUPPORT",
  "SUMMARY",
] as const;

export const CONVERSATION_ITEM_TYPE_QUESTION = "QUESTION";
export const CONVERSATION_ITEM_TYPE_DISCUSSION = "DISCUSSION";
export const CONVERSATION_ITEM_TYPE_MEDIA_REQUEST = "MEDIA_REQUEST";
export const CONVERSATION_ITEM_TYPE_REVIEW_MATERIAL = "REVIEW_MATERIAL";
export const CONVERSATION_ITEM_TYPE_WALK_THROUGH = "WALK_THROUGH";
export const CONVERSATION_ITEM_TYPE_FORM_DATA = "FORM_DATA";
export const CONVERSATION_ITEM_TYPE_CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT";
export const CONVERSATION_ITEM_TYPE_SUMMARY = "SUMMARY";

export const FORM_FIELD_TYPE_STRING = "STRING";
export const FORM_FIELD_TYPE_STRING_ARRAY = "STRING_ARRAY";
export const FORM_FIELD_TYPE_NUMBER_INTEGER = "NUMBER_INTEGER";
export const FORM_FIELD_TYPE_NUMBER_DOUBLE = "NUMBER_DOUBLE";
export const FORM_FIELD_TYPE_BOOLEAN = "BOOLEAN";
export const FORM_FIELD_TYPE_DATE = "DATE";
export const FORM_FIELD_TYPE_JSON = "JSON";
