import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  InputAdornment,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Title, useNotify } from 'react-admin';
import { stayDb, stayQuote } from '@/lib/stays';

// Admin page for Propella Stays: deposit and commission terms, and refunds to pay back.

interface Settings {
  payments_enabled: boolean;
  commission_bps: number;
  payment_window: string; // Postgres interval, e.g. "12:00:00"
  free_cancel_days: number;
  updated_at: string;
  updated_by: string | null;
}

interface RefundRow {
  id: string;
  deposit_amount: number;
  check_in: string;
  check_out: string;
  cancelled_at: string | null;
  updated_at: string;
  property: { title: string } | null;
  guest: { full_name: string | null; phone: string | null; email: string | null } | null;
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;

/** "12:00:00", "1 day 02:00:00" or "12 hours" -> hours. */
const intervalHours = (value: string) => {
  const days = Number(/(\d+)\s+day/.exec(value)?.[1] || 0);
  const clock = /(\d+):(\d+)/.exec(value);
  const hours = clock ? Number(clock[1]) + Number(clock[2]) / 60 : Number(/(\d+)\s+hour/.exec(value)?.[1] || 0);
  return days * 24 + hours;
};

export default function StaySettings() {
  const notify = useNotify();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [editor, setEditor] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [percent, setPercent] = useState('12');
  const [windowHours, setWindowHours] = useState('12');
  const [freeDays, setFreeDays] = useState('2');
  const [saving, setSaving] = useState(false);
  const [refunds, setRefunds] = useState<RefundRow[] | null>(null);
  const [references, setReferences] = useState<Record<string, string>>({});
  const [busyRefund, setBusyRefund] = useState<string | null>(null);
  const [earned, setEarned] = useState<{ count: number; commission: number } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await stayDb.from('stay_settings').select('*').maybeSingle();
    if (error || !data) {
      notify(error?.message || 'Stay settings not found. Apply the stay deposits migration.', { type: 'error' });
      return;
    }
    const s = data as Settings;
    setSettings(s);
    setEnabled(s.payments_enabled);
    setPercent(String(s.commission_bps / 100));
    setWindowHours(String(intervalHours(s.payment_window)));
    setFreeDays(String(s.free_cancel_days));
    if (s.updated_by) {
      const { data: who } = await stayDb.from('profiles').select('full_name,email').eq('id', s.updated_by).maybeSingle();
      setEditor((who as { full_name?: string; email?: string } | null)?.full_name || (who as { email?: string } | null)?.email || null);
    } else setEditor(null);
  }, [notify]);

  const loadRefunds = useCallback(async () => {
    const { data, error } = await stayDb
      .from('stay_bookings')
      .select('id,deposit_amount,check_in,check_out,cancelled_at,updated_at,property:properties(title),guest:profiles!stay_bookings_guest_id_fkey(full_name,phone,email)')
      .eq('payment_status', 'refund_due')
      .order('updated_at', { ascending: true })
      .limit(100);
    if (error) notify(error.message, { type: 'error' });
    setRefunds((data || []) as unknown as RefundRow[]);
  }, [notify]);

  const loadEarnings = useCallback(async () => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data } = await stayDb
      .from('stay_bookings')
      .select('commission_amount')
      .eq('payment_status', 'released')
      .gte('released_at', since);
    const rows = (data || []) as { commission_amount: number }[];
    setEarned({ count: rows.length, commission: rows.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0) });
  }, []);

  useEffect(() => {
    load();
    loadRefunds();
    loadEarnings();
  }, [load, loadRefunds, loadEarnings]);

  const parsed = useMemo(() => {
    const p = Number(percent);
    const w = Number(windowHours);
    const f = Number(freeDays);
    const errors: Record<string, string> = {};
    if (!Number.isFinite(p) || p < 0 || p > 50) errors.percent = 'Between 0 and 50%';
    else if (Math.round(p * 100) !== p * 100) errors.percent = 'At most two decimals';
    if (!Number.isInteger(w) || w < 1 || w > 48) errors.window = 'Whole hours, 1 to 48';
    if (!Number.isInteger(f) || f < 0 || f > 30) errors.free = 'Whole days, 0 to 30';
    return { bps: Math.round(p * 100), window: w, free: f, errors };
  }, [percent, windowHours, freeDays]);

  const dirty =
    !!settings &&
    (enabled !== settings.payments_enabled ||
      parsed.bps !== settings.commission_bps ||
      parsed.window !== intervalHours(settings.payment_window) ||
      parsed.free !== settings.free_cancel_days);
  const valid = Object.keys(parsed.errors).length === 0;

  // Worked example with the values being edited.
  const example = stayQuote({ payments_enabled: true, commission_bps: parsed.bps, free_cancel_days: parsed.free }, 25000, 2);

  const save = async () => {
    if (!valid || !settings) return;
    if (enabled && !settings.payments_enabled &&
      !window.confirm('Turn on online deposits? New stay requests will require guests to pay a deposit by mobile money once the host accepts.')) return;
    setSaving(true);
    const { error, data } = await stayDb
      .from('stay_settings')
      .update({
        payments_enabled: enabled,
        commission_bps: parsed.bps,
        payment_window: `${parsed.window} hours`,
        free_cancel_days: parsed.free,
      })
      .eq('id', true)
      .select('id');
    setSaving(false);
    if (error || !data?.length) {
      notify(error?.message || 'Not saved: your account is not an admin.', { type: 'error' });
      return;
    }
    notify('Stay terms saved. They apply to new requests.', { type: 'success' });
    load();
  };

  const markRefunded = async (row: RefundRow) => {
    const reference = (references[row.id] || '').trim();
    if (reference.length < 3) return notify('Enter the mobile-money reference of the refund first.', { type: 'warning' });
    setBusyRefund(row.id);
    const { error } = await stayDb.rpc('mark_stay_refunded', { p_booking: row.id, p_reference: reference });
    setBusyRefund(null);
    if (error) return notify(error.message, { type: 'error' });
    notify('Refund recorded and guest notified.', { type: 'success' });
    loadRefunds();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000 }}>
      <Title title="Stays" />
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Stays
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Commission and deposit terms for hotel and guest-house bookings, and deposits waiting to be refunded.
      </Typography>

      <Stack spacing={3}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Deposit &amp; commission
              </Typography>
              {settings && (
                <Chip
                  size="small"
                  color={settings.payments_enabled ? 'success' : 'default'}
                  label={settings.payments_enabled ? 'Online deposits on' : 'Online deposits off: guests pay at the property'}
                />
              )}
            </Stack>

            {!settings ? (
              <Stack spacing={2}>
                <Skeleton height={40} />
                <Skeleton height={40} />
              </Stack>
            ) : (
              <Stack spacing={2.5}>
                <FormControlLabel
                  control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
                  label="Collect a deposit online (MTN / Orange money)"
                />
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
                  <TextField
                    label="Propella commission"
                    type="number"
                    value={percent}
                    onChange={(e) => setPercent(e.target.value)}
                    error={!!parsed.errors.percent}
                    helperText={parsed.errors.percent || 'Share of the whole stay'}
                    inputProps={{ min: 0, max: 50, step: 0.5 }}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  />
                  <TextField
                    label="Time to pay after acceptance"
                    type="number"
                    value={windowHours}
                    onChange={(e) => setWindowHours(e.target.value)}
                    error={!!parsed.errors.window}
                    helperText={parsed.errors.window || 'Unpaid bookings are then released'}
                    inputProps={{ min: 1, max: 48, step: 1 }}
                    InputProps={{ endAdornment: <InputAdornment position="end">hours</InputAdornment> }}
                  />
                  <TextField
                    label="Free cancellation"
                    type="number"
                    value={freeDays}
                    onChange={(e) => setFreeDays(e.target.value)}
                    error={!!parsed.errors.free}
                    helperText={parsed.errors.free || 'Days before check-in for a full refund'}
                    inputProps={{ min: 0, max: 30, step: 1 }}
                    InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
                  />
                </Box>

                {valid && (
                  <Alert severity="info" icon={false}>
                    <strong>Example:</strong> 2 nights at 25 000 FCFA = {fcfa(example.total)}. The guest pays a deposit of{' '}
                    {fcfa(example.deposit)} online and {fcfa(example.atProperty)} at the property. On check-in day the host's wallet gets{' '}
                    {fcfa(example.deposit - example.commission)} and Propella keeps {fcfa(example.commission)} (less the MeSomb fee).
                  </Alert>
                )}
                <Typography variant="body2" color="text.secondary">
                  Changes apply to new requests only. Bookings already requested keep the terms they were made with.
                </Typography>

                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Typography variant="caption" color="text.secondary">
                    Last changed {new Date(settings.updated_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    {editor ? ` by ${editor}` : ''}
                  </Typography>
                  <Stack direction="row" gap={1}>
                    <Button disabled={!dirty || saving} onClick={load}>
                      Discard
                    </Button>
                    <Button variant="contained" disabled={!dirty || !valid || saving} onClick={save}>
                      {saving ? 'Saving…' : 'Save terms'}
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Last 30 days
            </Typography>
            {earned === null ? (
              <Skeleton height={40} />
            ) : (
              <Stack direction="row" gap={4} flexWrap="wrap">
                <Box>
                  <Typography variant="h5" fontWeight={700}>{fcfa(earned.commission)}</Typography>
                  <Typography variant="body2" color="text.secondary">Commission released to Propella</Typography>
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>{earned.count}</Typography>
                  <Typography variant="body2" color="text.secondary">Deposits released</Typography>
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                Refunds to pay back
              </Typography>
              {refunds && <Chip size="small" color={refunds.length ? 'warning' : 'default'} label={refunds.length} />}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Send the deposit back to the guest's mobile-money number, then record the transfer reference here. The guest is notified.
            </Typography>
            {refunds === null ? (
              <Skeleton height={60} />
            ) : refunds.length === 0 ? (
              <Typography color="text.secondary">No refunds waiting.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {refunds.map((r) => (
                  <Box
                    key={r.id}
                    sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, alignItems: 'center' }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700}>
                        {fcfa(r.deposit_amount)} · {r.guest?.full_name || 'Guest'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        {[r.guest?.phone, r.guest?.email].filter(Boolean).join(' · ') || 'No contact on file'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {r.property?.title || 'Stay'} · {r.check_in} → {r.check_out} · #{r.id.slice(0, 8).toUpperCase()}
                      </Typography>
                    </Box>
                    <Stack direction="row" gap={1} alignItems="center">
                      <TextField
                        size="small"
                        label="Refund reference"
                        value={references[r.id] || ''}
                        onChange={(e) => setReferences((m) => ({ ...m, [r.id]: e.target.value }))}
                      />
                      <Button variant="contained" disabled={busyRefund === r.id} onClick={() => markRefunded(r)}>
                        Mark refunded
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
