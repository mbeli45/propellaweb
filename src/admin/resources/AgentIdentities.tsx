import { useEffect, useState, type ReactNode } from 'react';
import { Avatar, Box, Skeleton, Stack, Typography } from '@mui/material';
import { Icon } from '@iconify/react';
import {
  List, Edit, TextField, ReferenceField, ReferenceInput, FunctionField,
  useRecordContext, useNotify, useRefresh, useGetOne, useGetList, useGetMany,
} from 'react-admin';
import { useNavigate } from 'react-router-dom';
import { AdminTable, AdminPagination } from '../components/AdminTable';
import { SelectInput, AutocompleteInput } from '../components/ShadcnInputs';
import { ResponsiveList, CardHeader, CardRow, useRecord } from '../components/MobileListCard';
import StatusChip from '../components/StatusChip';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

// ID checks for agents, landlords and hosts. The list is the queue; the detail page is a
// review desk: the three documents side by side, and the decision beside them.

const statusChoices = [
  { id: 'documents_review', name: 'Awaiting review' },
  { id: 'pending', name: 'Not submitted yet' },
  { id: 'approved', name: 'Approved' },
  { id: 'rejected', name: 'Rejected' },
];
const roleLabel = (role?: string) => ({ agent: 'Agent', landlord: 'Landlord', host: 'Host' } as Record<string, string>)[role || ''] || role || '—';
const initials = (name?: string) => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
const fullDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const since = (iso?: string | null) => {
  if (!iso) return '';
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};
const panel = { bgcolor: Colors.white, border: `1px solid ${Colors.neutral[200]}`, borderRadius: '16px' } as const;

// ----- Queue ----------------------------------------------------------------

const Person = () => (
  <ReferenceField source="agent_id" reference="profiles" link={false}>
    <FunctionField render={(p: any) => (
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <Avatar sx={{ width: 34, height: 34, fontSize: '0.8125rem', fontWeight: 700, bgcolor: Colors.primary[50], color: Colors.primary[700] }}>{initials(p?.full_name)}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: Colors.neutral[900] }} noWrap>{p?.full_name || 'No name'}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: Colors.neutral[500] }} noWrap>{p?.email}</Typography>
        </Box>
      </Stack>
    )} />
  </ReferenceField>
);
const AccountType = () => (
  <ReferenceField source="agent_id" reference="profiles" link={false}>
    <FunctionField render={(p: any) => roleLabel(p?.role)} />
  </ReferenceField>
);
const Submitted = ({ r }: { r: any }) =>
  r.submitted_at ? (
    <Box title={fullDate(r.submitted_at)}>
      <Typography sx={{ fontSize: '0.875rem', color: Colors.neutral[900] }}>{since(r.submitted_at)}</Typography>
      <Typography sx={{ fontSize: '0.75rem', color: Colors.neutral[500] }}>{fullDate(r.submitted_at)}</Typography>
    </Box>
  ) : <Typography sx={{ fontSize: '0.875rem', color: Colors.neutral[500] }}>Not submitted</Typography>;

function IdentityCard() {
  const r = useRecord<any>();
  return <Stack spacing={1.5}>
    <CardHeader title={<Person />} right={<StatusChip value={r.verification_status} />} />
    <CardRow label="Account" value={<AccountType />} />
    <CardRow label="Submitted" value={r.submitted_at ? `${since(r.submitted_at)}, ${fullDate(r.submitted_at)}` : 'Not submitted'} />
  </Stack>;
}

