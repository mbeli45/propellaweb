import { Chip, ChipProps } from '@mui/material';
import { useRecordContext } from 'react-admin';
import { Colors } from '@/constants/Colors';

// Generic status → colour mapping shared across every list/detail surface.
// New status values land in `neutral` until explicitly classified, so the UI
// never silently lies about a value it doesn't recognise.
const TONE_MAP: Record<
  'success' | 'warning' | 'error' | 'info' | 'neutral',
  { bg: string; fg: string }
> = {
  success: { bg: Colors.success[100], fg: Colors.success[800] },
  warning: { bg: Colors.warning[100], fg: Colors.warning[800] },
  error: { bg: Colors.error[100], fg: Colors.error[800] },
  info: { bg: Colors.info[100], fg: Colors.info[800] },
  neutral: { bg: Colors.neutral[200], fg: Colors.neutral[700] },
};

const STATUS_TONE: Record<string, keyof typeof TONE_MAP> = {
  // success-like
  paid: 'success',
  completed: 'success',
  confirmed: 'success',
  refunded: 'success',
  approved: 'success',
  verified: 'success',
  active: 'success',
  available: 'success',
  resolved: 'success',
  success: 'success',
  released: 'success',

  // warning-like (in-progress / awaiting action)
  pending: 'warning',
  processing: 'warning',
  initiated: 'warning',
  requested: 'warning',
  in_review: 'warning',
  reviewing: 'warning',
  holding: 'warning',
  reserved: 'warning',
  open: 'warning',
  ongoing: 'warning',
  documents_review: 'warning',
  under_review: 'warning',
  changes_requested: 'warning',
  refund_due: 'warning',
  in_escrow: 'warning',
  held: 'warning',
  due: 'warning',

  // error-like
  failed: 'error',
  rejected: 'error',
  cancelled: 'error',
  expired: 'error',
  denied: 'error',
  disputed: 'error',
  closed: 'error',

  // neutral / unset
  none: 'neutral',
  archived: 'neutral',
  draft: 'neutral',
  unknown: 'neutral',
};

// Database values that read badly when simply de-underscored.
const LABELS: Record<string, string> = {
  documents_review: 'Awaiting review',
  under_review: 'Under review',
  changes_requested: 'Changes requested',
  refund_due: 'Refund due',
  in_escrow: 'In escrow',
};

// Sentence case: "payment_pending" → "Payment pending".
const prettify = (value: string) => {
  const key = value.toLowerCase().trim();
  if (LABELS[key]) return LABELS[key];
  const words = value.replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
};

interface StatusChipProps extends Omit<ChipProps, 'source'> {
  /** Field name on the record to read the status from. Defaults to `status`. */
  source?: string;
  /** When provided, overrides the value read from the record. */
  value?: string | null;
  /** When true, an unrecognised value gets the neutral tone instead of rendering nothing. */
  fallbackToNeutral?: boolean;
}

const StatusChip = ({ source = 'status', value, fallbackToNeutral = true, ...rest }: StatusChipProps) => {
  const record = useRecordContext();
  const raw = value ?? (record ? (record as any)[source] : null);

  if (raw === null || raw === undefined || raw === '') return null;

  const normalized = String(raw).toLowerCase().trim();
  const tone = STATUS_TONE[normalized] ?? (fallbackToNeutral ? 'neutral' : null);
  if (!tone) return null;
  const colors = TONE_MAP[tone];

  return (
    <Chip
      size="small"
      label={prettify(String(raw))}
      {...rest}
      sx={{
        bgcolor: colors.bg,
        color: colors.fg,
        fontWeight: 600,
        height: 24,
        fontSize: '0.75rem',
        borderRadius: '6px',
        '& .MuiChip-label': { px: 1 },
        // A dot keeps the tone readable for people who can't tell the colours apart.
        '&::before': { content: '""', width: 6, height: 6, borderRadius: '50%', bgcolor: colors.fg, ml: 1, mr: -0.25, flexShrink: 0 },
        ...rest.sx,
      }}
    />
  );
};

export default StatusChip;
