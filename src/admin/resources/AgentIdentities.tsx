import { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import {
  List, Edit, TextField, DateField, ReferenceField, ReferenceInput,
  ReferenceManyField, FunctionField, useRecordContext, useNotify, useRefresh,
} from 'react-admin';
import { AdminTable, AdminPagination } from '../components/AdminTable';
import { SelectInput, AutocompleteInput } from '../components/ShadcnInputs';
import { ResponsiveList, CardHeader, CardRow, useRecord } from '../components/MobileListCard';
import { DetailPage, DetailHero, DetailSection, DetailGrid, MetaItem } from '../components/DetailLayout';
import StatusChip from '../components/StatusChip';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/lib/supabase';

const statusChoices = [
  { id: 'documents_review', name: 'Awaiting review' },
  { id: 'pending', name: 'Incomplete submission' },
  { id: 'approved', name: 'Approved' },
  { id: 'rejected', name: 'Rejected' },
];
const AgentName = () => <ReferenceField source="agent_id" reference="profiles" link={false}><TextField source="full_name" /></ReferenceField>;

function IdentityCard() {
  const r = useRecord<any>();
  return <Stack spacing={1.5}>
    <CardHeader title={<AgentName />} right={<StatusChip value={r.verification_status} />} />
    <CardRow label="Submitted" value={r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'Not submitted'} />
    <CardRow label="ID documents" value={`${r.id_document_front_url ? 'Front uploaded' : 'Front missing'} · ${r.id_document_back_url ? 'Back uploaded' : 'Back missing'}`} />
  </Stack>;
}

export function AgentIdentityList() {
  return <List className="admin-resource-list" pagination={<AdminPagination />} sort={{ field: 'submitted_at', order: 'ASC' }}
    filterDefaultValues={{ verification_status: 'documents_review' }}
    filters={[
      <SelectInput key="status" source="verification_status" label="ID decision" choices={statusChoices} alwaysOn />,
      <ReferenceInput key="agent" source="agent_id" reference="profiles" alwaysOn>
        <AutocompleteInput label="Agent" optionText={(r: any) => r?.full_name || r?.email || '(no name)'} filterToQuery={(q: string) => ({ 'full_name@ilike': q })} />
      </ReferenceInput>,
    ]}>
    <ResponsiveList card={<IdentityCard />} desktop={<AdminTable rowClick="edit" bulkActionButtons={false}>
      <ReferenceField source="agent_id" reference="profiles" label="Agent" link={false}><TextField source="full_name" /></ReferenceField>
      <FunctionField label="ID decision" render={(r: any) => <StatusChip value={r.verification_status} />} />
      <DateField source="submitted_at" label="Submitted" showTime />
      <DateField source="verified_at" label="Reviewed" showTime />
      <ReferenceField source="verified_by" reference="profiles" label="Reviewer" link={false}><TextField source="full_name" /></ReferenceField>
    </AdminTable>} />
  </List>;
}

function IdentityDocument({ label, path }: { label: string; path?: string | null }) {
  const notify = useNotify();
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setPreview(''), [path]);
  const open = async () => {
    if (!path) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.storage.from('identity-documents').createSignedUrl(path, 300);
      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Document unavailable');
      setPreview(data.signedUrl);
    } catch (e) { notify((e as Error).message, { type: 'error' }); }
    finally { setBusy(false); }
  };
  return <Stack spacing={1}>
    <Typography fontWeight={600}>{label}</Typography>
    <Button variant="outline" disabled={!path || busy} onClick={() => void open()}>{!path ? 'Not uploaded' : busy ? 'Opening…' : preview ? 'Refresh private preview' : 'Preview document'}</Button>
    {preview && <>
      {path?.toLowerCase().endsWith('.pdf')
        ? <iframe title={label} src={preview} style={{ width: '100%', height: 360, border: '1px solid #ddd' }} />
        : <img alt={label} src={preview} style={{ width: '100%', maxHeight: 360, objectFit: 'contain' }} />}
      <a href={preview} target="_blank" rel="noopener noreferrer">Open full document</a>
      <Typography variant="caption">Private preview expires in five minutes.</Typography>
    </>}
  </Stack>;
}

