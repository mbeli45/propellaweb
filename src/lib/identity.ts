import { dealDb } from './deals'

/** Accounts that list on Propella and use the professional workspace (/agent). */
export const isListerRole = (role?: string | null) => role === 'agent' || role === 'landlord' || role === 'host'
/** Hotels and guest houses: they list stays only. */
export const isHostRole = (role?: string | null) => role === 'host'

/** The caller's ID check, as returned by the identity_verification RPC. */
export interface IdentityState {
  can_post: boolean
  /** False for accounts created before the check existed, and for admins. */
  required: boolean
  front: boolean
  selfie: boolean;
  selfie_required?: boolean;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  back: boolean
  submitted: boolean
  status: 'missing' | 'pending' | 'documents_review' | 'approved' | 'rejected'
  rejection_reason: string | null
}

/**
 * What the UI shows: nothing to do, ID needed before posting, or ID received and
 * listings waiting for approval.
 */
export type IdentityStage = 'clear' | 'needed' | 'review' | 'unavailable'

export const identityStage = (s: IdentityState | null): IdentityStage =>
  !s ? 'unavailable' : !s.required || s.status === 'approved' ? 'clear' : s.can_post ? 'review' : 'needed'

export async function identityCommand(action: 'status' | 'save' | 'submit', side?: 'front' | 'back' | 'selfie', path?: string) {
  const { data, error } = await dealDb.rpc('identity_verification', { p_action: action, p_side: side ?? null, p_path: path ?? null })
  if (error) throw error
  return data as IdentityState
}

/** Uploads one side of the ID to the private bucket and returns its storage path. */
export async function uploadIdentityDocument(userId: string, side: 'front' | 'back' | 'selfie', body: Blob | ArrayBuffer, mime: string, size: number) {
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(mime) || size <= 0 || size > 10485760) {
    throw new Error('Choose a PDF, JPG or PNG file no larger than 10 MB.')
  }
  if (side === 'selfie' && !['image/jpeg', 'image/png'].includes(mime)) {
    throw new Error('Choose a JPG or PNG photo no larger than 10 MB.');
  }
  const extension = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg'
  const path = `${userId}/${side}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const { error } = await dealDb.storage.from('identity-documents').upload(path, body, { contentType: mime, upsert: false })
  if (error) throw error
  return path
}

/** Where a newly signed-up agent, landlord or host lands: the ID step if it is still to do, else the dashboard. */
export async function agentLandingRoute(): Promise<string> {
  try {
    return identityStage(await identityCommand('status')) === 'needed' ? '/agent/identity?onboarding=1' : '/agent'
  } catch {
    return '/agent'
  }
}

/** Known server and storage messages, matched by their wording, and the message the user sees instead. */
const IDENTITY_ERRORS: [RegExp, string][] = [
  [/failed to fetch|network ?(request failed|error)|fetch failed|load failed|timed? ?out|offline/i, 'network'],
  [/sign in to continue|jwt|not authenticated|invalid claim|refresh token/i, 'signIn'],
  [/account required/i, 'role'],
  [/choose a pdf/i, 'fileType'],
  [/choose a jpg|jpg or png photo/i, 'photoType'],
  [/new copy of the rejected/i, 'rejectedCopy'],
  [/replace the rejected/i, 'replaceRejected'],
  [/locked during review/i, 'locked'],
  [/both sides/i, 'bothSides'],
  [/holding your id/i, 'selfie'],
  [/upload the document again|row-level security|payload too large|maximum allowed size|bucket/i, 'uploadFailed'],
]

/** The translation key for an ID upload or submission failure, never the raw database message. */
export function identityErrorKey(e: unknown): string {
  const message = String((e as { message?: unknown } | null)?.message ?? e ?? '')
  const hit = IDENTITY_ERRORS.find(([pattern]) => pattern.test(message))
  return `identity.errors.${hit ? hit[1] : 'generic'}`
}
