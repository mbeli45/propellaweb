import { TextInput, NumberInput, SelectInput, AutocompleteInput } from '../components/ShadcnInputs';
import { AdminTable, AdminPagination } from '../components/AdminTable';
import { Stack } from '@mui/material';
import StatusChip from '../components/StatusChip';
import { ResponsiveList, CardHeader, CardRow } from '../components/MobileListCard';
import { FinanceHeading } from '../components/FinanceHeading';
import {
  List,
  TextField,
  NumberField,
  DateField,
  Edit,
  SimpleForm,
  SelectField,
  ReferenceField,
  ReferenceInput,
  Filter,
  EditButton,
  FunctionField,
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

const CommissionCard = () => <Stack spacing={1.5}>
  <CardHeader title={<ReferenceField source="agent_id" reference="profiles" link={false}><TextField source="full_name"/></ReferenceField>} subtitle={<ReferenceField source="property_id" reference="properties" link={false}><TextField source="title"/></ReferenceField>} right={<StatusChip source="status"/>}/>
  <CardRow label="Commission" value={<NumberField source="amount" options={{style:'currency',currency:'XAF'}}/>}/>
  <CardRow label="Agency earns" value={<NumberField source="agent_amount" options={{style:'currency',currency:'XAF'}}/>}/>
  <CardRow label="Propella fee" value={<NumberField source="platform_fee" options={{style:'currency',currency:'XAF'}}/>}/>
  <CardRow label="Release" value={<StatusChip source="escrow_status"/>}/>
  <CardRow label="Created" value={<DateField source="created_at" showTime/>}/>
</Stack>;
export const CommissionPaymentList = () => (
  <List pagination={<AdminPagination />} className="admin-resource-list finance-list"
    sort={{ field: 'created_at', order: 'DESC' }}
    filters={<CommissionPaymentFilter />}
    sx={{
      '& .RaList-content': {
        boxShadow: 'none',
      },
    }}
  >
    <FinanceHeading title="Commission payments" description="Review agency earnings, Propella fees, and the release status of each payment." />
    <ResponsiveList desktop={<AdminTable rowClick="edit" bulkActionButtons={false}>
      <ReferenceField source="agent_id" reference="profiles" label="Agent" link={false}><TextField source="full_name" /></ReferenceField>
      <ReferenceField source="property_id" reference="properties" label="Property" link={false}><TextField source="title" /></ReferenceField>
      <NumberField source="amount" label="Commission" options={{ style: 'currency', currency: 'XAF' }} />
      <NumberField source="agent_amount" label="Agency earns" options={{ style: 'currency', currency: 'XAF' }} />
      <NumberField source="platform_fee" label="Propella fee" options={{ style: 'currency', currency: 'XAF' }} />
      <FunctionField label="Payment / release" render={()=><Stack spacing={0.5} alignItems="flex-start"><StatusChip source="status"/><StatusChip source="escrow_status"/></Stack>}/>
      <DateField source="created_at" label="Created" showTime />
      <EditButton label="Review" />
    </AdminTable>} card={<CommissionCard/>}/>
  </List>
);

export const CommissionPaymentEdit = () => (
  <Edit className="finance-edit" title={<CommissionPaymentTitle />}>
    <SimpleForm toolbar={<EditToolbar />}><h2 className="finance-edit-title">Review commission payment</h2>
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
