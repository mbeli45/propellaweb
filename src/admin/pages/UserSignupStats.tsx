import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { Title } from 'react-admin';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

// ---- Types ------------------------------------------------------------------

interface SignupRow {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  role: string | null;
}

interface DayBucket {
  date: string; // 'YYYY-MM-DD'
  count: number;
}

// ---- Helpers ----------------------------------------------------------------

const toLocalDate = (iso: string) => iso.slice(0, 10); // 'YYYY-MM-DD'

const formatLabel = (yyyyMmDd: string) => {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatFull = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ---- Quick-range presets ----------------------------------------------------

const presets = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
] as const;

const todayStr = () => new Date().toISOString().slice(0, 10);
const offsetDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days + 1);
  return d.toISOString().slice(0, 10);
};

// ---- Bar chart --------------------------------------------------------------

const BarChart = ({ buckets, loading }: { buckets: DayBucket[]; loading: boolean }) => {
  const max = Math.max(...buckets.map((b) => b.count), 1);

  if (loading) {
    return (
      <Stack direction="row" alignItems="flex-end" spacing={0.5} sx={{ height: 120 }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width="100%" height={`${30 + Math.random() * 70}%`} />
        ))}
      </Stack>
    );
  }

  if (buckets.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
        <Icon icon="lucide:bar-chart-3" width={36} style={{ opacity: 0.3 }} />
        <Typography variant="body2" sx={{ mt: 1 }}>
          No signups in this period.
        </Typography>
      </Box>
    );
  }

  // Thin bars when many days; wider when few.
  const showLabel = buckets.length <= 14;

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Stack
        direction="row"
        alignItems="flex-end"
        spacing={buckets.length > 60 ? 0.25 : 0.5}
        sx={{ height: 140, minWidth: buckets.length > 60 ? buckets.length * 6 : 'unset' }}
      >
        {buckets.map((b) => {
          const heightPct = Math.max((b.count / max) * 100, b.count > 0 ? 4 : 0);
          return (
            <Tooltip
              key={b.date}
              title={`${formatLabel(b.date)}: ${b.count} signup${b.count !== 1 ? 's' : ''}`}
              placement="top"
              arrow
            >
              <Stack alignItems="center" sx={{ flex: 1, minWidth: 0, cursor: 'default' }}>
                <Box
                  sx={{
                    width: '100%',
                    height: `${heightPct}%`,
                    bgcolor: b.count > 0 ? Colors.primary[500] : Colors.neutral[200],
                    borderRadius: '3px 3px 0 0',
                    transition: 'background-color 150ms',
                    '&:hover': { bgcolor: b.count > 0 ? Colors.primary[700] : Colors.neutral[300] },
                  }}
                />
                {showLabel && (
                  <Typography
                    variant="caption"
                    noWrap
                    sx={{
                      fontSize: '0.6rem',
                      color: Colors.neutral[500],
                      mt: 0.5,
                      transform: 'rotate(-45deg)',
                      transformOrigin: 'top left',
                      display: 'block',
                      height: 28,
                      width: 36,
                    }}
                  >
                    {formatLabel(b.date)}
                  </Typography>
                )}
              </Stack>
            </Tooltip>
          );
        })}
      </Stack>
    </Box>
  );
};

// ---- Stat card --------------------------------------------------------------

const StatCard = ({
  icon,
  label,
  value,
  tone = 'primary',
  loading,
}: {
  icon: string;
  label: string;
  value: string | number;
  tone?: 'primary' | 'success' | 'warning';
  loading?: boolean;
}) => {
  const colors = {
    primary: { bg: Colors.primary[50], fg: Colors.primary[600] },
    success: { bg: Colors.success[50], fg: Colors.success[700] },
    warning: { bg: Colors.warning[50], fg: Colors.warning[700] },
  };
  const c = colors[tone];
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.5}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}
            >
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={80} height={36} />
            ) : (
              <Typography variant="h4" fontWeight={700}>
                {value}
              </Typography>
            )}
          </Stack>
          <Avatar
            variant="rounded"
            sx={{ bgcolor: c.bg, color: c.fg, width: 44, height: 44, borderRadius: 2 }}
          >
            <Icon icon={icon} width={22} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ---- Role chip --------------------------------------------------------------

const roleColors: Record<string, { bg: string; fg: string }> = {
  admin: { bg: Colors.error[50], fg: Colors.error[700] },
  agent: { bg: Colors.primary[50], fg: Colors.primary[700] },
  landlord: { bg: Colors.success[50], fg: Colors.success[700] },
};

const RoleChip = ({ role }: { role: string | null }) => {
  const r = role ?? 'user';
  const c = roleColors[r] ?? { bg: Colors.neutral[100], fg: Colors.neutral[700] };
  return (
    <Chip
      size="small"
      label={r}
      sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600, textTransform: 'capitalize' }}
    />
  );
};

// ---- Page -------------------------------------------------------------------

