import { useState } from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  Edit,
  SimpleForm,
  SelectInput,
  SelectField,
  TextInput,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  Filter,
  useRecordContext,
  useNotify,
  useRefresh,
  useDataProvider,
  Button,
  FunctionField,
} from 'react-admin';
import { Box, Stack, Typography, Divider } from '@mui/material';
import { Colors } from '@/constants/Colors';
import { EditToolbar } from '../components/EditToolbar';
import { supabase } from '@/lib/supabase';
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

const REASON_CHOICES = [
  { id: 'spam', name: 'Spam' },
  { id: 'harassment', name: 'Harassment' },
  { id: 'sexual', name: 'Sexual content' },
  { id: 'violence', name: 'Violence' },
  { id: 'scam', name: 'Scam' },
  { id: 'fake_listing', name: 'Fake listing' },
  { id: 'impersonation', name: 'Impersonation' },
  { id: 'other', name: 'Other' },
];

const STATUS_CHOICES = [
  { id: 'pending', name: 'Pending' },
  { id: 'reviewing', name: 'Reviewing' },
  { id: 'action_taken', name: 'Action taken' },
  { id: 'dismissed', name: 'Dismissed' },
];

const CONTENT_TYPE_CHOICES = [
  { id: 'property', name: 'Property' },
  { id: 'message', name: 'Message' },
  { id: 'review', name: 'Review' },
  { id: 'profile', name: 'Profile' },
  { id: 'chat', name: 'Chat' },
];

const ContentReportTitle = () => {
  const record = useRecordContext();
  return <span>Report: {record?.id?.slice(0, 8)}</span>;
};

const ContentReportFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="details@ilike" label="Search details" alwaysOn resettable />
    <ReferenceInput source="reported_user_id" reference="profiles">
      <AutocompleteInput
        label="Reported user"
        optionText={(r: any) => (r ? r.full_name || r.email || '(no name)' : '')}
        filterToQuery={(q: string) => ({ 'full_name@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
    <SelectInput source="status" choices={STATUS_CHOICES} alwaysOn />
    <SelectInput source="content_type" choices={CONTENT_TYPE_CHOICES} />
    <SelectInput source="reason" choices={REASON_CHOICES} />
  </Filter>
);

const ContentReportCard = () => {
  const r = useRecord<any>();
  if (!r) return null;
  const reasonLabel = REASON_CHOICES.find((c) => c.id === r.reason)?.name ?? r.reason ?? '—';
  const contentLabel = CONTENT_TYPE_CHOICES.find((c) => c.id === r.content_type)?.name ?? r.content_type ?? '—';
  return (
    <Stack spacing={1.5}>
      <CardHeader
        avatar={<IconAvatar icon="lucide:flag" tone={r.status === 'pending' ? 'error' : 'neutral'} />}
        title={`${contentLabel} · ${reasonLabel}`}
        subtitle={
          <ReferenceField source="reported_user_id" reference="profiles" link={false}>
            <TextField source="full_name" />
          </ReferenceField>
        }
        right={<StatusChip source="status" />}
      />
      <Divider />
      <CardRow
        label="Reporter"
        value={
          <ReferenceField source="reporter_id" reference="profiles" link={false}>
            <TextField source="full_name" />
          </ReferenceField>
        }
      />
      <CardRow label="Reported" value={new Date(r.created_at).toLocaleDateString('en-US')} />
      {r.reviewed_at && <CardRow label="Reviewed" value={new Date(r.reviewed_at).toLocaleDateString('en-US')} />}
    </Stack>
  );
};

const ContentReportDatagrid = () => (
  <Datagrid rowClick="edit" bulkActionButtons={false}>
    <SelectField source="content_type" choices={CONTENT_TYPE_CHOICES} />
    <SelectField source="reason" choices={REASON_CHOICES} />
    <ReferenceField source="reporter_id" reference="profiles" label="Reporter" link={false}>
      <TextField source="full_name" />
    </ReferenceField>
    <ReferenceField source="reported_user_id" reference="profiles" label="Reported user" link="show">
      <TextField source="full_name" />
    </ReferenceField>
    <FunctionField label="Status" render={() => <StatusChip source="status" />} />
    <DateField source="created_at" />
    <DateField source="reviewed_at" />
  </Datagrid>
);

export const ContentReportList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filterDefaultValues={{ status: 'pending' }}
    filters={<ContentReportFilter />}
    sx={{ '& .RaList-content': { boxShadow: 'none' } }}
  >
    <ResponsiveList desktop={<ContentReportDatagrid />} card={<ContentReportCard />} />
  </List>
);

const RemoveContentButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const [loading, setLoading] = useState(false);

  if (!record) return null;
  if (record.content_type !== 'property' || !record.content_id) return null;

  const handleClick = async () => {
    if (!window.confirm('Delete this property and mark the report as action taken? This cannot be undone.')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('properties').delete().eq('id', record.content_id);
      if (error) throw error;
      await dataProvider.update('content_reports', {
        id: record.id,
        data: {
          status: 'action_taken',
          reviewed_at: new Date().toISOString(),
          resolution_notes: 'Content removed by moderator',
        },
        previousData: record,
      });
      notify('Property removed and report resolved.', { type: 'success' });
      refresh();
    } catch (e: any) {
      notify(e?.message || 'Failed to remove property', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      label={loading ? 'Removing…' : 'Remove listing'}
      onClick={handleClick}
      disabled={loading}
      color="error"
      variant="contained"
    />
  );
};

const EjectUserButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const [loading, setLoading] = useState(false);

  if (!record?.reported_user_id) return null;

  const handleClick = async () => {
    if (
      !window.confirm(
        'Eject this user? Their profile will be anonymised and they will be unable to use the platform. Mark report as action taken.',
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      // Anonymise + soft-eject the offending profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: 'Removed User',
          email: null,
          phone: null,
          avatar_url: null,
          bio: null,
          is_public: false,
        } as any)
        .eq('id', record.reported_user_id);
      if (profileError) throw profileError;

      // Hide all of their property listings as well
      await supabase
        .from('properties')
        .update({ status: 'sold' } as any)
        .eq('owner_id', record.reported_user_id);

      await dataProvider.update('content_reports', {
        id: record.id,
        data: {
          status: 'action_taken',
          reviewed_at: new Date().toISOString(),
          resolution_notes: 'User ejected and listings hidden',
        },
        previousData: record,
      });
      notify('User ejected and report resolved.', { type: 'success' });
      refresh();
    } catch (e: any) {
      notify(e?.message || 'Failed to eject user', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      label={loading ? 'Ejecting…' : 'Eject user'}
      onClick={handleClick}
      disabled={loading}
      color="error"
      variant="outlined"
    />
  );
};

const ContentReportDetail = () => {
  const record = useRecordContext<any>();
  if (!record) return <DetailPage>Loading…</DetailPage>;
  const reasonLabel = REASON_CHOICES.find((c) => c.id === record.reason)?.name ?? record.reason ?? '—';
  const contentLabel = CONTENT_TYPE_CHOICES.find((c) => c.id === record.content_type)?.name ?? record.content_type ?? '—';
  return (
    <DetailPage>
      <DetailHero
        eyebrow="Moderation report"
        title={`${contentLabel} · ${reasonLabel}`}
        badges={<StatusChip source="status" value={record.status} />}
        actions={
          <Stack direction="row" spacing={1}>
            <RemoveContentButton />
            <EjectUserButton />
          </Stack>
        }
        meta={
          <>
            <MetaItem label="Report ID" value={`#${String(record.id).slice(0, 8)}`} />
            <MetaItem label="Reported" value={new Date(record.created_at).toLocaleDateString('en-US')} />
            {record.reviewed_at && (
              <MetaItem label="Reviewed" value={new Date(record.reviewed_at).toLocaleDateString('en-US')} />
            )}
            {record.content_id && (
              <MetaItem label="Content ID" value={String(record.content_id).slice(0, 12) + '…'} />
            )}
          </>
        }
      />

      <DetailSection title="Parties">
        <DetailGrid>
          <DetailEntityCard
            icon="lucide:user"
            tone="neutral"
            label="Reporter"
            value={
              <ReferenceField source="reporter_id" reference="profiles" link={false}>
                <TextField source="full_name" />
              </ReferenceField>
            }
          />
          <DetailEntityCard
            icon="lucide:flag"
            tone="error"
            label="Reported user"
            value={
              <ReferenceField source="reported_user_id" reference="profiles" link={false}>
                <TextField source="full_name" />
              </ReferenceField>
            }
          />
        </DetailGrid>
      </DetailSection>

      {record.details && (
        <DetailSection title="Report details">
          <Typography
            variant="body1"
            sx={{
              color: Colors.neutral[800],
              lineHeight: 1.6,
              borderLeft: `3px solid ${Colors.neutral[300]}`,
              pl: 2,
              py: 0.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {record.details}
          </Typography>
        </DetailSection>
      )}

      <DetailSection title="Resolution" noDivider>
        <SimpleForm
          toolbar={<EditToolbar />}
          sx={{ padding: 0, '& .RaSimpleForm-form': { padding: 0 } }}
        >
          <SelectInput source="status" choices={STATUS_CHOICES} fullWidth />
          <TextInput source="resolution_notes" multiline rows={3} fullWidth />
        </SimpleForm>
      </DetailSection>
    </DetailPage>
  );
};

export const ContentReportEdit = () => (
  <Edit title={false} component={Box} actions={false} mutationMode="pessimistic">
    <ContentReportDetail />
  </Edit>
);
