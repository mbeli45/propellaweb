import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  ReferenceField,
  ShowButton,
  useRecordContext,
} from 'react-admin';

export const PropertyViewList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    sx={{
      '& .RaList-content': {
        boxShadow: 'none',
      },
    }}
  >
    <Datagrid>
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
      <ShowButton />
    </Datagrid>
  </List>
);