const UserSignupStats = () => {
  const [from, setFrom] = useState(offsetDate(30));
  const [to, setTo] = useState(todayStr());
  const [activePreset, setActivePreset] = useState<number>(30);
  const [rows, setRows] = useState<SignupRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all signups in [from, to] range
  useEffect(() => {
    let alive = true;
    setLoading(true);

    const load = async () => {
      try {
        const startIso = `${from}T00:00:00.000Z`;
        const endIso = `${to}T23:59:59.999Z`;

        const { data } = await supabase
          .from('profiles')
          .select('id, email, full_name, created_at, role')
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false });

        if (!alive) return;
        setRows((data ?? []) as SignupRow[]);
      } catch (err) {
        console.error('UserSignupStats load failed', err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [from, to]);

  // Build a bucket per day in the date range (even zero-count days)
  const buckets = useMemo<DayBucket[]>(() => {
    const countByDay: Record<string, number> = {};
    for (const r of rows) {
      const day = toLocalDate(r.created_at);
      countByDay[day] = (countByDay[day] ?? 0) + 1;
    }

    const result: DayBucket[] = [];
    const cur = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      result.push({ date: key, count: countByDay[key] ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }, [rows, from, to]);

  const peakBucket = useMemo(
    () => buckets.reduce((a, b) => (b.count > a.count ? b : a), { date: '', count: 0 }),
    [buckets],
  );

  const avgPerDay =
    buckets.length > 0
      ? (rows.length / buckets.length).toFixed(1)
      : '0';

  const applyPreset = (days: number) => {
    setActivePreset(days);
    setFrom(offsetDate(days));
    setTo(todayStr());
  };

  return (
    <Box>
      <Title title="User Signup Stats" />

      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            User Signups
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track new account registrations over time
          </Typography>
        </Box>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} flexWrap="wrap">
            <Stack direction="row" spacing={0.75} flexWrap="wrap">
              {presets.map((p) => (
                <Chip
                  key={p.days}
                  label={p.label}
                  size="small"
                  onClick={() => applyPreset(p.days)}
                  sx={{
                    fontWeight: 600,
                    bgcolor: activePreset === p.days ? Colors.primary[600] : Colors.neutral[100],
                    color: activePreset === p.days ? Colors.white : Colors.neutral[700],
                    '&:hover': {
                      bgcolor: activePreset === p.days ? Colors.primary[700] : Colors.neutral[200],
                    },
                  }}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField
                label="From"
                type="date"
                size="small"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setActivePreset(0);
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: to }}
              />
              <Typography color="text.secondary" variant="body2">
                to
              </Typography>
              <TextField
                label="To"
                type="date"
                size="small"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setActivePreset(0);
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: from, max: todayStr() }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 2,
        }}
      >
        <StatCard
          icon="lucide:user-plus"
          label="Signups in range"
          value={loading ? '—' : rows.length}
          tone="primary"
          loading={loading}
        />
        <StatCard
          icon="lucide:trending-up"
          label="Avg / day"
          value={loading ? '—' : avgPerDay}
          tone="success"
          loading={loading}
        />
        <StatCard
          icon="lucide:zap"
          label={peakBucket.date ? `Peak (${formatLabel(peakBucket.date)})` : 'Peak day'}
          value={loading ? '—' : peakBucket.count}
          tone="warning"
          loading={loading}
        />
      </Box>

      {/* Bar chart */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Daily signups
          </Typography>
          <BarChart buckets={buckets} loading={loading} />
        </CardContent>
      </Card>

      {/* Signup list */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Users who joined
            </Typography>
            {!loading && (
              <Chip
                size="small"
                label={rows.length}
                sx={{ bgcolor: Colors.primary[50], color: Colors.primary[700], fontWeight: 700 }}
              />
            )}
          </Stack>

          {loading ? (
            <Stack spacing={1}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rounded" height={52} />
              ))}
            </Stack>
          ) : rows.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
              <Icon icon="lucide:users" width={36} style={{ opacity: 0.3 }} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                No signups in this date range.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto auto',
                  gap: 0,
                  minWidth: 480,
                }}
              >
                {/* Header row */}
                {(['Name / Email', 'Joined', 'Role'] as const).map((h, i) => (
                  <Typography
                    key={h}
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: Colors.neutral[500],
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      px: 1.5,
                      py: 1,
                      bgcolor: Colors.neutral[50],
                      borderBottom: `1px solid ${Colors.neutral[200]}`,
                      gridColumn: i === 2 ? 'span 2' : 'auto',
                    }}
                  >
                    {h}
                  </Typography>
                ))}

                {rows.map((r, idx) => {
                  const isEven = idx % 2 === 0;
                  const bg = isEven ? Colors.white : Colors.neutral[50];
                  const cellSx = {
                    px: 1.5,
                    py: 1,
                    bgcolor: bg,
                    borderBottom: `1px solid ${Colors.neutral[100]}`,
                    display: 'flex',
                    alignItems: 'center',
                  };

                  return [
                    <Box key={`name-${r.id}`} sx={cellSx}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: Colors.primary[100], color: Colors.primary[700], fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                          {(r.full_name ?? r.email ?? '?')[0]?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {r.full_name ?? '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {r.email ?? '—'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>,
                    <Box key={`date-${r.id}`} sx={cellSx}>
                      <Typography variant="body2" color="text.secondary">
                        {formatFull(r.created_at)}
                      </Typography>
                    </Box>,
                    <Box key={`role-${r.id}`} sx={{ ...cellSx, gridColumn: 'span 2' }}>
                      <RoleChip role={r.role} />
                    </Box>,
                  ];
                })}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserSignupStats;
