import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Edit,
  SimpleForm,
  SelectInput,
  TextInput,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  Filter,
  useRecordContext,
  FunctionField,
} from 'react-admin';
import { Box, Card, CardContent, Typography, Stack, Divider, CircularProgress } from '@mui/material';
import { Colors } from '@/constants/Colors';
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
  DetailEntityCard,
  MetaItem,
} from '../components/DetailLayout';

const formatXaf = (n: number | string | null | undefined) => {
  const num = Number(n ?? 0);
  return `${Math.round(num).toLocaleString('en-US')} XAF`;
};

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ----- Filters -----------------------------------------------------------

const WithdrawalFilter = (props: any) => (
  <Filter {...props}>
    <SelectInput
      source="status"
      choices={[
        { id: 'pending', name: 'Pending' },
        { id: 'approved', name: 'Approved' },
        { id: 'rejected', name: 'Rejected' },
        { id: 'completed', name: 'Completed' },
        { id: 'failed', name: 'Failed' },
      ]}
      alwaysOn
    />
  </Filter>
);

// ----- Mobile card -------------------------------------------------------

const WithdrawalCard = () => {
  const r = useRecord<any>();
  if (!r) return null;
  const tone =
    r.status === 'completed' ? 'success'
      : r.status === 'rejected' || r.status === 'failed' ? 'error'
        : 'warning';
  return (
    <Stack spacing={1.5}>
      <CardHeader
        avatar={<IconAvatar icon="lucide:arrow-down-circle" tone={tone} />}
        title={
          <ReferenceField source="user_id" reference="profiles" link={false}>
            <TextField source="full_name" />
          </ReferenceField>
        }
        subtitle={r.phone ?? '—'}
        right={<StatusChip source="status" />}
      />
      <Divider />
      <CardRow label="Amount" value={formatXaf(r.amount)} />
      <CardRow label="Requested" value={formatDate(r.requested_at || r.created_at)} />
      {r.processed_at && <CardRow label="Processed" value={formatDate(r.processed_at)} />}
      {r.fapshi_reference && <CardRow label="Ref" value={String(r.fapshi_reference).slice(0, 12) + '…'} />}
    </Stack>
  );
};

// ----- Desktop datagrid --------------------------------------------------

const WithdrawalDatagrid = () => (
  <Datagrid rowClick="edit" bulkActionButtons={false}>
    <ReferenceField source="user_id" reference="profiles" label="User" link={false}>
      <TextField source="full_name" />
    </ReferenceField>
    <NumberField source="amount" options={{ style: 'currency', currency: 'XAF' }} />
    <TextField source="phone" />
    <FunctionField label="Status" render={() => <StatusChip source="status" />} />
    <TextField source="fapshi_reference" label="MeSomb / Fapshi ref" />
    <DateField source="requested_at" showTime />
    <DateField source="processed_at" showTime />
  </Datagrid>
);

export const WithdrawalRequestList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filterDefaultValues={{ status: 'pending' }}
    filters={<WithdrawalFilter />}
    sx={{ '& .RaList-content': { boxShadow: 'none' } }}
  >
    <ResponsiveList desktop={<WithdrawalDatagrid />} card={<WithdrawalCard />} />
  </List>
);

// ----- Detail (Edit) layout ---------------------------------------------

const WithdrawalDetail = () => {
  const record = useRecordContext();
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
        eyebrow="Withdrawal"
        title={`Withdrawal #${String(record.id).slice(0, 8)}`}
        amount={formatXaf(record.amount)}
        badges={<StatusChip value={record.status} />}
        meta={
          <>
            <MetaItem label="Requested" value={formatDate(record.requested_at || record.created_at)} />
            {record.processed_at && <MetaItem label="Processed" value={formatDate(record.processed_at)} />}
            {record.fapshi_reference && (
              <MetaItem
                label="MeSomb / Fapshi ref"
                value={String(record.fapshi_reference).slice(0, 16) + (String(record.fapshi_reference).length > 16 ? '…' : '')}
              />
            )}
          </>
        }
      />

      <DetailSection title="Destination">
        <DetailGrid>
          <DetailEntityCard
            icon="lucide:smartphone"
            tone="primary"
            label="Mobile money number"
            value={record.phone ?? '—'}
            secondary="Funds will be wired here"
          />
          <DetailEntityCard
            icon="lucide:user"
            tone="neutral"
            label="Requested by"
            value={
              <ReferenceField source="user_id" reference="profiles" link={false}>
                <TextField source="full_name" />
              </ReferenceField>
            }
          />
        </DetailGrid>
      </DetailSection>

      {record.failure_reason && (
        <DetailSection title="Failure reason">
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor: Colors.error[50],
              border: `1px solid ${Colors.error[200]}`,
              color: Colors.error[800],
              fontSize: '0.875rem',
            }}
          >
            {record.failure_reason}
          </Box>
        </DetailSection>
      )}

      <DetailSection
        title="Edit"
        description="Change status, attach a payment reference, or record a failure reason. Money movement still needs to happen out-of-band."
        noDivider
      >
        <SimpleForm
          toolbar={<EditToolbar />}
          sx={{ padding: 0, '& .RaSimpleForm-form': { padding: 0 } }}
        >
          <ReferenceInput source="user_id" reference="profiles" label="User">
            <SelectInput optionText="full_name" disabled fullWidth />
          </ReferenceInput>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
            <NumberInput source="amount" disabled />
            <TextInput source="phone" disabled />
          </Box>
          <SelectInput
            source="status"
            choices={[
              { id: 'pending', name: 'Pending' },
              { id: 'approved', name: 'Approved' },
              { id: 'rejected', name: 'Rejected' },
              { id: 'completed', name: 'Completed' },
              { id: 'failed', name: 'Failed' },
            ]}
            fullWidth
          />
          <TextInput source="fapshi_reference" label="MeSomb / Fapshi ref" fullWidth />
          <TextInput source="failure_reason" multiline rows={2} fullWidth />
        </SimpleForm>
      </DetailSection>
    </DetailPage>
  );
};

export const WithdrawalRequestEdit = () => (
  <Edit
    title={false}
    component={Box}
    actions={false}
    sx={{ '& .RaEdit-card': { boxShadow: 'none', background: 'transparent' } }}
  >
    <WithdrawalDetail />
  </Edit>
);
