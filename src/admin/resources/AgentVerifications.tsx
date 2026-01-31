import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  BooleanField,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  SelectField,
  BooleanInput,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  EditButton,
  ShowButton,
  useRecordContext,
} from 'react-admin';
import { useMediaQuery, Theme } from '@mui/material';
import { EditToolbar } from '../components/EditToolbar';
import { DeleteButtonWithConfirm } from '../components/DeleteButtonWithConfirm';

const AgentVerificationTitle = () => {
  const record = useRecordContext();
  return <span>Agent Verification: {record?.agent_id?.slice(0, 8)}</span>;
};

export const AgentVerificationList = () => {
  const isSmall = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  return (
    <List
      sort={{ field: 'created_at', order: 'DESC' }}
      sx={{
        '& .RaList-content': {
          boxShadow: 'none',
        },
      }}
    >
      {isSmall ? (
        <Datagrid
          rowClick="edit"
          sx={{
            '& .RaDatagrid-table': {
              minWidth: '700px',
            },
            overflowX: 'auto',
          }}
        >
          <ReferenceField source="agent_id" reference="profiles" label="Agent">
            <TextField source="full_name" />
          </ReferenceField>
          <TextField source="business_name" />
          <SelectField
            source="verification_status"
            choices={[
              { id: 'pending', name: 'Pending' },
              { id: 'approved', name: 'Approved' },
              { id: 'rejected', name: 'Rejected' },
              { id: 'under_review', name: 'Under Review' },
            ]}
          />
          <BooleanField source="verification_fee_paid" label="Fee Paid" />
          <NumberField source="verification_fee_amount" options={{ style: 'currency', currency: 'XAF' }} />
          <DateField source="created_at" showTime />
          <DateField source="verified_at" showTime />
          <EditButton />
          <ShowButton />
          <DeleteButtonWithConfirm />
        </Datagrid>
      ) : (
        <Datagrid rowClick="edit">
          <ReferenceField source="agent_id" reference="profiles" label="Agent">
            <TextField source="full_name" />
          </ReferenceField>
          <TextField source="business_name" />
          <SelectField
            source="verification_status"
            choices={[
              { id: 'pending', name: 'Pending' },
              { id: 'approved', name: 'Approved' },
              { id: 'rejected', name: 'Rejected' },
              { id: 'under_review', name: 'Under Review' },
            ]}
          />
          <BooleanField source="verification_fee_paid" label="Fee Paid" />
          <NumberField source="verification_fee_amount" options={{ style: 'currency', currency: 'XAF' }} />
          <DateField source="created_at" showTime />
          <DateField source="verified_at" showTime />
          <EditButton />
          <ShowButton />
          <DeleteButtonWithConfirm />
        </Datagrid>
      )}
    </List>
  );
};

export const AgentVerificationEdit = () => (
  <Edit title={<AgentVerificationTitle />}>
    <SimpleForm toolbar={<EditToolbar />}>
      <ReferenceInput source="agent_id" reference="profiles" label="Agent">
        <SelectInput optionText="full_name" disabled />
      </ReferenceInput>
      <TextInput source="business_name" fullWidth />
      <TextInput source="business_address" fullWidth />
      <SelectInput
        source="verification_status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'approved', name: 'Approved' },
          { id: 'rejected', name: 'Rejected' },
          { id: 'under_review', name: 'Under Review' },
        ]}
      />
      <BooleanInput source="verification_fee_paid" label="Fee Paid" />
      <NumberInput source="verification_fee_amount" label="Fee Amount" />
      <TextInput source="rejection_reason" multiline rows={3} fullWidth />
      <TextInput source="admin_notes" multiline rows={3} fullWidth />
      <TextInput source="id_document_front_url" fullWidth label="ID Front URL" />
      <TextInput source="id_document_back_url" fullWidth label="ID Back URL" />
      <TextInput source="business_license_url" fullWidth label="Business License URL" />
      <TextInput source="proof_of_address_url" fullWidth label="Proof of Address URL" />
    </SimpleForm>
  </Edit>
);
