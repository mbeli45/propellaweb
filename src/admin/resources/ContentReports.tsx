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
  EditButton,
  ShowButton,
  useRecordContext,
  useNotify,
  useRefresh,
  useDataProvider,
  Button,
} from 'react-admin';
import { Stack } from '@mui/material';
import { EditToolbar } from '../components/EditToolbar';
import { supabase } from '@/lib/supabase';

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

export const ContentReportList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filterDefaultValues={{ status: 'pending' }}
    sx={{ '& .RaList-content': { boxShadow: 'none' } }}
  >
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <SelectField source="content_type" choices={CONTENT_TYPE_CHOICES} />
      <SelectField source="reason" choices={REASON_CHOICES} />
      <ReferenceField source="reporter_id" reference="profiles" label="Reporter">
        <TextField source="full_name" />
      </ReferenceField>
      <ReferenceField source="reported_user_id" reference="profiles" label="Reported user" link="show">
        <TextField source="full_name" />
      </ReferenceField>
      <SelectField source="status" choices={STATUS_CHOICES} />
      <DateField source="created_at" showTime />
      <DateField source="reviewed_at" showTime />
      <EditButton />
      <ShowButton />
    </Datagrid>
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

export const ContentReportEdit = () => (
  <Edit title={<ContentReportTitle />} mutationMode="pessimistic">
    <SimpleForm toolbar={<EditToolbar />}>
      <SelectField source="content_type" choices={CONTENT_TYPE_CHOICES} />
      <TextField source="content_id" label="Content ID" />
      <ReferenceField source="reporter_id" reference="profiles" label="Reporter">
        <TextField source="full_name" />
      </ReferenceField>
      <ReferenceField source="reported_user_id" reference="profiles" label="Reported user" link="show">
        <TextField source="full_name" />
      </ReferenceField>
      <SelectField source="reason" choices={REASON_CHOICES} />
      <TextInput source="details" multiline rows={3} fullWidth disabled />
      <SelectInput source="status" choices={STATUS_CHOICES} />
      <TextInput source="resolution_notes" multiline rows={3} fullWidth />
      <DateField source="created_at" showTime />
      <DateField source="reviewed_at" showTime />
      <Stack direction="row" spacing={1} sx={{ marginTop: 2 }}>
        <RemoveContentButton />
        <EjectUserButton />
      </Stack>
    </SimpleForm>
  </Edit>
);
