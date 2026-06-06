import { useEffect, useState } from 'react';
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Edit,
  SimpleForm,
  SelectInput,
  DateInput,
  TimeInput,
  NumberInput,
  TextInput,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  Filter,
  BooleanInput,
  useRecordContext,
  useNotify,
  useRefresh,
  Button as RaButton,
  FunctionField,
} from 'react-admin';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
  TextField as MuiTextField,
  Stack,
  Typography,
  Chip,
  MenuItem,
  Box,
  Card,
  CardContent,
  Divider,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { Icon } from '@iconify/react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { DeleteButtonWithConfirm } from '../components/DeleteButtonWithConfirm';
import { EditToolbar } from '../components/EditToolbar';
import StatusChip from '../components/StatusChip';
import {
  ResponsiveList,
  CardHeader,
  CardRow,
  IconAvatar,
  useRecord,
} from '../components/MobileListCard';
import {
  DetailPage,
  DetailHero,
  DetailSection,
  DetailGrid,
  DetailField,
  DetailEntityCard,
  MetaItem,
} from '../components/DetailLayout';

// ----- Helpers -----------------------------------------------------------

const formatXaf = (n: number | string | null | undefined) => {
  const num = Number(n ?? 0);
  return `${Math.round(num).toLocaleString('en-US')} XAF`;
};

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ----- Refund action button (list + detail) ------------------------------

const ProcessRefundButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [service, setService] = useState<'auto' | 'MTN' | 'ORANGE'>('auto');
  const [submitting, setSubmitting] = useState(false);

  if (!record) return null;
  if (record.refund_status === 'refunded') {
    return <StatusChip value="refunded" />;
  }
  if (record.payment_status !== 'paid') return null;

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setPhone('');
    setService('auto');
    setOpen(true);
  };

  const handleConfirm = async () => {
    if (!phone.trim()) {
      notify('Refund phone is required', { type: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        reservation_id: record.id,
        phone: phone.trim(),
      };
      if (service !== 'auto') payload.service = service;

      const { data, error } = await supabase.functions.invoke('mesomb-refund', { body: payload });

      if (error) {
        const ctx: Response | undefined = (error as any)?.context;
        let parsed: any = null;
        let rawText = '';
        if (ctx && typeof ctx.clone === 'function') {
          try {
            rawText = await ctx.clone().text();
            try {
              parsed = JSON.parse(rawText);
            } catch {
              parsed = null;
            }
          } catch (readErr) {
            console.warn('Could not read refund error body:', readErr);
          }
        }
        console.error('mesomb-refund failed', {
          status: ctx?.status,
          parsed,
          rawText,
          errorMessage: error.message,
        });
        const detail =
          parsed?.error ||
          parsed?.details ||
          parsed?.message ||
          (rawText && rawText.length < 300 ? rawText : null) ||
          error.message ||
          'Unknown error';
        const statusSuffix = ctx?.status ? ` [HTTP ${ctx.status}]` : '';
        notify(`Refund failed${statusSuffix}: ${detail}`, { type: 'error', autoHideDuration: 10000 });
        return;
      }

      console.log('mesomb-refund response', data);

      if (data?.success) {
        notify(
          `Refund of ${Number(data.amount).toLocaleString()} XAF sent (payout ${data.payout_pk?.slice(0, 8) || '—'})`,
          { type: 'success' },
        );
        setOpen(false);
        refresh();
      } else {
        const detail = data?.error || data?.details || data?.message || 'Unknown error';
        notify(`Refund failed: ${detail}`, { type: 'error', autoHideDuration: 10000 });
      }
    } catch (err: any) {
      notify(`Refund failed: ${err?.message || 'Unexpected error'}`, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const refundAmount = Number(record.reservation_fee ?? record.amount ?? 0);
  const failed = record.refund_status === 'failed';

  return (
    <>
      <RaButton
        onClick={handleOpen}
        label={failed ? 'Retry refund' : 'Process refund'}
        color={failed ? 'warning' : 'primary'}
        startIcon={<Icon icon="lucide:undo-2" width={16} />}
      />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Process refund</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Send <strong>{formatXaf(refundAmount)}</strong> back to the customer via MeSomb.
              On success the customer wallet is credited, the agent and platform shares are reversed,
              and refund_status is set to <code>refunded</code>.
            </Typography>
            <MuiTextField
              label="Refund phone (Cameroon)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="6xxxxxxxx or 9xxxxxxxx"
              helperText="9 digits, with or without 237 prefix"
              fullWidth
              autoFocus
            />
            <MuiTextField
              select
              label="Provider"
              value={service}
              onChange={(e) => setService(e.target.value as any)}
              fullWidth
              helperText="auto picks ORANGE for 9xxxxxxxx, otherwise MTN"
            >
              <MenuItem value="auto">Auto-detect</MenuItem>
              <MenuItem value="MTN">MTN</MenuItem>
              <MenuItem value="ORANGE">Orange</MenuItem>
            </MuiTextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </MuiButton>
          <MuiButton
            onClick={handleConfirm}
            disabled={submitting || !phone.trim()}
            variant="contained"
            color="primary"
          >
            {submitting ? 'Processing…' : `Refund ${formatXaf(refundAmount)}`}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ----- Filters -----------------------------------------------------------

const ReservationFilter = (props: any) => (
  <Filter {...props}>
    <ReferenceInput source="user_id" reference="profiles" alwaysOn>
      <AutocompleteInput
        label="Client"
        optionText={(r: any) => (r ? r.full_name || r.email || '(no name)' : '')}
        filterToQuery={(q: string) => ({ 'full_name@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
    <ReferenceInput source="property_id" reference="properties">
      <AutocompleteInput
        label="Property"
        optionText="title"
        filterToQuery={(q: string) => ({ 'title@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
    <BooleanInput source="refund_requested" label="Refund requested" alwaysOn />
    <SelectInput
      source="refund_status"
      choices={[
        { id: 'none', name: 'None' },
        { id: 'pending', name: 'Pending' },
        { id: 'refunded', name: 'Refunded' },
        { id: 'failed', name: 'Failed' },
      ]}
      alwaysOn
    />
    <SelectInput
      source="status"
      choices={[
        { id: 'pending', name: 'Pending' },
        { id: 'confirmed', name: 'Confirmed' },
        { id: 'completed', name: 'Completed' },
        { id: 'cancelled', name: 'Cancelled' },
      ]}
    />
  </Filter>
);

// ----- Mobile card -------------------------------------------------------

const ReservationCard = () => {
  const r = useRecord<any>();
  if (!r) return null;
  const refundable = r.payment_status === 'paid' && r.refund_status !== 'refunded';
  return (
    <Stack spacing={1.5}>
      <CardHeader
        avatar={
          <IconAvatar
            icon="lucide:home"
            tone={
              r.status === 'confirmed' || r.status === 'completed'
                ? 'success'
                : r.status === 'cancelled'
                  ? 'error'
                  : 'warning'
            }
          />
        }
        title={
          <ReferenceField source="property_id" reference="properties" link={false}>
            <TextField source="title" />
          </ReferenceField>
        }
        subtitle={
          <ReferenceField source="user_id" reference="profiles" link={false}>
            <TextField source="full_name" />
          </ReferenceField>
        }
        right={<StatusChip source="status" />}
      />
      <Divider />
      <CardRow label="Amount" value={formatXaf(r.amount)} />
      <CardRow label="Payment" value={<StatusChip source="payment_status" />} />
      {(r.refund_requested || r.refund_status) && (
        <CardRow label="Refund" value={<StatusChip source="refund_status" value={r.refund_status || 'pending'} />} />
      )}
      <CardRow label="Date" value={formatDate(r.reservation_date)} />
      {refundable && (
        <Box
          sx={{ mt: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <ProcessRefundButton />
        </Box>
      )}
    </Stack>
  );
};

// ----- List page ---------------------------------------------------------

const ReservationDatagrid = () => (
  <Datagrid rowClick="edit" bulkActionButtons={false}>
    <ReferenceField source="property_id" reference="properties" label="Property" link={false}>
      <TextField source="title" />
    </ReferenceField>
    <ReferenceField source="user_id" reference="profiles" label="Client" link={false}>
      <TextField source="full_name" />
    </ReferenceField>
    <NumberField source="amount" options={{ style: 'currency', currency: 'XAF' }} />
    <FunctionField label="Status" render={() => <StatusChip source="status" />} />
    <FunctionField label="Payment" render={() => <StatusChip source="payment_status" />} />
    <FunctionField label="Refund" render={() => <StatusChip source="refund_status" />} />
    <DateField source="created_at" showTime />
    <FunctionField
      label=""
      render={() => (
        <Box
          component="span"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          sx={{ display: 'inline-flex' }}
        >
          <ProcessRefundButton />
        </Box>
      )}
    />
    <DeleteButtonWithConfirm />
  </Datagrid>
);

export const ReservationList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filters={<ReservationFilter />}
    sx={{ '& .RaList-content': { boxShadow: 'none' } }}
  >
    <ResponsiveList desktop={<ReservationDatagrid />} card={<ReservationCard />} />
  </List>
);

// ----- Detail (Edit) page -----------------------------------------------

interface ReservationTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

const ReservationDetail = () => {
  const record = useRecordContext();
  const [txs, setTxs] = useState<ReservationTransaction[] | null>(null);
  const [property, setProperty] = useState<{ title: string | null; location: string | null } | null>(null);
  const [client, setClient] = useState<{ full_name: string | null; email: string | null; phone: string | null } | null>(null);

  useEffect(() => {
    if (!record?.id) return;
    let alive = true;
    (async () => {
      const [txRes, propRes, userRes] = await Promise.all([
        supabase.from('transactions').select('id, type, amount, status, created_at').eq('reference', record.id),
        supabase.from('properties').select('title, location').eq('id', record.property_id).maybeSingle(),
        supabase.from('profiles').select('full_name, email, phone').eq('id', record.user_id).maybeSingle(),
      ]);
      if (!alive) return;
      setTxs((txRes.data as any) ?? []);
      setProperty((propRes.data as any) ?? null);
      setClient((userRes.data as any) ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [record?.id, record?.property_id, record?.user_id]);

  if (!record) {
    return (
      <DetailPage>
        <CircularProgress size={24} />
      </DetailPage>
    );
  }

  return (
    <DetailPage>
      <DetailHero
        eyebrow="Reservation"
        title={property?.title ?? `Reservation #${String(record.id).slice(0, 8)}`}
        amount={formatXaf(record.amount)}
        badges={
          <>
            <StatusChip value={record.status} />
            <StatusChip value={record.payment_status} />
            {record.refund_status && record.refund_status !== 'none' && (
              <StatusChip value={record.refund_status} />
            )}
          </>
        }
        actions={
          record.payment_status === 'paid' && record.refund_status !== 'refunded' ? (
            <ProcessRefundButton />
          ) : undefined
        }
        meta={
          <>
            <MetaItem label="Reservation ID" value={`#${String(record.id).slice(0, 8)}`} />
            <MetaItem label="Created" value={formatDate(record.created_at)} />
            {record.paid_at && <MetaItem label="Paid" value={formatDate(record.paid_at)} />}
            <MetaItem label="Date" value={formatDate(record.reservation_date)} />
            {record.transaction_id && (
              <MetaItem
                label="Transaction"
                value={String(record.transaction_id).slice(0, 16) + (String(record.transaction_id).length > 16 ? '…' : '')}
              />
            )}
          </>
        }
      />

      <DetailSection title="Parties">
        <DetailGrid>
          <DetailEntityCard
            icon="lucide:building-2"
            tone="primary"
            label="Property"
            value={property?.title ?? '—'}
            secondary={property?.location}
          />
          <DetailEntityCard
            icon="lucide:user"
            tone="neutral"
            label="Client"
            value={client?.full_name ?? '—'}
            secondary={client?.email ?? client?.phone ?? undefined}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection
        title="Money trail"
        description="Wallet movements created by this reservation."
        aside={
          txs ? (
            <Typography variant="caption" sx={{ color: Colors.neutral[500], fontWeight: 600 }}>
              {txs.length} {txs.length === 1 ? 'entry' : 'entries'}
            </Typography>
          ) : null
        }
      >
        {txs === null ? (
          <CircularProgress size={20} />
        ) : txs.length === 0 ? (
          <Typography variant="body2" sx={{ color: Colors.neutral[500] }}>
            No transaction rows tied to this reservation.
          </Typography>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {txs.map((t) => (
              <Stack key={t.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.25 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <IconAvatar
                    icon={Number(t.amount) < 0 ? 'lucide:arrow-up-right' : 'lucide:arrow-down-right'}
                    tone={Number(t.amount) < 0 ? 'error' : 'success'}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                      {t.type.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: Colors.neutral[500] }}>
                      {formatDate(t.created_at)} · {t.status}
                    </Typography>
                  </Box>
                </Stack>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{ color: Number(t.amount) < 0 ? Colors.error[700] : Colors.success[700] }}
                >
                  {Number(t.amount) >= 0 ? '+' : ''}
                  {formatXaf(t.amount)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </DetailSection>

      <DetailSection
        title="Edit"
        description="Override any field. Refund actions live in the header above; changing status here just rewrites the row."
        noDivider
      >
        <SimpleForm
          toolbar={<EditToolbar />}
          sx={{
            // SimpleForm wraps each field in a row container. Reset the
            // default padding so it sits flush inside our section.
            padding: 0,
            '& .RaSimpleForm-form': { padding: 0 },
          }}
        >
          <ReferenceInput source="user_id" reference="profiles" label="Client">
            <SelectInput optionText="full_name" disabled fullWidth />
          </ReferenceInput>
          <ReferenceInput source="property_id" reference="properties" label="Property">
            <SelectInput optionText="title" disabled fullWidth />
          </ReferenceInput>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
            <DateInput source="reservation_date" />
            <TimeInput source="reservation_time" />
          </Box>
          <NumberInput source="amount" fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
            <SelectInput
              source="status"
              choices={[
                { id: 'pending', name: 'Pending' },
                { id: 'confirmed', name: 'Confirmed' },
                { id: 'completed', name: 'Completed' },
                { id: 'cancelled', name: 'Cancelled' },
              ]}
            />
            <SelectInput
              source="payment_status"
              choices={[
                { id: 'initiated', name: 'Initiated' },
                { id: 'pending', name: 'Pending' },
                { id: 'paid', name: 'Paid' },
                { id: 'failed', name: 'Failed' },
                { id: 'refunded', name: 'Refunded' },
              ]}
            />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
            <SelectInput
              source="refund_status"
              choices={[
                { id: 'none', name: 'None' },
                { id: 'pending', name: 'Pending' },
                { id: 'refunded', name: 'Refunded' },
                { id: 'failed', name: 'Failed' },
              ]}
            />
            <TextInput source="refund_number" label="Refund phone" />
          </Box>
          <TextInput source="cancellation_reason" multiline rows={2} fullWidth />
          <TextInput source="transaction_id" disabled fullWidth />
        </SimpleForm>
      </DetailSection>
    </DetailPage>
  );
};

export const ReservationEdit = () => (
  <Edit
    title={false}
    component={Box}
    actions={false}
    sx={{ '& .RaEdit-card': { boxShadow: 'none', background: 'transparent' } }}
  >
    <ReservationDetail />
  </Edit>
);
