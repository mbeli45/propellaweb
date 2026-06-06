import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  BooleanField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  BooleanInput,
  SelectInput,
  Filter,
  EditButton,
  useRecordContext,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  FunctionField,
} from 'react-admin';
import { Box, Stack, Typography, Divider } from '@mui/material';
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
  BackBar,
  DetailPage,
  DetailHero,
  DetailSection,
  DetailGrid,
  DetailField,
  DetailEntityCard,
  MetaItem,
} from '../components/DetailLayout';

const PropertyTitle = () => {
  const record = useRecordContext();
  return <span>Property: {record?.title || record?.id}</span>;
};

const formatXaf = (n: number | string | null | undefined) => {
  const num = Number(n ?? 0);
  return `${Math.round(num).toLocaleString('en-US')} XAF`;
};

const PropertyFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="title@ilike" label="Search title" alwaysOn resettable />
    <ReferenceInput source="owner_id" reference="profiles" alwaysOn>
      <AutocompleteInput
        label="Agent / Landlord"
        optionText={(r: any) =>
          r ? `${r.full_name || r.email || '(no name)'}${r.role ? ` · ${r.role}` : ''}` : ''
        }
        filterToQuery={(q: string) => ({ 'full_name@ilike': q })}
        sx={{ minWidth: 240 }}
      />
    </ReferenceInput>
    <TextInput source="location@ilike" label="Search location" resettable />
    <SelectInput
      source="status"
      choices={[
        { id: 'available', name: 'Available' },
        { id: 'reserved', name: 'Reserved' },
        { id: 'sold', name: 'Sold' },
        { id: 'rented', name: 'Rented' },
      ]}
      alwaysOn
    />
    <SelectInput
      source="type"
      choices={[
        { id: 'rent', name: 'For rent' },
        { id: 'sale', name: 'For sale' },
      ]}
    />
    <BooleanInput source="is_featured" label="Featured" />
  </Filter>
);

const PropertyCard = () => {
  const r = useRecord<any>();
  if (!r) return null;
  return (
    <Stack spacing={1.5}>
      <CardHeader
        avatar={
          <IconAvatar
            icon="lucide:building-2"
            tone={r.status === 'available' ? 'success' : r.status === 'reserved' ? 'warning' : 'neutral'}
          />
        }
        title={r.title ?? 'Untitled'}
        subtitle={r.location ?? '—'}
        right={<StatusChip source="status" />}
      />
      <Divider />
      <CardRow label="Price" value={formatXaf(r.price)} />
      <CardRow
        label="Owner"
        value={
          <ReferenceField source="owner_id" reference="profiles" link={false}>
            <TextField source="full_name" />
          </ReferenceField>
        }
      />
      {r.is_featured && (
        <CardRow
          label="Featured"
          value={
            <Typography variant="body2" sx={{ color: Colors.primary[700], fontWeight: 600 }}>
              ★ Yes
            </Typography>
          }
        />
      )}
      <CardRow label="Added" value={new Date(r.created_at).toLocaleDateString('en-US')} />
    </Stack>
  );
};

const PropertyDatagrid = () => (
  <Datagrid rowClick="edit" bulkActionButtons={false}>
    <TextField source="title" />
    <FunctionField
      label="Price"
      sortBy="price"
      render={(r: any) => <Typography variant="body2" fontWeight={700}>{formatXaf(r.price)}</Typography>}
    />
    <FunctionField label="Status" render={() => <StatusChip source="status" />} />
    <ReferenceField source="owner_id" reference="profiles" label="Owner" link={false}>
      <TextField source="full_name" />
    </ReferenceField>
    <TextField source="location" />
    <BooleanField source="is_featured" label="Featured" />
    <DateField source="created_at" />
    <EditButton />
    <DeleteButtonWithConfirm />
  </Datagrid>
);

export const PropertyList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filters={<PropertyFilter />}
    sx={{ '& .RaList-content': { boxShadow: 'none' } }}
  >
    <ResponsiveList desktop={<PropertyDatagrid />} card={<PropertyCard />} />
  </List>
);

