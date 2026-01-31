import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  ReferenceField,
  ShowButton,
  useRecordContext,
} from 'react-admin';

export const WalletList = () => (
  <List
    sort={{ field: 'updated_at', order: 'DESC' }}
    sx={{
      '& .RaList-content': {
        boxShadow: 'none',
      },
    }}
  >
    <Datagrid>
      <ReferenceField source="user_id" reference="profiles" label="User">
        <TextField source="full_name" />
      </ReferenceField>
      <NumberField source="balance" options={{ style: 'currency', currency: 'XAF' }} />
      <NumberField source="locked_balance" options={{ style: 'currency', currency: 'XAF' }} />
      <NumberField source="total_earned" options={{ style: 'currency', currency: 'XAF' }} />
      <NumberField source="total_withdrawn" options={{ style: 'currency', currency: 'XAF' }} />
      <DateField source="created_at" showTime />
      <DateField source="updated_at" showTime />
      <ShowButton />
    </Datagrid>
  </List>
);
