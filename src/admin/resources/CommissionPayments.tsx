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
  NumberInput,
  TextInput,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  Filter,
  EditButton,
  ShowButton,
  useRecordContext,
} from 'react-admin';
import { EditToolbar } from '../components/EditToolbar';

const CommissionPaymentTitle = () => {
  const record = useRecordContext();
  return <span>Commission Payment: {record?.id?.slice(0, 8)}</span>;
};

const CommissionPaymentFilter = (props: any) => (
  <Filter {...props}>
    <ReferenceInput source="agent_id" reference="profiles" alwaysOn>
      <AutocompleteInput
        label="Agent"
        optionText={(r: any) => (r ? r.full_name || r.email || '(no name)' : '')}
        filterToQuery={(q: string) => ({ 'full_name@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
    <ReferenceInput source="property_id" reference="properties">
      <AutocompleteInput
        label="Property"
        optionText="title"
        filterToQuery={(q: string) => ({ 'title@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
    <SelectInput
      source="status"
      choices={[
        { id: 'pending', name: 'Pending' },
        { id: 'completed', name: 'Completed' },
        { id: 'failed', name: 'Failed' },
        { id: 'cancelled', name: 'Cancelled' },
      ]}
      alwaysOn
    />
  </Filter>
);

export const CommissionPaymentList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filters={<CommissionPaymentFilter />}
    sx={{
      '& .RaList-content': {
        boxShadow: 'none',
      },
    }}
  >
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <ReferenceField source="agent_id" reference="profiles" label="Agent">
        <TextField source="full_name" />
      </ReferenceField>
      <ReferenceField source="property_id" reference="properties" label="Property">
        <TextField source="title" />
      </ReferenceField>
      <NumberField source="amount" options={{ style: 'currency', currency: 'XAF' }} />
      <NumberField source="agent_amount" options={{ style: 'currency', currency: 'XAF' }} />
      <NumberField source="platform_fee" options={{ style: 'currency', currency: 'XAF' }} />
      <SelectField
        source="status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'completed', name: 'Completed' },
          { id: 'failed', name: 'Failed' },
          { id: 'cancelled', name: 'Cancelled' },
        ]}
      />
      <SelectField
        source="escrow_status"
        choices={[
          { id: 'locked', name: 'Locked' },
          { id: 'released', name: 'Released' },
          { id: 'refunded', name: 'Refunded' },
        ]}
      />
      <DateField source="created_at" showTime />
      <DateField source="paid_at" showTime />
      <EditButton />
      <ShowButton />
    </Datagrid>
  </List>
);

export const CommissionPaymentEdit = () => (
  <Edit title={<CommissionPaymentTitle />}>
    <SimpleForm toolbar={<EditToolbar />}>
      <ReferenceInput source="agent_id" reference="profiles" label="Agent">
        <SelectInput optionText="full_name" disabled />
      </ReferenceInput>
      <ReferenceInput source="property_id" reference="properties" label="Property">
        <SelectInput optionText="title" disabled />
      </ReferenceInput>
      <NumberInput source="amount" />
      <NumberInput source="agent_amount" />
      <NumberInput source="platform_fee" />
      <SelectInput
        source="status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'completed', name: 'Completed' },
          { id: 'failed', name: 'Failed' },
          { id: 'cancelled', name: 'Cancelled' },
        ]}
      />
      <SelectInput
        source="escrow_status"
        choices={[
          { id: 'locked', name: 'Locked' },
          { id: 'released', name: 'Released' },
          { id: 'refunded', name: 'Refunded' },
        ]}
      />
      <TextInput source="notes" multiline rows={3} fullWidth />
      <DateField source="release_date" showTime />
      <DateField source="released_at" showTime />
    </SimpleForm>
  </Edit>
);
