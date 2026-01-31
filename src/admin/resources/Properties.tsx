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
  ImageField,
  ArrayField,
  SingleFieldList,
  ChipField,
  EditButton,
  ShowButton,
  useRecordContext,
  ReferenceField,
  ReferenceInput,
} from 'react-admin';
import { Colors } from '@/constants/Colors';
import { DeleteButtonWithConfirm } from '../components/DeleteButtonWithConfirm';
import { EditToolbar } from '../components/EditToolbar';

const PropertyTitle = () => {
  const record = useRecordContext();
  return <span>Property: {record?.title || record?.id}</span>;
};

export const PropertyList = () => {
  return (
    <List
      sort={{ field: 'created_at', order: 'DESC' }}
      sx={{
        '& .RaList-content': {
          boxShadow: 'none',
        },
      }}
    >
      <Datagrid rowClick="edit">
        <TextField source="title" />
        <NumberField source="price" options={{ style: 'currency', currency: 'XAF' }} />
        <TextField source="status" />
        <ReferenceField source="owner_id" reference="profiles" label="Owner">
          <TextField source="full_name" />
        </ReferenceField>
        <TextField source="location" />
        <BooleanField source="is_featured" />
        <DateField source="created_at" showTime />
        <EditButton />
        <ShowButton />
        <DeleteButtonWithConfirm />
      </Datagrid>
    </List>
  );
};

export const PropertyEdit = () => (
  <Edit title={<PropertyTitle />}>
    <SimpleForm toolbar={<EditToolbar />}>
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
  </Edit>
);

export const PropertyCreate = () => (
  <Create>
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
