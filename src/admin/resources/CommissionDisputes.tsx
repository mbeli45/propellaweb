import {
  List,
  Datagrid,
  TextField,
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

const CommissionDisputeTitle = () => {
  const record = useRecordContext();
  return <span>Dispute: {record?.id?.slice(0, 8)}</span>;
};

export const CommissionDisputeList = () => (
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
      <ReferenceField source="commission_payment_id" reference="commission_payments" label="Payment ID">
        <TextField source="id" />
      </ReferenceField>
      <ReferenceField source="reported_by" reference="profiles" label="Reported By">
        <TextField source="full_name" />
      </ReferenceField>
      <TextField source="dispute_type" />
      <SelectField
        source="status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'resolved', name: 'Resolved' },
          { id: 'dismissed', name: 'Dismissed' },
        ]}
      />
      <DateField source="created_at" showTime />
      <DateField source="resolved_at" showTime />
      <EditButton />
      <ShowButton />
    </Datagrid>
  </List>
);

export const CommissionDisputeEdit = () => (
  <Edit title={<CommissionDisputeTitle />}>
    <SimpleForm toolbar={<EditToolbar />}>
      <ReferenceInput source="commission_payment_id" reference="commission_payments" label="Payment">
        <SelectInput optionText="id" disabled />
      </ReferenceInput>
      <ReferenceInput source="reported_by" reference="profiles" label="Reported By">
        <SelectInput optionText="full_name" disabled />
      </ReferenceInput>
      <TextField source="dispute_type" disabled />
      <TextInput source="description" multiline rows={4} fullWidth disabled />
      <SelectInput
        source="status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'resolved', name: 'Resolved' },
          { id: 'dismissed', name: 'Dismissed' },
        ]}
      />
      <TextInput source="resolution" multiline rows={4} fullWidth />
      <ReferenceInput source="resolved_by" reference="profiles" label="Resolved By">
        <SelectInput optionText="full_name" />
      </ReferenceInput>
      <DateField source="resolved_at" showTime />
    </SimpleForm>
  </Edit>
);
