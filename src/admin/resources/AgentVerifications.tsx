import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  BooleanField,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  Filter,
  useRecordContext,
  FunctionField,
} from 'react-admin';
import { Stack, Divider, Box, Typography } from '@mui/material';
import { Icon } from '@iconify/react';
import { Colors } from '@/constants/Colors';
import { EditToolbar } from '../components/EditToolbar';
import { DeleteButtonWithConfirm } from '../components/DeleteButtonWithConfirm';
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

const VERIFICATION_STATUS_CHOICES = [
  { id: 'pending', name: 'Pending' },
  { id: 'approved', name: 'Approved' },
  { id: 'rejected', name: 'Rejected' },
  { id: 'under_review', name: 'Under Review' },
];

const formatXaf = (n: number | string | null | undefined) => {
  const num = Number(n ?? 0);
  return `${Math.round(num).toLocaleString('en-US')} XAF`;
};

const AgentVerificationTitle = () => {
  const record = useRecordContext();
  return <span>Agent Verification: {record?.agent_id?.slice(0, 8)}</span>;
};

const VerificationFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="business_name@ilike" label="Search business" alwaysOn resettable />
    <ReferenceInput source="agent_id" reference="profiles" alwaysOn>
      <AutocompleteInput
        label="Agent"
        optionText={(r: any) => (r ? r.full_name || r.email || '(no name)' : '')}
        filterToQuery={(q: string) => ({ 'full_name@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
    <SelectInput source="verification_status" choices={VERIFICATION_STATUS_CHOICES} alwaysOn />
    <BooleanInput source="verification_fee_paid" label="Fee paid" />
  </Filter>
);

const VerificationCard = () => {
  const r = useRecord<any>();
  if (!r) return null;
  return (
    <Stack spacing={1.5}>
      <CardHeader
        avatar={
          <IconAvatar
            icon="lucide:shield-check"
            tone={
              r.verification_status === 'approved'
                ? 'success'
                : r.verification_status === 'rejected'
                  ? 'error'
                  : 'warning'
            }
          />
        }
        title={
          <ReferenceField source="agent_id" reference="profiles" link={false}>
            <TextField source="full_name" />
          </ReferenceField>
        }
        subtitle={r.business_name ?? '—'}
        right={<StatusChip source="verification_status" />}
      />
      <Divider />
      <CardRow
        label="Fee"
        value={
          r.verification_fee_paid ? (
            <StatusChip value="paid" />
          ) : (
            formatXaf(r.verification_fee_amount)
          )
        }
      />
      <CardRow label="Submitted" value={new Date(r.created_at).toLocaleDateString('en-US')} />
      {r.verified_at && <CardRow label="Verified" value={new Date(r.verified_at).toLocaleDateString('en-US')} />}
    </Stack>
  );
};

const VerificationDatagrid = () => (
  <Datagrid rowClick="edit" bulkActionButtons={false}>
    <ReferenceField source="agent_id" reference="profiles" label="Agent" link={false}>
      <TextField source="full_name" />
    </ReferenceField>
    <TextField source="business_name" />
    <FunctionField label="Status" render={() => <StatusChip source="verification_status" />} />
    <BooleanField source="verification_fee_paid" label="Fee paid" />
    <NumberField source="verification_fee_amount" options={{ style: 'currency', currency: 'XAF' }} />
    <DateField source="created_at" />
    <DateField source="verified_at" />
    <DeleteButtonWithConfirm />
  </Datagrid>
);

export const AgentVerificationList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filters={<VerificationFilter />}
    sx={{ '& .RaList-content': { boxShadow: 'none' } }}
  >
    <ResponsiveList desktop={<VerificationDatagrid />} card={<VerificationCard />} />
  </List>
);

// Quick helper: render a clickable document link if URL set, else a "missing" pill.
const DocLink = ({ label, url }: { label: string; url?: string | null }) => {
  if (!url) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1 }}>
        <Box sx={{ width: 36, height: 36, bgcolor: Colors.neutral[100], color: Colors.neutral[500], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon icon="lucide:file-x" width={18} />
        </Box>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', color: Colors.neutral[500], fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: Colors.neutral[500] }}>Not uploaded</Typography>
        </Box>
      </Box>
    );
  }
  return (
    <Box
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        py: 1,
        textDecoration: 'none',
        color: 'inherit',
        '&:hover .doc-label': { color: Colors.primary[600] },
      }}
    >
      <Box sx={{ width: 36, height: 36, bgcolor: Colors.primary[50], color: Colors.primary[700], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon icon="lucide:file-check" width={18} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ display: 'block', color: Colors.neutral[500], fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </Typography>
        <Typography
          className="doc-label"
          variant="body2"
          fontWeight={600}
          sx={{ color: Colors.neutral[900], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          View document ↗
        </Typography>
      </Box>
    </Box>
  );
};

const AgentVerificationDetail = () => {
  const record = useRecordContext<any>();
  if (!record) return <DetailPage>Loading…</DetailPage>;
  return (
    <DetailPage>
      <DetailHero
        eyebrow="Agent verification"
        title={record.business_name || (
          <ReferenceField source="agent_id" reference="profiles" link={false}>
            <TextField source="full_name" />
          </ReferenceField>
        )}
        badges={<StatusChip value={record.verification_status} />}
        meta={
          <>
            <MetaItem label="Submitted" value={new Date(record.created_at).toLocaleDateString('en-US')} />
            {record.verified_at && (
              <MetaItem label="Verified" value={new Date(record.verified_at).toLocaleDateString('en-US')} />
            )}
            <MetaItem
              label="Fee"
              value={
                record.verification_fee_paid
                  ? `${formatXaf(record.verification_fee_amount)} paid`
                  : `${formatXaf(record.verification_fee_amount)} pending`
              }
            />
            {record.years_of_experience !== null && record.years_of_experience !== undefined && (
              <MetaItem label="Experience" value={`${record.years_of_experience} yr`} />
            )}
          </>
        }
      />

      <DetailSection title="Business">
        <DetailGrid>
          <DetailEntityCard
            icon="lucide:user"
            tone="neutral"
            label="Agent"
            value={
              <ReferenceField source="agent_id" reference="profiles" link={false}>
                <TextField source="full_name" />
              </ReferenceField>
            }
          />
          <DetailEntityCard
            icon="lucide:briefcase"
            tone="primary"
            label="Business"
            value={record.business_name || '—'}
            secondary={record.business_address}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection
        title="Documents"
        description="Click any uploaded file to view in a new tab."
      >
        <DetailGrid cols={2}>
          <DocLink label="ID front" url={record.id_document_front_url} />
          <DocLink label="ID back" url={record.id_document_back_url} />
          <DocLink label="Business license" url={record.business_license_url} />
          <DocLink label="Proof of address" url={record.proof_of_address_url} />
          <DocLink label="Professional certificate" url={record.professional_certificate_url} />
        </DetailGrid>
      </DetailSection>

      {record.rejection_reason && (
        <DetailSection title="Rejection reason">
          <Box
            sx={{
              p: 2,
              bgcolor: Colors.error[50],
              border: `1px solid ${Colors.error[200]}`,
              color: Colors.error[800],
              fontSize: '0.875rem',
            }}
          >
            {record.rejection_reason}
          </Box>
        </DetailSection>
      )}

      <DetailSection title="Review" noDivider>
        <SimpleForm
          toolbar={<EditToolbar />}
          sx={{ padding: 0, '& .RaSimpleForm-form': { padding: 0 } }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
            <SelectInput source="verification_status" choices={VERIFICATION_STATUS_CHOICES} />
            <BooleanInput source="verification_fee_paid" label="Fee paid" />
          </Box>
          <NumberInput source="verification_fee_amount" label="Fee amount" fullWidth />
          <TextInput source="rejection_reason" multiline rows={2} fullWidth />
          <TextInput source="admin_notes" multiline rows={3} fullWidth />
        </SimpleForm>
      </DetailSection>
    </DetailPage>
  );
};

export const AgentVerificationEdit = () => (
  <Edit title={false} component={Box} actions={false}>
    <AgentVerificationDetail />
  </Edit>
);
