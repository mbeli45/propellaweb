import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Skeleton,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Title } from 'react-admin';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

// Mirrors the same basename logic as App.tsx / Layout.tsx so navigate() lands
// on the admin route instead of falling through to the outer app's catch-all.
const useAdminBasePath = () =>
  useMemo(() => {
    if (typeof window === 'undefined') return '/admin';
    const host = window.location.hostname;
    const isAdminSubdomain =
      host === 'admin.propellacam.com' ||
      host === 'admin.propella.cm' ||
      host === 'admin.propella.com';
    return isAdminSubdomain ? '' : '/admin';
  }, []);

// ----- Types --------------------------------------------------------------

interface KpiState {
  reservationsToday: number;
  revenueToday: number;
  newUsersToday: number;
  pendingWithdrawals: number;
  refundRequested: number;
  unresolvedReports: number;
  pendingVerifications: number;
}

interface RefundRow {
  id: string;
  amount: number;
  reservation_fee: number | null;
  refund_status: string | null;
  created_at: string;
  property: { title: string | null } | null;
  user: { full_name: string | null; email: string | null } | null;
}

interface RecentReservation {
  id: string;
  status: string;
  payment_status: string | null;
  amount: number;
  created_at: string;
  property: { title: string | null } | null;
  user: { full_name: string | null } | null;
}

// ----- Helpers ------------------------------------------------------------

const startOfTodayIso = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const formatXaf = (n: number) =>
  `${Math.round(n).toLocaleString('en-US')} XAF`;

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
};

// ----- KPI card -----------------------------------------------------------

interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  delta?: { value: string; tone?: 'positive' | 'negative' | 'neutral' };
  tone?: 'primary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

const toneToColors = {
  primary: { bg: Colors.primary[50], fg: Colors.primary[600] },
  success: { bg: Colors.success[50], fg: Colors.success[700] },
  warning: { bg: Colors.warning[50], fg: Colors.warning[700] },
  error: { bg: Colors.error[50], fg: Colors.error[700] },
} as const;

const KpiCard = ({ icon, label, value, delta, tone = 'primary', loading }: KpiCardProps) => {
  const c = toneToColors[tone];
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={120} height={36} />
            ) : (
              <Typography variant="h4" fontWeight={700} color="text.primary">
                {value}
              </Typography>
            )}
            {delta && !loading && (
              <Typography
                variant="caption"
                sx={{
                  color:
                    delta.tone === 'positive'
                      ? Colors.success[700]
                      : delta.tone === 'negative'
                        ? Colors.error[700]
                        : Colors.neutral[600],
                  fontWeight: 500,
                }}
              >
                {delta.value}
              </Typography>
            )}
          </Stack>
          <Avatar
            sx={{
              bgcolor: c.bg,
              color: c.fg,
              width: 44,
              height: 44,
              borderRadius: 2,
            }}
            variant="rounded"
          >
            <Icon icon={icon} width={22} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ----- Dashboard ----------------------------------------------------------

