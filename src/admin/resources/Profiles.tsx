import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  BooleanField,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  Filter,
  useRecordContext,
  FunctionField,
} from 'react-admin';
import { Avatar, Box, Stack, Typography, Chip, Divider } from '@mui/material';
import { Colors } from '@/constants/Colors';
import { DeleteButtonWithConfirm } from '../components/DeleteButtonWithConfirm';
import { EditToolbar } from '../components/EditToolbar';
import StatusChip from '../components/StatusChip';
import {
  ResponsiveList,
  CardHeader,
  CardRow,
  useRecord,
} from '../components/MobileListCard';
import {
  BackBar,
  DetailPage,
  DetailHero,
  DetailSection,
  DetailGrid,
  DetailEntityCard,
  MetaItem,
} from '../components/DetailLayout';

// Initials fallback for users with no avatar_url. Two letters, uppercase.
const initialsFor = (r: { full_name?: string | null; email?: string | null }) => {
  const source = (r.full_name || r.email || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserAvatar = ({ size = 40 }: { size?: number }) => {
  const r = useRecordContext<any>();
  if (!r) return null;
  return (
    <Avatar
      src={r.avatar_url ?? undefined}
      sx={{
        width: size,
        height: size,
        bgcolor: Colors.primary[100],
        color: Colors.primary[700],
        fontWeight: 700,
        fontSize: size * 0.4,
        // Avatar is round by default but mobile theme overrides have bitten us
        // before. Explicit borderRadius keeps it round regardless.
        borderRadius: '50%',
      }}
    >
      {initialsFor(r)}
    </Avatar>
  );
};

const ProfileTitle = () => {
  const record = useRecordContext();
  return <span>Profile: {record?.full_name || record?.email || record?.id}</span>;
};

const ROLE_TONE: Record<string, { bg: string; fg: string }> = {
  admin:    { bg: Colors.primary[100],  fg: Colors.primary[800] },
  agent:    { bg: Colors.success[100],  fg: Colors.success[800] },
  landlord: { bg: Colors.info[100],     fg: Colors.info[800] },
  user:     { bg: Colors.neutral[200],  fg: Colors.neutral[700] },
  normal:   { bg: Colors.neutral[200],  fg: Colors.neutral[700] },
};

const RoleChip = () => {
  const r = useRecord<any>();
  if (!r) return null;
  const role = (r.role ?? 'user').toLowerCase();
  const c = ROLE_TONE[role] ?? ROLE_TONE.user;
  return (
    <Chip
      size="small"
      label={role.charAt(0).toUpperCase() + role.slice(1)}
      sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600, height: 22, fontSize: '0.75rem' }}
    />
  );
};

const ProfileFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="full_name@ilike" label="Search name" alwaysOn resettable />
    <TextInput source="email@ilike" label="Search email" resettable />
    <TextInput source="phone@ilike" label="Search phone" resettable />
    <SelectInput
      source="role"
      choices={[
        { id: 'normal', name: 'User' },
        { id: 'agent', name: 'Agent' },
        { id: 'landlord', name: 'Landlord' },
        { id: 'admin', name: 'Admin' },
      ]}
      alwaysOn
    />
    <BooleanInput source="verified" label="Verified" />
    <BooleanInput source="is_verified_agent" label="Verified agent" />
  </Filter>
);

const ProfileCard = () => {
  const r = useRecord<any>();
  if (!r) return null;
  return (
    <Stack spacing={1.5}>
      <CardHeader
        avatar={<UserAvatar size={44} />}
        title={r.full_name ?? '—'}
        subtitle={r.email ?? r.phone ?? '—'}
        right={<RoleChip />}
      />
      <Divider />
      {r.phone && <CardRow label="Phone" value={r.phone} />}
      {r.location && <CardRow label="Location" value={r.location} />}
      <CardRow
        label="Verified"
        value={
          r.verified ? (
            <StatusChip value="verified" />
          ) : (
            <Typography variant="body2" color="text.secondary">No</Typography>
          )
        }
      />
      {r.role === 'agent' && (
        <CardRow
          label="Verified agent"
          value={
            r.is_verified_agent ? (
              <StatusChip value="verified" />
            ) : (
              <Typography variant="body2" color="text.secondary">No</Typography>
            )
          }
        />
      )}
      <CardRow label="Joined" value={new Date(r.created_at).toLocaleDateString('en-US')} />
    </Stack>
  );
};

