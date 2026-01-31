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
  DateInput,
  TimeInput,
  ReferenceField,
  ReferenceInput,
  EditButton,
  ShowButton,
  useRecordContext,
} from 'react-admin';
import { DeleteButtonWithConfirm } from '../components/DeleteButtonWithConfirm';
import { EditToolbar } from '../components/EditToolbar';

const ReservationTitle = () => {
  const record = useRecordContext();
  return <span>Reservation #{record?.id?.slice(0, 8)}</span>;
};

export const ReservationList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    sx={{
      '& .RaList-content': {
        boxShadow: 'none',
      },
    }}
  >
    <Datagrid rowClick="edit">
      <ReferenceField source="property_id" reference="properties" label="Property">
        <TextField source="title" />
      </ReferenceField>
      <NumberField source="amount" options={{ style: 'currency', currency: 'XAF' }} />
      <SelectField
        source="status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'confirmed', name: 'Confirmed' },
          { id: 'completed', name: 'Completed' },
          { id: 'cancelled', name: 'Cancelled' },
        ]}
      />
      <TextField source="id" label="ID" />
      <ReferenceField source="user_id" reference="profiles" label="Client">
        <TextField source="full_name" />
      </ReferenceField>
      <DateField source="reservation_date" />
      <TextField source="reservation_time" />
      <SelectField
        source="payment_status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'completed', name: 'Completed' },
          { id: 'failed', name: 'Failed' },
          { id: 'refunded', name: 'Refunded' },
        ]}
      />
      <DateField source="created_at" showTime />
      <EditButton />
      <ShowButton />
      <DeleteButtonWithConfirm />
    </Datagrid>
  </List>
);

export const ReservationEdit = () => (
  <Edit title={<ReservationTitle />}>
    <SimpleForm toolbar={<EditToolbar />}>
      <ReferenceInput source="user_id" reference="profiles" label="Client">
        <SelectInput optionText="full_name" disabled />
      </ReferenceInput>
      <ReferenceInput source="property_id" reference="properties" label="Property">
        <SelectInput optionText="title" disabled />
      </ReferenceInput>
      <DateInput source="reservation_date" />
      <TimeInput source="reservation_time" />
      <NumberInput source="amount" />
      <SelectInput
        source="status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'confirmed', name: 'Confirmed' },
          { id: 'completed', name: 'Completed' },
          { id: 'cancelled', name: 'Cancelled' },
        ]}
      />
      <SelectInput
        source="payment_status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'completed', name: 'Completed' },
          { id: 'failed', name: 'Failed' },
          { id: 'refunded', name: 'Refunded' },
        ]}
      />
      <TextField source="transaction_id" disabled />
    </SimpleForm>
  </Edit>
);
