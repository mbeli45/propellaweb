import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  SelectInput,
  Filter,
  useRecordContext,
} from 'react-admin';
import { Box, Stack, Typography, Divider } from '@mui/material';
import { Colors } from '@/constants/Colors';
import { DeleteButtonWithConfirm } from '../components/DeleteButtonWithConfirm';
import { EditToolbar } from '../components/EditToolbar';
import {
  ResponsiveList,
  CardHeader,
  CardRow,
  IconAvatar,
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

const ReviewTitle = () => {
  const record = useRecordContext();
  return <span>Review #{record?.id?.slice(0, 8)}</span>;
};

const StarRating = ({ rating }: { rating: number }) => {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating ?? 0))));
  return (
    <Typography variant="body2" sx={{ color: Colors.warning[600], letterSpacing: 1, fontWeight: 600 }}>
      {'★'.repeat(r)}<span style={{ color: Colors.neutral[300] }}>{'★'.repeat(5 - r)}</span>
      <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
        {r}/5
      </Typography>
    </Typography>
  );
};

const ReviewFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="comment@ilike" label="Search comment" alwaysOn resettable />
    <ReferenceInput source="property_id" reference="properties" alwaysOn>
      <AutocompleteInput
        label="Property"
        optionText="title"
        filterToQuery={(q: string) => ({ 'title@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
    <ReferenceInput source="user_id" reference="profiles">
      <AutocompleteInput
        label="Reviewer"
        optionText={(r: any) => (r ? r.full_name || r.email || '(no name)' : '')}
        filterToQuery={(q: string) => ({ 'full_name@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
  </Filter>
);

const ReviewCard = () => {
  const r = useRecord<any>();
  if (!r) return null;
  return (
    <Stack spacing={1.5}>
      <CardHeader
        avatar={<IconAvatar icon="lucide:star" tone="warning" />}
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
        right={<StarRating rating={r.rating} />}
      />
      {r.comment && (
        <>
          <Divider />
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            "{r.comment}"
          </Typography>
        </>
      )}
      <CardRow label="When" value={new Date(r.created_at).toLocaleDateString('en-US')} />
    </Stack>
  );
};

const ReviewDatagrid = () => (
  <Datagrid rowClick="edit" bulkActionButtons={false}>
    <ReferenceField source="property_id" reference="properties" label="Property" link={false}>
      <TextField source="title" />
    </ReferenceField>
    <ReferenceField source="user_id" reference="profiles" label="User" link={false}>
      <TextField source="full_name" />
    </ReferenceField>
    <NumberField source="rating" />
    <TextField source="comment" />
    <DateField source="created_at" />
    <DeleteButtonWithConfirm />
  </Datagrid>
);

export const ReviewList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filters={<ReviewFilter />}
    sx={{ '& .RaList-content': { boxShadow: 'none' } }}
  >
    <ResponsiveList desktop={<ReviewDatagrid />} card={<ReviewCard />} />
  </List>
);

const ReviewDetail = () => {
  const record = useRecordContext<any>();
  if (!record) return <DetailPage>Loading…</DetailPage>;
  return (
    <DetailPage>
      <DetailHero
        eyebrow="Review"
        title={
          <ReferenceField source="property_id" reference="properties" link={false}>
            <TextField source="title" />
          </ReferenceField>
        }
        badges={<StarRating rating={record.rating} />}
        meta={
          <>
            <MetaItem label="Review ID" value={`#${String(record.id).slice(0, 8)}`} />
            <MetaItem label="Posted" value={new Date(record.created_at).toLocaleDateString('en-US')} />
            <MetaItem label="Rating" value={`${record.rating}/5`} />
          </>
        }
      />

      <DetailSection title="Parties">
        <DetailGrid>
          <DetailEntityCard
            icon="lucide:building-2"
            tone="primary"
            label="Property"
            value={
              <ReferenceField source="property_id" reference="properties" link={false}>
                <TextField source="title" />
              </ReferenceField>
            }
          />
          <DetailEntityCard
            icon="lucide:user"
            tone="neutral"
            label="Reviewer"
            value={
              <ReferenceField source="user_id" reference="profiles" link={false}>
                <TextField source="full_name" />
              </ReferenceField>
            }
          />
        </DetailGrid>
      </DetailSection>

      {record.comment && (
        <DetailSection title="Comment">
          <Typography
            variant="body1"
            sx={{
              color: Colors.neutral[800],
              fontStyle: 'italic',
              lineHeight: 1.6,
              borderLeft: `3px solid ${Colors.neutral[300]}`,
              pl: 2,
              py: 0.5,
            }}
          >
            "{record.comment}"
          </Typography>
        </DetailSection>
      )}

      <DetailSection title="Edit" noDivider>
        <SimpleForm
          toolbar={<EditToolbar />}
          sx={{ padding: 0, '& .RaSimpleForm-form': { padding: 0 } }}
        >
          <ReferenceInput source="property_id" reference="properties" label="Property">
            <SelectInput optionText="title" disabled fullWidth />
          </ReferenceInput>
          <ReferenceInput source="user_id" reference="profiles" label="User">
            <SelectInput optionText="full_name" disabled fullWidth />
          </ReferenceInput>
          <NumberInput source="rating" min={1} max={5} />
          <TextInput source="comment" multiline rows={4} fullWidth />
        </SimpleForm>
      </DetailSection>
    </DetailPage>
  );
};

export const ReviewEdit = () => (
  <Edit title={false} component={Box} actions={false}>
    <ReviewDetail />
  </Edit>
);
