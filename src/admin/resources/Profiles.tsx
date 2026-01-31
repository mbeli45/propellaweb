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
  SelectField,
  BooleanInput,
  EditButton,
  ShowButton,
  useRecordContext,
  ImageField,
} from 'react-admin';
import { DeleteButtonWithConfirm } from '../components/DeleteButtonWithConfirm';
import { EditToolbar } from '../components/EditToolbar';

const ProfileTitle = () => {
  const record = useRecordContext();
  return <span>Profile: {record?.full_name || record?.email || record?.id}</span>;
};

export const ProfileList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    sx={{
      '& .RaList-content': {
        boxShadow: 'none',
      },
    }}
  >
    <Datagrid rowClick="edit">
      <ImageField source="avatar_url" label="Avatar" sx={{ '& img': { width: 40, height: 40, borderRadius: '50%' } }} />
      <TextField source="full_name" />
      <EmailField source="email" />
      <TextField source="phone" />
      <SelectField
        source="role"
        choices={[
          { id: 'user', name: 'User' },
          { id: 'agent', name: 'Agent' },
          { id: 'landlord', name: 'Landlord' },
          { id: 'admin', name: 'Admin' },
        ]}
      />
      <BooleanField source="verified" />
      <BooleanField source="is_verified_agent" label="Verified Agent" />
      <DateField source="created_at" showTime />
      <EditButton />
      <ShowButton />
      <DeleteButtonWithConfirm />
    </Datagrid>
  </List>
);

export const ProfileEdit = () => (
  <Edit title={<ProfileTitle />}>
    <SimpleForm toolbar={<EditToolbar />}>
      <TextInput source="full_name" fullWidth />
      <TextInput source="email" fullWidth disabled />
      <TextInput source="phone" fullWidth />
      <TextInput source="location" fullWidth />
      <TextInput source="bio" multiline rows={4} fullWidth />
      <SelectInput
        source="role"
        choices={[
          { id: 'user', name: 'User' },
          { id: 'agent', name: 'Agent' },
          { id: 'landlord', name: 'Landlord' },
          { id: 'admin', name: 'Admin' },
        ]}
      />
      <BooleanInput source="verified" />
      <BooleanInput source="is_verified_agent" label="Verified Agent" />
      <TextInput source="avatar_url" fullWidth label="Avatar URL" />
    </SimpleForm>
  </Edit>
);
