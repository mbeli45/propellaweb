import {
  List,
  Datagrid,
  TextField,
  TextInput,
  DateField,
  BooleanField,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  Filter,
  ShowButton,
  useRecordContext,
} from 'react-admin';

const NotificationFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="title@ilike" label="Search title" alwaysOn resettable />
    <TextInput source="body@ilike" label="Search body" resettable />
    <ReferenceInput source="user_id" reference="profiles" alwaysOn>
      <AutocompleteInput
        label="User"
        optionText={(r: any) => (r ? r.full_name || r.email || '(no name)' : '')}
        filterToQuery={(q: string) => ({ 'full_name@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
  </Filter>
);

export const NotificationList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filters={<NotificationFilter />}
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
