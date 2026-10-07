import { dealDb } from './deals'

/** The caller's ID check, as returned by the identity_verification RPC. */
export interface IdentityState {
  can_post: boolean
  /** False for accounts created before the check existed, and for admins. */
  required: boolean
  front: boolean
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

export async function identityCommand(action: 'status' | 'save' | 'submit', side?: 'front' | 'back', path?: string) {
  const { data, error } = await dealDb.rpc('identity_verification', { p_action: action, p_side: side ?? null, p_path: path ?? null })
  if (error) throw error
  return data as IdentityState
}

/** Uploads one side of the ID to the private bucket and returns its storage path. */
export async function uploadIdentityDocument(userId: string, side: 'front' | 'back', body: Blob | ArrayBuffer, mime: string, size: number) {
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(mime) || size <= 0 || size > 10485760) {
    throw new Error('Choose a PDF, JPG or PNG file no larger than 10 MB.')
  }
  const extension = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg'
  const path = `${userId}/${side}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const { error } = await dealDb.storage.from('identity-documents').upload(path, body, { contentType: mime, upsert: false })
  if (error) throw error
  return path
}

/** Where a newly signed-up agent or landlord lands: the ID step if it is still to do, else the dashboard. */
export async function agentLandingRoute(): Promise<string> {
  try {
    return identityStage(await identityCommand('status')) === 'needed' ? '/agent/identity?onboarding=1' : '/agent'
  } catch {
    return '/agent'
  }
}
