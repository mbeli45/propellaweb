import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Edit,
  SimpleForm,
  SelectInput,
  SelectField,
  TextInput,
  ReferenceField,
  ReferenceInput,
  EditButton,
  ShowButton,
  useRecordContext,
} from 'react-admin';
import { EditToolbar } from '../components/EditToolbar';

const WithdrawalRequestTitle = () => {
  const record = useRecordContext();
  return <span>Withdrawal: {record?.id?.slice(0, 8)}</span>;
};

export const WithdrawalRequestList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filterDefaultValues={{ status: 'pending' }}
    sx={{
      '& .RaList-content': {
        boxShadow: 'none',
      },
    }}
  >
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <ReferenceField source="user_id" reference="profiles" label="User">
        <TextField source="full_name" />
      </ReferenceField>
      <NumberField source="amount" options={{ style: 'currency', currency: 'XAF' }} />
      <TextField source="phone" />
      <SelectField
        source="status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'approved', name: 'Approved' },
          { id: 'rejected', name: 'Rejected' },
          { id: 'completed', name: 'Completed' },
          { id: 'failed', name: 'Failed' },
        ]}
      />
      <TextField source="payment_reference" label="Payment Ref" />
      <DateField source="created_at" showTime />
      <DateField source="processed_at" showTime />
      <EditButton />
      <ShowButton />
    </Datagrid>
  </List>
);

export const WithdrawalRequestEdit = () => (
  <Edit title={<WithdrawalRequestTitle />}>
    <SimpleForm toolbar={<EditToolbar />}>
      <ReferenceInput source="user_id" reference="profiles" label="User">
        <SelectInput optionText="full_name" disabled />
      </ReferenceInput>
      <NumberInput source="amount" disabled />
      <TextInput source="phone" disabled />
      <SelectInput
        source="status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'approved', name: 'Approved' },
          { id: 'rejected', name: 'Rejected' },
          { id: 'completed', name: 'Completed' },
          { id: 'failed', name: 'Failed' },
        ]}
      />
      <TextInput source="payment_reference" label="Payment Reference" />
      <TextInput source="rejection_reason" multiline rows={3} fullWidth />
      <TextInput source="admin_notes" multiline rows={3} fullWidth />
      <DateField source="processed_at" showTime />
    </SimpleForm>
  </Edit>
);