const ProfileDatagrid = () => (
  <Datagrid rowClick="edit" bulkActionButtons={false}>
    <FunctionField label="" render={() => <UserAvatar />} />
    <TextField source="full_name" />
    <EmailField source="email" />
    <TextField source="phone" />
    <FunctionField label="Role" render={() => <RoleChip />} />
    <BooleanField source="verified" />
    <BooleanField source="is_verified_agent" label="Verified agent" />
    <DateField source="created_at" />
    <DeleteButtonWithConfirm />
  </Datagrid>
);

export const ProfileList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filters={<ProfileFilter />}
    sx={{ '& .RaList-content': { boxShadow: 'none' } }}
  >
    <ResponsiveList desktop={<ProfileDatagrid />} card={<ProfileCard />} />
  </List>
);

const ProfileDetail = () => {
  const r = useRecordContext<any>();
  if (!r) return <DetailPage>Loading…</DetailPage>;
  return (
    <DetailPage>
      <DetailHero
        eyebrow="User"
        title={
          <Stack direction="row" alignItems="center" spacing={2}>
            <UserAvatar size={56} />
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, lineHeight: 1.2 }}>
                {r.full_name || '(no name)'}
              </Typography>
              <Typography variant="body2" sx={{ color: Colors.neutral[600], mt: 0.5 }}>
                {r.email || '—'}
              </Typography>
            </Box>
          </Stack>
        }
        badges={
          <>
            <RoleChip />
            {r.verified && <StatusChip value="verified" />}
            {r.is_admin && (
              <Chip
                size="small"
                label="Platform Admin"
                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600, bgcolor: Colors.primary[100], color: Colors.primary[800] }}
              />
            )}
          </>
        }
        meta={
          <>
            <MetaItem label="User ID" value={`#${String(r.id).slice(0, 8)}`} />
            <MetaItem label="Joined" value={new Date(r.created_at).toLocaleDateString('en-US')} />
            {r.last_seen && <MetaItem label="Last seen" value={new Date(r.last_seen).toLocaleDateString('en-US')} />}
          </>
        }
      />

      <DetailSection title="Contact">
        <DetailGrid>
          <DetailEntityCard icon="lucide:mail" tone="primary" label="Email" value={r.email || '—'} />
          <DetailEntityCard icon="lucide:phone" tone="neutral" label="Phone" value={r.phone || '—'} />
          <DetailEntityCard icon="lucide:map-pin" tone="neutral" label="Location" value={r.location || '—'} />
        </DetailGrid>
      </DetailSection>

      {r.bio && (
        <DetailSection title="Bio">
          <Typography variant="body1" sx={{ color: Colors.neutral[800], lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {r.bio}
          </Typography>
        </DetailSection>
      )}

      <DetailSection title="Edit" noDivider>
        <SimpleForm
          toolbar={<EditToolbar />}
          sx={{ padding: 0, '& .RaSimpleForm-form': { padding: 0 } }}
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
            <TextInput source="full_name" />
            <TextInput source="email" disabled />
            <TextInput source="phone" />
            <TextInput source="location" />
          </Box>
          <TextInput source="bio" multiline rows={4} fullWidth />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
            <SelectInput
              source="role"
              choices={[
                { id: 'normal', name: 'User' },
                { id: 'agent', name: 'Agent' },
                { id: 'landlord', name: 'Landlord' },
                { id: 'admin', name: 'Admin' },
              ]}
            />
            <TextInput source="avatar_url" label="Avatar URL" />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, width: '100%' }}>
            <BooleanInput source="verified" />
            <BooleanInput source="is_verified_agent" label="Verified Agent" />
          </Box>
        </SimpleForm>
      </DetailSection>
    </DetailPage>
  );
};

export const ProfileEdit = () => (
  <Edit title={false} component={Box} actions={false}>
    <ProfileDetail />
  </Edit>
);
