import { ReactNode } from 'react';
import { Box, Stack, Typography, Divider, Avatar } from '@mui/material';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { Colors } from '@/constants/Colors';

// Shared chrome for admin detail pages. Replaces the cramped two-column
// "summary card next to a form" pattern with a single-column flow that has:
//   - a sticky-style hero at top (back link, title, status, key amount, actions)
//   - clearly-labelled sections separated by whitespace, not heavy card borders
//   - a metadata strip for IDs / timestamps that previously cluttered the form
//
// Each piece is composable — a resource detail page typically renders a single
// <DetailHero> followed by <DetailSection>s. The Edit form itself lives inside
// one of the sections so the read context surrounds it instead of fighting it.

// ----- DetailHero --------------------------------------------------------

interface DetailHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Large amount / primary value to anchor the hero (e.g. "10,000 XAF"). */
  amount?: ReactNode;
  /** Status / payment chips rendered under the amount. */
  badges?: ReactNode;
  /** Right-aligned action buttons (refund, approve, etc.). */
  actions?: ReactNode;
  /** Small metadata strip rendered below the hero (id, created, agent, etc.). */
  meta?: ReactNode;
  /** Path to navigate back to on the back arrow click. Defaults to history.back(). */
  backTo?: string;
}

export const DetailHero = ({
  eyebrow,
  title,
  amount,
  badges,
  actions,
  meta,
  backTo,
}: DetailHeroProps) => {
  const navigate = useNavigate();
  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 2, color: Colors.neutral[600] }}>
        <Box
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            fontSize: '0.8125rem',
            fontWeight: 500,
            '&:hover': { color: Colors.primary[600] },
          }}
        >
          <Icon icon="lucide:arrow-left" width={16} />
          <span>Back</span>
        </Box>
        {eyebrow && (
          <>
            <Box sx={{ mx: 0.5, color: Colors.neutral[400] }}>·</Box>
            <Box sx={{ fontSize: '0.8125rem' }}>{eyebrow}</Box>
          </>
        )}
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, color: Colors.neutral[900], lineHeight: 1.2 }}
          >
            {title}
          </Typography>
          {amount && (
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mt: 1, color: Colors.neutral[900] }}
            >
              {amount}
            </Typography>
          )}
          {badges && <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>{badges}</Stack>}
        </Box>
        {actions && (
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            {actions}
          </Stack>
        )}
      </Stack>

      {meta && (
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${Colors.neutral[200]}` }}>
          <Stack
            direction="row"
            spacing={{ xs: 2, md: 4 }}
            useFlexGap
            sx={{ flexWrap: 'wrap', color: Colors.neutral[600], fontSize: '0.8125rem' }}
          >
            {meta}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

// Small key/value cell used inside the hero meta strip.
export const MetaItem = ({ label, value }: { label: ReactNode; value: ReactNode }) => (
  <Box>
    <Typography variant="caption" sx={{ display: 'block', color: Colors.neutral[500], fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: Colors.neutral[900], fontWeight: 500, fontSize: '0.8125rem' }}>
      {value}
    </Typography>
  </Box>
);

// ----- DetailSection -----------------------------------------------------

interface DetailSectionProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned helper content next to the title (count chip, link, etc.). */
  aside?: ReactNode;
  /** When true, removes the bottom divider — use on the last section. */
  noDivider?: boolean;
  children: ReactNode;
}

export const DetailSection = ({ title, description, aside, noDivider, children }: DetailSectionProps) => (
  <Box sx={{ py: 4, '&:first-of-type': { pt: 0 } }}>
    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }} spacing={2}>
      <Box>
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem', color: Colors.neutral[900] }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: Colors.neutral[600], mt: 0.25 }}>
            {description}
          </Typography>
        )}
      </Box>
      {aside && <Box sx={{ flexShrink: 0 }}>{aside}</Box>}
    </Stack>
    {children}
    {!noDivider && <Divider sx={{ mt: 4 }} />}
  </Box>
);

// ----- DetailGrid --------------------------------------------------------

interface DetailGridProps {
  /** Number of columns at the lg breakpoint. Defaults to 2. */
  cols?: 1 | 2 | 3;
  children: ReactNode;
}

export const DetailGrid = ({ cols = 2, children }: DetailGridProps) => (
  <Box
    sx={{
      display: 'grid',
      gap: 2,
      gridTemplateColumns: {
        xs: '1fr',
        sm: cols >= 2 ? '1fr 1fr' : '1fr',
        lg: cols === 3 ? 'repeat(3, 1fr)' : cols === 2 ? '1fr 1fr' : '1fr',
      },
    }}
  >
    {children}
  </Box>
);

// ----- DetailField -------------------------------------------------------

interface DetailFieldProps {
  label: ReactNode;
  value: ReactNode;
  /** When true, the field spans a vertical layout (label above value) instead
   *  of horizontal. Default vertical because we render inside DetailGrid. */
  inline?: boolean;
}

export const DetailField = ({ label, value, inline }: DetailFieldProps) => {
  if (inline) {
    return (
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
        <Typography variant="body2" sx={{ color: Colors.neutral[600] }}>
          {label}
        </Typography>
        <Box sx={{ color: Colors.neutral[900], fontSize: '0.875rem', fontWeight: 500, textAlign: 'right' }}>
          {value}
        </Box>
      </Stack>
    );
  }
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          color: Colors.neutral[500],
          fontWeight: 600,
          fontSize: '0.6875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ color: Colors.neutral[900], fontSize: '0.875rem', fontWeight: 500 }}>{value}</Box>
    </Box>
  );
};

// ----- DetailEntityCard ---------------------------------------------------

interface DetailEntityCardProps {
  icon: string;
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  label: ReactNode;
  value: ReactNode;
  secondary?: ReactNode;
}

const TONE: Record<NonNullable<DetailEntityCardProps['tone']>, { bg: string; fg: string }> = {
  primary: { bg: Colors.primary[50], fg: Colors.primary[700] },
  success: { bg: Colors.success[50], fg: Colors.success[700] },
  warning: { bg: Colors.warning[50], fg: Colors.warning[700] },
  error: { bg: Colors.error[50], fg: Colors.error[700] },
  neutral: { bg: Colors.neutral[100], fg: Colors.neutral[700] },
};

// Inline row: icon avatar + stacked label/value. No background, no border —
// just typography + a small coloured icon for affordance. Fits flat layout.
export const DetailEntityCard = ({ icon, tone = 'primary', label, value, secondary }: DetailEntityCardProps) => {
  const c = TONE[tone];
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1 }}>
      <Avatar
        variant="rounded"
        sx={{ bgcolor: c.bg, color: c.fg, width: 36, height: 36, flexShrink: 0 }}
      >
        <Icon icon={icon} width={18} />
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: Colors.neutral[500],
            fontWeight: 600,
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'block',
            mb: 0.25,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ color: Colors.neutral[900], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {value}
        </Typography>
        {secondary && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: Colors.neutral[600],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {secondary}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ----- DetailPage shell --------------------------------------------------

// Flat container. No card chrome — just constrained width and breathing room.
interface DetailPageProps {
  children: ReactNode;
}

export const DetailPage = ({ children }: DetailPageProps) => (
  <Box sx={{ maxWidth: 1100, mx: 'auto', py: { xs: 1, md: 2 } }}>{children}</Box>
);

// ----- BackBar -----------------------------------------------------------

// Standalone back link + title for resource Edit pages that haven't been
// rewritten to use the full DetailPage / DetailHero pattern (Profiles,
// Properties, etc.). Lives at the top of the form so admins always have an
// exit even when react-admin's Edit doesn't provide one.
interface BackBarProps {
  title?: ReactNode;
  backTo?: string;
  /** Optional right-aligned action area (Save button gets rendered by SimpleForm). */
  right?: ReactNode;
}

export const BackBar = ({ title, backTo, right }: BackBarProps) => {
  const navigate = useNavigate();
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 3, mt: 1 }}
      spacing={2}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
        <Box
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            cursor: 'pointer',
            color: Colors.neutral[700],
            border: `1px solid ${Colors.neutral[200]}`,
            bgcolor: Colors.white,
            transition: 'all 120ms',
            flexShrink: 0,
            '&:hover': {
              borderColor: Colors.primary[400],
              color: Colors.primary[600],
            },
          }}
          role="button"
          aria-label="Back"
        >
          <Icon icon="lucide:arrow-left" width={16} />
        </Box>
        {title && (
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ fontSize: '1rem', color: Colors.neutral[900], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {title}
          </Typography>
        )}
      </Stack>
      {right && <Box sx={{ flexShrink: 0 }}>{right}</Box>}
    </Stack>
  );
};
