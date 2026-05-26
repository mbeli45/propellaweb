import { ReactNode } from 'react';
import { useMediaQuery, Box, Card, CardContent, Typography, Stack, Skeleton, Avatar } from '@mui/material';
import { useListContext, useRecordContext, useCreatePath, RecordContextProvider, Link } from 'react-admin';
import { Icon } from '@iconify/react';
import { Colors } from '@/constants/Colors';

// Renders react-admin Datagrid children on desktop, a stacked card list on mobile.
// The mobile breakpoint matches the rest of the admin (md = 768 in our theme).
//
// Why this lives here: every resource list page wants the same desktop ↔ mobile
// flip, and the existing implementation was "horizontal-scroll a 10-column
// table on a 360 px screen", which is hostile. We render this fork once and
// each resource just supplies a card layout that fits the actual content.

interface ResponsiveListProps {
  /** Desktop content — typically a react-admin <Datagrid>. */
  desktop: ReactNode;
  /** Mobile card renderer for a single record. */
  card: ReactNode;
  /** Optional click target for the whole card. Defaults to `edit`. */
  rowClick?: 'edit' | 'show' | false;
  /** Optional breakpoint override. */
  mobileBreakpoint?: string;
}

export const ResponsiveList = ({
  desktop,
  card,
  rowClick = 'edit',
  mobileBreakpoint = '(max-width:768px)',
}: ResponsiveListProps) => {
  const isMobile = useMediaQuery(mobileBreakpoint);
  const { data, isLoading, resource } = useListContext();
  const createPath = useCreatePath();

  if (!isMobile) return <>{desktop}</>;

  if (isLoading) {
    return (
      <Stack spacing={1.5} sx={{ p: 1.5 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={96} />
        ))}
      </Stack>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ py: 8, px: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Icon icon="lucide:inbox" width={40} style={{ opacity: 0.4 }} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          No records match the current filters.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ p: 1.5 }}>
      {data.map((record: any) => {
        const path = rowClick ? createPath({ resource, id: record.id, type: rowClick }) : null;
        const content = (
          <RecordContextProvider value={record} key={record.id}>
            <Card
              sx={{
                cursor: path ? 'pointer' : 'default',
                transition: 'all 0.15s',
                '&:active': path ? { transform: 'scale(0.99)' } : {},
              }}
            >
              <CardContent sx={{ '&:last-child': { pb: 2 } }}>{card}</CardContent>
            </Card>
          </RecordContextProvider>
        );
        return path ? (
          <Link to={path} key={record.id} sx={{ textDecoration: 'none' }}>
            {content}
          </Link>
        ) : (
          content
        );
      })}
    </Stack>
  );
};

// ----- Building blocks for card content ----------------------------------

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  avatar?: ReactNode;
  /** Right-aligned status/badge content. */
  right?: ReactNode;
}

export const CardHeader = ({ title, subtitle, avatar, right }: CardHeaderProps) => (
  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
      {avatar}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
    {right && <Box sx={{ flexShrink: 0 }}>{right}</Box>}
  </Stack>
);

interface CardRowProps {
  label: ReactNode;
  value: ReactNode;
}

export const CardRow = ({ label, value }: CardRowProps) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.25 }}>
    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, mr: 1 }}>
      {label}
    </Typography>
    <Box sx={{ minWidth: 0, textAlign: 'right' }}>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </Typography>
      ) : (
        value
      )}
    </Box>
  </Stack>
);

// Small avatar used in card headers — coloured by tone, single-icon.
interface IconAvatarProps {
  icon: string;
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
}

export const IconAvatar = ({ icon, tone = 'primary' }: IconAvatarProps) => {
  const c = {
    primary: { bg: Colors.primary[50], fg: Colors.primary[700] },
    success: { bg: Colors.success[50], fg: Colors.success[700] },
    warning: { bg: Colors.warning[50], fg: Colors.warning[700] },
    error: { bg: Colors.error[50], fg: Colors.error[700] },
    neutral: { bg: Colors.neutral[100], fg: Colors.neutral[700] },
  }[tone];
  return (
    <Avatar variant="rounded" sx={{ bgcolor: c.bg, color: c.fg, width: 40, height: 40, borderRadius: 1.5, flexShrink: 0 }}>
      <Icon icon={icon} width={20} />
    </Avatar>
  );
};

// Helper to read a record value safely from outside the RecordContext provider.
export const useRecord = <T extends Record<string, any>>(): T | null => {
  const r = useRecordContext();
  return (r as T) || null;
};
