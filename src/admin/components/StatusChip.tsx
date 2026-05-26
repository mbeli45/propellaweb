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

const prettify = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

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
        height: 22,
        fontSize: '0.75rem',
        ...rest.sx,
      }}
    />
  );
};

export default StatusChip;