const PropertyDetail = () => {
  const r = useRecordContext<any>();
  if (!r) return <DetailPage>Loading…</DetailPage>;
  const firstImage = Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : null;
  return (
    <DetailPage>
      <DetailHero
        eyebrow={r.is_featured ? '★ Featured property' : 'Property'}
        title={r.title || 'Untitled property'}
        amount={formatXaf(r.price)}
        badges={
          <>
            <StatusChip source="status" value={r.status} />
            {r.type && <StatusChip value={r.type} />}
            {r.category && <StatusChip value={r.category} />}
          </>
        }
        meta={
          <>
            <MetaItem label="Property ID" value={`#${String(r.id).slice(0, 8)}`} />
            <MetaItem label="Added" value={new Date(r.created_at).toLocaleDateString('en-US')} />
            {r.bedrooms != null && <MetaItem label="Bedrooms" value={r.bedrooms} />}
            {r.bathrooms != null && <MetaItem label="Bathrooms" value={r.bathrooms} />}
            {r.area != null && <MetaItem label="Area" value={`${r.area} m²`} />}
          </>
        }
      />

      {firstImage && (
        <DetailSection title="Cover">
          <Box
            component="img"
            src={firstImage}
            alt={r.title || 'Property'}
            sx={{
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
              maxHeight: 360,
              objectFit: 'cover',
              border: `1px solid ${Colors.neutral[200]}`,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </DetailSection>
      )}

      <DetailSection title="Listing">
        <DetailGrid cols={2}>
          <DetailEntityCard
            icon="lucide:user"
            tone="neutral"
            label="Owner"
            value={
              <ReferenceField source="owner_id" reference="profiles" link={false}>
                <TextField source="full_name" />
              </ReferenceField>
            }
          />
          <DetailEntityCard
            icon="lucide:map-pin"
            tone="primary"
            label="Location"
            value={r.location || '—'}
          />
        </DetailGrid>
      </DetailSection>

      {r.description && (
        <DetailSection title="Description">
          <Typography variant="body1" sx={{ color: Colors.neutral[800], lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {r.description}
          </Typography>
        </DetailSection>
      )}

      <DetailSection title="Edit" noDivider>
        <SimpleForm
          toolbar={<EditToolbar />}
          sx={{ padding: 0, '& .RaSimpleForm-form': { padding: 0 } }}
        >
      <TextInput source="title" fullWidth />
      <TextInput source="description" multiline rows={4} fullWidth />
      <ReferenceInput source="owner_id" reference="profiles" label="Owner">
        <SelectInput optionText="full_name" />
      </ReferenceInput>
      <NumberInput source="price" />
      <TextInput source="location" fullWidth />
      <SelectInput
        source="status"
        choices={[
          { id: 'available', name: 'Available' },
          { id: 'reserved', name: 'Reserved' },
          { id: 'sold', name: 'Sold' },
          { id: 'rented', name: 'Rented' },
        ]}
      />
      <SelectInput
        source="type"
        choices={[
          { id: 'house', name: 'House' },
          { id: 'apartment', name: 'Apartment' },
          { id: 'land', name: 'Land' },
          { id: 'commercial', name: 'Commercial' },
        ]}
      />
      <SelectInput
        source="category"
        choices={[
          { id: 'rent', name: 'Rent' },
          { id: 'sale', name: 'Sale' },
        ]}
      />
      <NumberInput source="bedrooms" />
      <NumberInput source="bathrooms" />
      <NumberInput source="area" label="Area (sqm)" />
      <NumberInput source="reservation_fee" />
      <BooleanInput source="is_featured" />
      <TextInput source="images" label="Images (comma-separated URLs)" fullWidth />
        </SimpleForm>
      </DetailSection>
    </DetailPage>
  );
};

export const PropertyEdit = () => (
  <Edit title={false} component={Box} actions={false}>
    <PropertyDetail />
  </Edit>
);

export const PropertyCreate = () => (
  <Create component={Box} actions={false}>
    <BackBar title="New property" />
    <SimpleForm>
      <TextInput source="title" fullWidth required />
      <TextInput source="description" multiline rows={4} fullWidth required />
      <ReferenceInput source="owner_id" reference="profiles" label="Owner" required>
        <SelectInput optionText="full_name" />
      </ReferenceInput>
      <NumberInput source="price" required />
      <TextInput source="location" fullWidth required />
      <SelectInput
        source="status"
        choices={[
          { id: 'available', name: 'Available' },
          { id: 'reserved', name: 'Reserved' },
          { id: 'sold', name: 'Sold' },
          { id: 'rented', name: 'Rented' },
        ]}
        defaultValue="available"
      />
      <SelectInput
        source="type"
        choices={[
          { id: 'house', name: 'House' },
          { id: 'apartment', name: 'Apartment' },
          { id: 'land', name: 'Land' },
          { id: 'commercial', name: 'Commercial' },
        ]}
        required
      />
      <SelectInput
        source="category"
        choices={[
          { id: 'rent', name: 'Rent' },
          { id: 'sale', name: 'Sale' },
        ]}
        required
      />
      <NumberInput source="bedrooms" />
      <NumberInput source="bathrooms" />
      <NumberInput source="area" label="Area (sqm)" />
      <NumberInput source="reservation_fee" />
      <BooleanInput source="is_featured" />
      <TextInput source="images" label="Images (comma-separated URLs)" fullWidth />
    </SimpleForm>
  </Create>
);
