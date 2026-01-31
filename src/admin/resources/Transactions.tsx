import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  SelectField,
  ShowButton,
  useRecordContext,
} from 'react-admin';

export const TransactionList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    sx={{
      '& .RaList-content': {
        boxShadow: 'none',
      },
    }}
  >
    <Datagrid>
      <TextField source="id" label="Transaction ID" />
      <TextField source="user_id" label="User ID" />
      <SelectField
        source="type"
        choices={[
          { id: 'payment', name: 'Payment' },
          { id: 'refund', name: 'Refund' },
          { id: 'withdrawal', name: 'Withdrawal' },
          { id: 'commission', name: 'Commission' },
        ]}
      />
      <NumberField source="amount" options={{ style: 'currency', currency: 'XAF' }} />
      <SelectField
        source="status"
        choices={[
          { id: 'pending', name: 'Pending' },
          { id: 'completed', name: 'Completed' },
          { id: 'failed', name: 'Failed' },
        ]}
      />
      <TextField source="payment_method" />
      <TextField source="transaction_id" label="External Transaction ID" />
      <DateField source="created_at" showTime />
      <ShowButton />
    </Datagrid>
  </List>
);
