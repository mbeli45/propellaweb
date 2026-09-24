import { TextInput, AutocompleteInput } from '../components/ShadcnInputs';
import { AdminTable, AdminPagination } from '../components/AdminTable';
import {
  List,
  TextField,
  NumberField,
  DateField,
  ReferenceField,
  ReferenceInput,
  Filter,
  useRecordContext,
} from 'react-admin';

const PropertyViewFilter = (props: any) => (
  <Filter {...props}>
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
        label="User"
        optionText={(r: any) => (r ? r.full_name || r.email || '(no name)' : '')}
        filterToQuery={(q: string) => ({ 'full_name@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
    <TextInput source="source@ilike" label="Search source" resettable />
  </Filter>
);

export const PropertyViewList = () => (
  <List pagination={<AdminPagination />} className="admin-resource-list"
    sort={{ field: 'created_at', order: 'DESC' }}
    filters={<PropertyViewFilter />}
    sx={{
      '& .RaList-content': {
        boxShadow: 'none',
      },
    }}
  >
    <AdminTable>
      <TextField source="id" label="ID" />
      <ReferenceField source="property_id" reference="properties" label="Property">
        <TextField source="title" />
      </ReferenceField>
      <ReferenceField source="user_id" reference="profiles" label="User">
        <TextField source="full_name" />
      </ReferenceField>
      <TextField source="source" />
      <TextField source="device_type" />
      <DateField source="created_at" showTime />
    </AdminTable>
  </List>
);
