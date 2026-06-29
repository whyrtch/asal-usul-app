/**
 * Canonical analytics event names + typed parameter shapes for AsalUsul.
 *
 * Keeping event names in one place avoids typos and makes the funnel auditable.
 * These names map 1:1 to the events you'll see in Firebase Analytics once a
 * real provider is wired in (see src/services/analytics/index.ts).
 *
 * Phase 1 — 4.4 Observability.
 */

export const AnalyticsEvents = {
  /** User completed Google sign-in. */
  SIGN_IN: 'sign_in',
  /** User signed out. */
  SIGN_OUT: 'sign_out',
  /** A family tree was created. */
  TREE_CREATED: 'tree_created',
  /** A family tree was deleted. */
  TREE_DELETED: 'tree_deleted',
  /** A family tree detail screen was opened. */
  TREE_VIEWED: 'tree_viewed',
  /** A member was added to a tree. */
  MEMBER_ADDED: 'member_added',
  /** A member was deleted. */
  MEMBER_DELETED: 'member_deleted',
  /** A photo was uploaded for a member/cover. */
  PHOTO_ADDED: 'photo_added',
  /** An invitation was sent by an owner. */
  INVITE_SENT: 'invite_sent',
  /** An invitation was accepted by an invitee. */
  INVITE_ACCEPTED: 'invite_accepted',
  /** An invitation was declined by an invitee. */
  INVITE_DECLINED: 'invite_declined',
  /** A collaborator's access was revoked. */
  ACCESS_REVOKED: 'access_revoked',
  /** A collaborator's role was changed. */
  ROLE_CHANGED: 'role_changed',
  /** A tree shared with the user was opened. */
  SHARED_TREE_OPENED: 'shared_tree_opened',
  /** A configurable limit (trees/members) was reached. */
  LIMIT_REACHED: 'limit_reached',
  /** An upgrade prompt / paywall was shown (Phase 4). */
  UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
  /** The user tapped a (candidate premium) export action. */
  EXPORT_CLICKED: 'export_clicked',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/** Loose parameter bag accepted by analytics events. */
export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;