function IdentityDetail() {
  const r = useRecordContext<any>();
  const notify = useNotify();
  const refresh = useRefresh();
  const [note, setNote] = useState('');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setNote(''); setChecked(false); }, [r?.id, r?.submission_version, r?.verification_status]);
  if (!r) return <DetailPage>Loading…</DetailPage>;
  const canReview = r.verification_status === 'documents_review' || r.verification_status === 'approved';
  const review = async (decision: 'approved' | 'rejected') => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc('review_agent_identity', {
        p_id: r.id, p_version: r.submission_version, p_decision: decision, p_note: note.trim() || null,
        p_expected_status: r.verification_status,
      });
      if (error) throw error;
      notify(decision === 'approved' ? 'ID approved. Available listings are now visible.' : 'ID rejected. Listings remain hidden and the agent has been notified.', { type: 'success' });
      refresh();
    } catch (e) { notify((e as Error).message, { type: 'error' }); refresh(); }
    finally { setBusy(false); }
  };
  return <DetailPage>
    <DetailHero eyebrow="Agent identity" title={<AgentName />} badges={<StatusChip value={r.verification_status} />}
      meta={<><MetaItem label="Submitted" value={r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'Not submitted'} />
        <MetaItem label="Reviewed" value={r.verified_at ? new Date(r.verified_at).toLocaleString() : 'Not reviewed'} /></>} />
    <DetailSection title="ID documents" description="Check both sides for legibility and confirm the identity matches the agent. Business documents and payment are not required for this decision.">
      <DetailGrid cols={2}><IdentityDocument label="ID front" path={r.id_document_front_url} /><IdentityDocument label="ID back" path={r.id_document_back_url} /></DetailGrid>
    </DetailSection>
    {r.rejection_reason && <DetailSection title="Reason for rejection"><Typography>{r.rejection_reason}</Typography></DetailSection>}
    <DetailSection title="Identity decision" description="Approval publishes available listings automatically. Rejection hides this agent's listings unless their account is exempt as an existing agent.">
      {canReview ? <Stack spacing={2}>
        <label><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} /> I have reviewed both sides of this ID.</label>
        <label htmlFor="identity-review-note">Review note (required for rejection)</label>
        <Textarea id="identity-review-note" value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={2000} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {r.verification_status === 'documents_review' && <Button disabled={busy || !checked || !r.id_document_front_url || !r.id_document_back_url} onClick={() => void review('approved')}>Approve ID and publish listings</Button>}
          <Button variant="destructive" disabled={busy || !checked || note.trim().length < 3} onClick={() => void review('rejected')}>{r.verification_status === 'approved' ? 'Withdraw approval' : 'Reject ID'}</Button>
        </Box>
      </Stack> : <Typography>{r.verification_status === 'rejected' ? 'Waiting for corrected documents and a new submission.' : 'The agent has not submitted both ID documents yet.'}</Typography>}
    </DetailSection>
    <DetailSection title="Review history">
      <ReferenceManyField reference="agent_identity_review_events" target="identity_id" sort={{ field: 'created_at', order: 'DESC' }}>
        <AdminTable bulkActionButtons={false}>
          <DateField source="created_at" label="Reviewed" showTime />
          <ReferenceField source="reviewer_id" reference="profiles" label="Reviewer" link={false}><TextField source="full_name" /></ReferenceField>
          <TextField source="decision" /><TextField source="note" />
        </AdminTable>
      </ReferenceManyField>
    </DetailSection>
  </DetailPage>;
}

export const AgentIdentityEdit = () => <Edit title={false} component={Box} actions={false}><IdentityDetail /></Edit>;