export function AgentIdentityList() {
  return <List className="admin-resource-list" pagination={<AdminPagination />} sort={{ field: 'submitted_at', order: 'ASC' }}
    filterDefaultValues={{ verification_status: 'documents_review' }}
    filters={[
      <SelectInput key="status" source="verification_status" label="Status" choices={statusChoices} alwaysOn />,
      <ReferenceInput key="agent" source="agent_id" reference="profiles" alwaysOn>
        <AutocompleteInput label="Person" optionText={(r: any) => r?.full_name || r?.email || '(no name)'} filterToQuery={(q: string) => ({ 'full_name@ilike': q })} />
      </ReferenceInput>,
    ]}>
    <ResponsiveList card={<IdentityCard />} desktop={<AdminTable rowClick="edit" bulkActionButtons={false}>
      <FunctionField label="Person" render={() => <Person />} />
      <FunctionField label="Account" render={() => <AccountType />} />
      <FunctionField label="Status" render={(r: any) => <StatusChip value={r.verification_status} />} />
      <FunctionField label="Submitted" sortBy="submitted_at" render={(r: any) => <Submitted r={r} />} />
      <FunctionField label="Reviewed" sortBy="verified_at" render={(r: any) => r.verified_at
        ? <Box><Typography sx={{ fontSize: '0.875rem' }}>{fullDate(r.verified_at)}</Typography>
            <ReferenceField source="verified_by" reference="profiles" link={false}><TextField source="full_name" sx={{ fontSize: '0.75rem', color: Colors.neutral[500] }} /></ReferenceField></Box>
        : <Typography sx={{ fontSize: '0.875rem', color: Colors.neutral[400] }}>—</Typography>} />
    </AdminTable>} />
  </List>;
}

// ----- Review desk ------------------------------------------------------------

