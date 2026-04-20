import type { BadgeVariant } from '@/lib/ui-variants'

/** Minimal stub for dashboard media UI; extend when Comms needs real badge mapping. */
export function getBadgeVariantForFileType(_mimeOrExt: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  return 'secondary'
}

const CONVERSATION_ITEM_TYPE_VARIANT: Record<string, BadgeVariant> = {
  QUESTION: 'infoSoft',
  DISCUSSION: 'infoSoft',
  MEDIA_REQUEST: 'warningSoft',
  REVIEW_MATERIAL: 'accentSoft',
  WALK_THROUGH: 'successSoft',
  FORM_DATA: 'primarySoft',
  CUSTOMER_SUPPORT: 'infoSoft',
  SUMMARY: 'muted',
}

const DEFAULT_BADGE_VARIANT: BadgeVariant = 'outline'

/** Conversation item type → badge variant (session detail pills; ported from orchestrator dashboard). */
export function getBadgeVariantForConversationItemType(type: string): BadgeVariant {
  return CONVERSATION_ITEM_TYPE_VARIANT[type] ?? DEFAULT_BADGE_VARIANT
}
