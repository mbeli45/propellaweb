import {
  List,
  Datagrid,
  TextField,
  DateField,
  BooleanField,
  ReferenceField,
  ShowButton,
  useRecordContext,
} from 'react-admin';

export const NotificationList = () => (
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
      <ReferenceField source="user_id" reference="profiles" label="User">
        <TextField source="full_name" />
      </ReferenceField>
      <TextField source="title" />
      <TextField source="body" />
      <TextField source="type" />
      <BooleanField source="read" />
      <DateField source="created_at" showTime />
      <ShowButton />
    </Datagrid>
  </List>
);