/** One document, loaded as soon as the page opens through a five-minute private link. */
function DocumentTile({ label, path, hint }: { label: string; path?: string | null; hint?: string }) {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const load = async () => {
    if (!path) return;
    setState('loading');
    const { data, error } = await supabase.storage.from('identity-documents').createSignedUrl(path, 300);
    if (error || !data?.signedUrl) { setState('failed'); return; }
    setUrl(data.signedUrl);
    setState('ready');
  };
  useEffect(() => { setUrl(''); setState('idle'); void load(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  const pdf = path?.toLowerCase().endsWith('.pdf');

  return (
    <Box component="figure" sx={{ m: 0, minWidth: 0 }}>
      <Box sx={{
        position: 'relative', aspectRatio: '4 / 3', borderRadius: '12px', overflow: 'hidden',
        bgcolor: Colors.neutral[100], border: `1px ${path ? 'solid' : 'dashed'} ${path ? Colors.neutral[200] : Colors.neutral[300]}`,
        display: 'grid', placeItems: 'center',
      }}>
        {!path && <Stack alignItems="center" spacing={1} sx={{ color: Colors.neutral[500] }}>
          <Icon icon="lucide:file-x" width={26} /><Typography sx={{ fontSize: '0.8125rem' }}>Not uploaded</Typography>
        </Stack>}
        {path && state === 'loading' && <Skeleton variant="rectangular" sx={{ position: 'absolute', inset: 0, height: '100%' }} />}
        {path && state === 'failed' && <Stack alignItems="center" spacing={1} sx={{ color: Colors.neutral[600], px: 2, textAlign: 'center' }}>
          <Icon icon="lucide:image-off" width={26} />
          <Typography sx={{ fontSize: '0.8125rem' }}>This file couldn't be opened.</Typography>
          <Button variant="outline" size="sm" onClick={() => void load()}>Try again</Button>
        </Stack>}
        {state === 'ready' && (pdf
          ? <iframe title={label} src={url} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, background: '#fff' }} />
          : <Box component="a" href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${label} full size`}
              sx={{ position: 'absolute', inset: 0, cursor: 'zoom-in', '&:focus-visible': { outline: `3px solid ${Colors.primary[400]}`, outlineOffset: -3 } }}>
              <Box component="img" alt={label} src={url} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>)}
      </Box>
      <Stack component="figcaption" direction="row" alignItems="baseline" justifyContent="space-between" spacing={1} sx={{ mt: 1.25 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: Colors.neutral[900] }}>{label}</Typography>
          {hint && <Typography sx={{ fontSize: '0.75rem', color: Colors.neutral[500] }}>{hint}</Typography>}
        </Box>
        {state === 'ready' && <Box component="a" href={url} target="_blank" rel="noopener noreferrer"
          sx={{ fontSize: '0.8125rem', fontWeight: 600, color: Colors.primary[600], whiteSpace: 'nowrap', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
          Open full size</Box>}
      </Stack>
    </Box>
  );
}

function Check({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <Box component="label" htmlFor={id} sx={{
      display: 'flex', gap: 1.25, alignItems: 'flex-start', p: 1.25, borderRadius: '10px', cursor: 'pointer',
      border: `1px solid ${checked ? Colors.success[200] : Colors.neutral[200]}`, bgcolor: checked ? Colors.success[50] : Colors.white,
      fontSize: '0.875rem', color: Colors.neutral[800], lineHeight: 1.45,
    }}>
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} style={{ marginTop: 2 }} />
      <span>{children}</span>
    </Box>
  );
}

/** The decision: three checks before approving, a note before rejecting. */
function Decision({ r, person }: { r: any; person?: any }) {
  const notify = useNotify();
  const refresh = useRefresh();
  const [checks, setChecks] = useState({ readable: false, name: false, face: false });
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  useEffect(() => { setChecks({ readable: false, name: false, face: false }); setNote(''); setWithdrawing(false); }, [r.id, r.submission_version, r.verification_status]);

  const missing = [!r.id_document_front_url && 'ID front', !r.id_document_back_url && 'ID back', r.selfie_required && !r.selfie_with_id_url && 'photo holding the ID'].filter(Boolean) as string[];
  const allChecked = checks.readable && checks.name && checks.face;
  const noteOk = note.trim().length >= 3;
  const review = async (decision: 'approved' | 'rejected') => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc('review_agent_identity', {
        p_id: r.id, p_version: r.submission_version, p_decision: decision, p_note: note.trim() || null, p_expected_status: r.verification_status,
      });
      if (error) throw error;
      notify(decision === 'approved' ? 'ID approved. Their available listings are now visible.' : 'ID rejected. They have been told what to fix.', { type: 'success' });
      refresh();
    } catch (e) { notify((e as Error).message, { type: 'error' }); refresh(); }
    finally { setBusy(false); }
  };

  const noteField = (label: string, help: string) => (
    <Box>
      <Typography component="label" htmlFor="identity-review-note" sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: Colors.neutral[900] }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.75rem', color: Colors.neutral[500], mb: 1 }}>{help}</Typography>
      <Textarea id="identity-review-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000}
        placeholder="For example: The back of the ID is blurred. Please upload a sharper photo." />
    </Box>
  );

  // The panel opens with where things stand.
  const header = (icon: string, tone: string, title: string, body: ReactNode) => (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2.5 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: `${tone}1A`, color: tone, flexShrink: 0 }}>
        <Icon icon={icon} width={19} />
      </Box>
      <Box>
        <Typography component="h2" sx={{ fontSize: '1rem', fontWeight: 650, color: Colors.neutral[900] }}>{title}</Typography>
        <Typography sx={{ fontSize: '0.8125rem', color: Colors.neutral[600], mt: 0.25 }}>{body}</Typography>
      </Box>
    </Stack>
  );

  if (r.verification_status === 'pending') {
    return header('lucide:hourglass', Colors.neutral[600], 'Not submitted yet',
      missing.length ? `Still missing: ${missing.join(', ')}.` : 'All files are uploaded, but they have not pressed submit yet.');
  }
  if (r.verification_status === 'rejected') {
    return <>
      {header('lucide:circle-x', Colors.error[600], 'Rejected', `Reviewed ${fullDate(r.verified_at)}. Waiting for a new submission.`)}
      <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: Colors.error[50], color: Colors.error[800], fontSize: '0.875rem' }}>{r.rejection_reason}</Box>
    </>;
  }
  if (r.verification_status === 'approved') {
    return <>
      {header('lucide:badge-check', Colors.success[600], 'Approved', `Reviewed ${fullDate(r.verified_at)}. Their available listings are visible.`)}
      {!withdrawing
        ? <Button variant="outline" onClick={() => setWithdrawing(true)} style={{ width: '100%' }}>Withdraw approval</Button>
        : <Stack spacing={1.5}>
            {noteField('Why are you withdrawing it?', 'They will see this note. Their listings are hidden until a new ID is approved.')}
            <Stack direction="row" spacing={1}>
              <Button variant="ghost" onClick={() => setWithdrawing(false)} disabled={busy}>Cancel</Button>
              <Button variant="destructive" disabled={busy || !noteOk} onClick={() => void review('rejected')} style={{ flex: 1 }}>Withdraw approval</Button>
            </Stack>
          </Stack>}
    </>;
  }

  const earlier = r.submission_version - 1;
  return <>
    {header('lucide:scan-face', Colors.warning[600], 'Your decision',
      `Submitted ${since(r.submitted_at)}${earlier > 0 ? `, after ${earlier} earlier attempt${earlier > 1 ? 's' : ''}` : ''}.`)}
    <Stack spacing={1}>
      <Check id="chk-readable" checked={checks.readable} onChange={(v) => setChecks((c) => ({ ...c, readable: v }))}>Both sides of the ID are clear and readable</Check>
      <Check id="chk-name" checked={checks.name} onChange={(v) => setChecks((c) => ({ ...c, name: v }))}>
        The name on the ID matches <strong>{person?.full_name || 'the account'}</strong></Check>
      <Check id="chk-face" checked={checks.face} onChange={(v) => setChecks((c) => ({ ...c, face: v }))}>The face matches the photo of them holding the ID</Check>
    </Stack>
    <Box sx={{ mt: 2.5 }}>{noteField('Note to them', 'Required to reject. They will see it in the app.')}</Box>
    <Stack spacing={1} sx={{ mt: 2.5 }}>
      <Button disabled={busy || !allChecked || missing.length > 0} onClick={() => void review('approved')} style={{ width: '100%', height: 42 }}>
        <Icon icon="lucide:check" /> Approve ID and publish listings
      </Button>
      <Button variant="outline" disabled={busy || !noteOk} onClick={() => void review('rejected')}
        style={{ width: '100%', height: 42, color: noteOk ? Colors.error[700] : undefined, borderColor: noteOk ? Colors.error[300] : undefined }}>
        Reject and ask for a new ID
      </Button>
      {!allChecked && <Typography sx={{ fontSize: '0.75rem', color: Colors.neutral[500], textAlign: 'center' }}>Tick all three checks to approve.</Typography>}
      {missing.length > 0 && <Typography sx={{ fontSize: '0.75rem', color: Colors.error[700], textAlign: 'center' }}>Missing: {missing.join(', ')}.</Typography>}
    </Stack>
  </>;
}

/** Past decisions on this ID, newest first. */
function History({ identityId }: { identityId: string }) {
  const { data = [], isPending } = useGetList('agent_identity_review_events', {
    filter: { identity_id: identityId }, sort: { field: 'created_at', order: 'DESC' }, pagination: { page: 1, perPage: 50 },
  });
  const reviewerIds = [...new Set(data.map((e: any) => e.reviewer_id).filter(Boolean))];
  const { data: reviewers = [] } = useGetMany('profiles', { ids: reviewerIds }, { enabled: reviewerIds.length > 0 });
  const name = (id: string) => reviewers.find((p: any) => p.id === id)?.full_name || 'An admin';
  if (isPending) return <Skeleton height={60} />;
  if (!data.length) return <Typography sx={{ fontSize: '0.875rem', color: Colors.neutral[500] }}>No decisions yet. This is their first review.</Typography>;
  return (
    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {data.map((e: any, i: number) => {
        const ok = e.decision === 'approved';
        return (
          <Box component="li" key={e.id} sx={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 1.5, pb: i === data.length - 1 ? 0 : 2.5, position: 'relative' }}>
            {i < data.length - 1 && <Box sx={{ position: 'absolute', left: 9, top: 22, bottom: 0, width: 2, bgcolor: Colors.neutral[200] }} />}
            <Box sx={{ width: 20, height: 20, borderRadius: '50%', mt: 0.25, display: 'grid', placeItems: 'center', bgcolor: ok ? Colors.success[100] : Colors.error[100], color: ok ? Colors.success[700] : Colors.error[700] }}>
              <Icon icon={ok ? 'lucide:check' : 'lucide:x'} width={12} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: Colors.neutral[900] }}>
                {ok ? 'Approved' : 'Rejected'} by {name(e.reviewer_id)}
                <Box component="span" sx={{ fontWeight: 400, color: Colors.neutral[500] }}>{`, submission ${e.submission_version}`}</Box>
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: Colors.neutral[500] }}>{fullDate(e.created_at)}</Typography>
              {e.note && <Typography sx={{ fontSize: '0.8125rem', color: Colors.neutral[700], mt: 0.75 }}>{e.note}</Typography>}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function IdentityDetail() {
  const r = useRecordContext<any>();
  const navigate = useNavigate();
  const { data: person } = useGetOne('profiles', { id: r?.agent_id }, { enabled: !!r?.agent_id });
  if (!r) return <Skeleton height={320} />;
  const meta = (icon: string, text: ReactNode) => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}><Icon icon={icon} width={14} />{text}</Box>
  );

  return (
    <Box sx={{ maxWidth: 1240, mx: 'auto', pb: 4 }}>
      {/* Who this is */}
      <Box sx={{ ...panel, p: { xs: 2.25, md: 3 } }}>
        <Box component="button" type="button" onClick={() => navigate(-1)} sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.75, mb: 2, p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '0.8125rem', fontWeight: 500, color: Colors.neutral[600], '&:hover': { color: Colors.primary[600] },
        }}><Icon icon="lucide:arrow-left" width={16} />ID reviews</Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar sx={{ width: 56, height: 56, fontSize: '1.125rem', fontWeight: 700, bgcolor: Colors.primary[50], color: Colors.primary[700] }}>{initials(person?.full_name)}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h1" sx={{ fontSize: { xs: '1.375rem', md: '1.625rem' }, fontWeight: 700, color: Colors.neutral[900], letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {person?.full_name || <Skeleton width={180} />}
              </Typography>
              <Stack direction="row" spacing={2} useFlexGap sx={{ mt: 0.75, flexWrap: 'wrap', fontSize: '0.8125rem', color: Colors.neutral[600] }}>
                {meta('lucide:briefcase', roleLabel(person?.role))}
                {person?.email && meta('lucide:mail', person.email)}
                {person?.phone && meta('lucide:phone', person.phone)}
              </Stack>
            </Box>
          </Stack>
          <StatusChip value={r.verification_status} sx={{ height: 28, fontSize: '0.8125rem' }} />
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gap: 2, mt: 2, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 380px' }, alignItems: 'start' }}>
        {/* The documents */}
        <Stack spacing={2} sx={{ minWidth: 0 }}>
          <Box sx={{ ...panel, p: { xs: 2.25, md: 3 } }}>
            <Typography component="h2" sx={{ fontSize: '1rem', fontWeight: 650, color: Colors.neutral[900] }}>Documents</Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: Colors.neutral[600], mt: 0.5, mb: 2.5 }}>
              Private files. The links expire after five minutes; reload the page for new ones.
            </Typography>
            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <DocumentTile label="ID front" path={r.id_document_front_url} hint="Photo, name and ID number" />
              <DocumentTile label="ID back" path={r.id_document_back_url} />
              <DocumentTile label="Holding the ID" path={r.selfie_with_id_url} hint="Compare this face with the ID photo" />
            </Box>
          </Box>
          <Box sx={{ ...panel, p: { xs: 2.25, md: 3 } }}>
            <Typography component="h2" sx={{ fontSize: '1rem', fontWeight: 650, color: Colors.neutral[900], mb: 2 }}>Review history</Typography>
            <History identityId={r.id} />
          </Box>
        </Stack>

        {/* The decision stays in view while the documents scroll. */}
        <Box sx={{ ...panel, p: { xs: 2.25, md: 3 }, position: { lg: 'sticky' }, top: { lg: 16 } }}>
          <Decision r={r} person={person} />
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${Colors.neutral[200]}`, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.75, fontSize: '0.8125rem' }}>
            <Box sx={{ color: Colors.neutral[500] }}>Submitted</Box><Box sx={{ color: Colors.neutral[900] }}>{r.submitted_at ? fullDate(r.submitted_at) : 'Not yet'}</Box>
            <Box sx={{ color: Colors.neutral[500] }}>Submission</Box><Box sx={{ color: Colors.neutral[900] }}>{r.submission_version > 0 ? r.submission_version : '—'}</Box>
            {r.verification_status === 'documents_review' && <>
              <Box sx={{ color: Colors.neutral[500] }}>On approval</Box><Box sx={{ color: Colors.neutral[900] }}>Their available listings and stays go live</Box>
            </>}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export const AgentIdentityEdit = () => <Edit title={false} component={Box} actions={false}><IdentityDetail /></Edit>;