const Dashboard = () => {
  const navigate = useNavigate();
  const base = useAdminBasePath();
  const adminPath = (p: string) => `${base}${p}`;
  const [kpis, setKpis] = useState<KpiState | null>(null);
  const [refundQueue, setRefundQueue] = useState<RefundRow[]>([]);
  const [recent, setRecent] = useState<RecentReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const todayIso = useMemo(() => startOfTodayIso(), []);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        // Run aggregates and lookups in parallel.
        const [
          reservationsTodayRes,
          revenueTodayRes,
          newUsersTodayRes,
          pendingWithdrawalsRes,
          refundRequestedRes,
          unresolvedReportsRes,
          pendingVerificationsRes,
          refundQueueRes,
          recentRes,
        ] = await Promise.all([
          supabase
            .from('reservations')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', todayIso),
          supabase
            .from('transactions')
            .select('amount')
            .eq('type', 'platform_commission')
            .gte('created_at', todayIso),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', todayIso),
          supabase
            .from('withdrawal_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('reservations')
            .select('id', { count: 'exact', head: true })
            .eq('refund_requested', true)
            .neq('refund_status', 'refunded'),
          supabase
            .from('content_reports')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('agent_verifications')
            .select('id', { count: 'exact', head: true })
            .eq('verification_status', 'pending'),
          supabase
            .from('reservations')
            .select('id, amount, reservation_fee, refund_status, created_at, property:property_id(title), user:user_id(full_name, email)')
            .eq('refund_requested', true)
            .neq('refund_status', 'refunded')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('reservations')
            .select('id, status, payment_status, amount, created_at, property:property_id(title), user:user_id(full_name)')
            .order('created_at', { ascending: false })
            .limit(6),
        ]);

        if (!alive) return;

        const revenueToday = (revenueTodayRes.data ?? []).reduce(
          (sum, row: any) => sum + Number(row.amount ?? 0),
          0,
        );

        setKpis({
          reservationsToday: reservationsTodayRes.count ?? 0,
          revenueToday,
          newUsersToday: newUsersTodayRes.count ?? 0,
          pendingWithdrawals: pendingWithdrawalsRes.count ?? 0,
          refundRequested: refundRequestedRes.count ?? 0,
          unresolvedReports: unresolvedReportsRes.count ?? 0,
          pendingVerifications: pendingVerificationsRes.count ?? 0,
        });
        setRefundQueue(((refundQueueRes.data ?? []) as unknown) as RefundRow[]);
        setRecent(((recentRes.data ?? []) as unknown) as RecentReservation[]);
      } catch (err) {
        console.error('Dashboard load failed', err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [todayIso]);

  return (
    <Box>
      <Title title="Dashboard" />

      {/* Heading */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Typography>
        </Box>
      </Stack>

      {/* KPI row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <KpiCard
          icon="lucide:calendar-check"
          label="Reservations today"
          value={kpis?.reservationsToday ?? 0}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          icon="lucide:coins"
          label="Platform revenue today"
          value={loading ? '—' : formatXaf(kpis?.revenueToday ?? 0)}
          tone="success"
          loading={loading}
        />
        <KpiCard
          icon="lucide:user-plus"
          label="New users today"
          value={kpis?.newUsersToday ?? 0}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          icon="lucide:arrow-down-circle"
          label="Pending withdrawals"
          value={kpis?.pendingWithdrawals ?? 0}
          tone={kpis && kpis.pendingWithdrawals > 0 ? 'warning' : 'primary'}
          loading={loading}
        />
      </Box>

      {/* Action queue + recent activity */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 2,
        }}
      >
        {/* Refund queue */}
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  variant="rounded"
                  sx={{ bgcolor: Colors.warning[50], color: Colors.warning[700], width: 36, height: 36, borderRadius: 1.5 }}
                >
                  <Icon icon="lucide:undo-2" width={18} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Refund queue
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reservations awaiting refund processing
                  </Typography>
                </Box>
              </Stack>
              {kpis && kpis.refundRequested > 0 && (
                <Chip
                  size="small"
                  label={kpis.refundRequested}
                  sx={{ bgcolor: Colors.warning[100], color: Colors.warning[800], fontWeight: 700 }}
                />
              )}
            </Stack>

            {loading ? (
              <Stack spacing={1}>
                {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}
              </Stack>
            ) : refundQueue.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Icon icon="lucide:check-circle-2" width={36} style={{ opacity: 0.4 }} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  No pending refunds. Nice.
                </Typography>
              </Box>
            ) : (
              <Stack divider={<Divider flexItem />}>
                {refundQueue.map((r) => (
                  <Box
                    key={r.id}
                    onClick={() => navigate(adminPath(`/reservations/${r.id}`))}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: Colors.neutral[50] },
                      borderRadius: 1,
                      px: 1,
                      mx: -1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          bgcolor: r.refund_status === 'failed' ? Colors.error[50] : Colors.warning[50],
                          color: r.refund_status === 'failed' ? Colors.error[700] : Colors.warning[700],
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                        }}
                      >
                        <Icon icon={r.refund_status === 'failed' ? 'lucide:alert-circle' : 'lucide:clock'} width={18} />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {r.property?.title ?? 'Untitled property'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {r.user?.full_name ?? r.user?.email ?? 'Unknown user'} · {timeAgo(r.created_at)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {formatXaf(Number(r.reservation_fee ?? r.amount ?? 0))}
                      </Typography>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <Icon icon="lucide:chevron-right" width={18} />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Moderation summary */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Needs attention
            </Typography>
            <Stack spacing={1.5}>
              <AttentionRow
                icon="lucide:flag"
                label="Content reports"
                value={kpis?.unresolvedReports ?? 0}
                tone="error"
                onClick={() => navigate(adminPath('/content_reports'))}
                loading={loading}
              />
              <AttentionRow
                icon="lucide:shield-check"
                label="Verifications pending"
                value={kpis?.pendingVerifications ?? 0}
                tone="warning"
                onClick={() => navigate(adminPath('/agent_verifications'))}
                loading={loading}
              />
              <AttentionRow
                icon="lucide:arrow-down-circle"
                label="Withdrawals pending"
                value={kpis?.pendingWithdrawals ?? 0}
                tone="warning"
                onClick={() => navigate(adminPath('/withdrawal_requests'))}
                loading={loading}
              />
              <AttentionRow
                icon="lucide:undo-2"
                label="Refunds queued"
                value={kpis?.refundRequested ?? 0}
                tone="warning"
                onClick={() => navigate(adminPath('/reservations?filter=%7B%22refund_requested%22%3Atrue%7D'))}
                loading={loading}
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Recent reservations */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Recent reservations
            </Typography>
            <Tooltip title="See all reservations">
              <IconButton size="small" onClick={() => navigate(adminPath('/reservations'))}>
                <Icon icon="lucide:arrow-right" width={18} />
              </IconButton>
            </Tooltip>
          </Stack>

          {loading ? (
            <Stack spacing={1}>
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={52} />)}
            </Stack>
          ) : recent.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No reservations yet.
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />}>
              {recent.map((r) => {
                const statusTone =
                  r.status === 'confirmed' || r.status === 'completed'
                    ? 'success'
                    : r.status === 'cancelled'
                      ? 'error'
                      : 'warning';
                const statusColors = toneToColors[statusTone as keyof typeof toneToColors] ?? toneToColors.warning;
                return (
                  <Box
                    key={r.id}
                    onClick={() => navigate(adminPath(`/reservations/${r.id}`))}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: Colors.neutral[50] },
                      borderRadius: 1,
                      px: 1,
                      mx: -1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                      <Avatar
                        variant="rounded"
                        sx={{ bgcolor: statusColors.bg, color: statusColors.fg, width: 36, height: 36, borderRadius: 1.5 }}
                      >
                        <Icon icon="lucide:home" width={18} />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {r.property?.title ?? 'Untitled property'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {r.user?.full_name ?? 'Unknown'} · {timeAgo(r.created_at)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
                      <Chip
                        size="small"
                        label={r.status}
                        sx={{ bgcolor: statusColors.bg, color: statusColors.fg, fontWeight: 600, textTransform: 'capitalize' }}
                      />
                      <Typography variant="body2" fontWeight={700}>
                        {formatXaf(Number(r.amount ?? 0))}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// ----- Attention row -----------------------------------------------------

interface AttentionRowProps {
  icon: string;
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'warning' | 'error';
  onClick: () => void;
  loading: boolean;
}

const AttentionRow = ({ icon, label, value, tone, onClick, loading }: AttentionRowProps) => {
  const c = toneToColors[tone];
  const isHot = value > 0;
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        py: 1,
        px: 1.5,
        mx: -1.5,
        borderRadius: 1.5,
        '&:hover': { bgcolor: Colors.neutral[50] },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar
          variant="rounded"
          sx={{
            bgcolor: isHot ? c.bg : Colors.neutral[100],
            color: isHot ? c.fg : Colors.neutral[500],
            width: 32,
            height: 32,
            borderRadius: 1,
          }}
        >
          <Icon icon={icon} width={16} />
        </Avatar>
        <Typography variant="body2" fontWeight={500}>
          {label}
        </Typography>
      </Stack>
      {loading ? (
        <Skeleton width={28} height={24} />
      ) : (
        <Chip
          size="small"
          label={value}
          sx={{
            bgcolor: isHot ? c.bg : Colors.neutral[100],
            color: isHot ? c.fg : Colors.neutral[600],
            fontWeight: 700,
            minWidth: 32,
          }}
        />
      )}
    </Box>
  );
};

export default Dashboard;
