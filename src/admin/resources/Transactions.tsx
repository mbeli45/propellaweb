import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Filter,
  SelectInput,
  TextInput,
  ReferenceField,
  ReferenceInput,
  AutocompleteInput,
  FunctionField,
} from 'react-admin';
import { Box, Stack, Typography, Divider } from '@mui/material';
import { Colors } from '@/constants/Colors';
import StatusChip from '../components/StatusChip';
import {
  ResponsiveList,
  CardHeader,
  CardRow,
  IconAvatar,
  useRecord,
} from '../components/MobileListCard';

const formatXaf = (n: number | string | null | undefined) => {
  const num = Number(n ?? 0);
  const sign = num >= 0 ? '+' : '';
  return `${sign}${Math.round(num).toLocaleString('en-US')} XAF`;
};

const TYPE_TO_ICON: Record<string, { icon: string; tone: 'primary' | 'success' | 'warning' | 'error' | 'neutral' }> = {
  reservation_fee: { icon: 'lucide:calendar-check', tone: 'error' },
  reservation_income: { icon: 'lucide:arrow-down-to-line', tone: 'success' },
  platform_commission: { icon: 'lucide:coins', tone: 'primary' },
  withdrawal: { icon: 'lucide:arrow-down-circle', tone: 'warning' },
  reservation_refund: { icon: 'lucide:undo-2', tone: 'warning' },
  owner_refund: { icon: 'lucide:undo-2', tone: 'warning' },
  platform_refund: { icon: 'lucide:undo-2', tone: 'warning' },
};

const TransactionFilter = (props: any) => (
  <Filter {...props}>
    <ReferenceInput source="user_id" reference="profiles" alwaysOn>
      <AutocompleteInput
        label="User"
        optionText={(r: any) => (r ? r.full_name || r.email || '(no name)' : '')}
        filterToQuery={(q: string) => ({ 'full_name@ilike': q })}
        sx={{ minWidth: 220 }}
      />
    </ReferenceInput>
    <TextInput source="reference@ilike" label="Search reference" resettable />
    <SelectInput
      source="type"
      choices={[
        { id: 'reservation_fee', name: 'Reservation fee' },
        { id: 'reservation_income', name: 'Reservation income' },
        { id: 'platform_commission', name: 'Platform commission' },
        { id: 'withdrawal', name: 'Withdrawal' },
        { id: 'reservation_refund', name: 'Reservation refund' },
      ]}
      alwaysOn
    />
    <SelectInput
      source="status"
      choices={[
        { id: 'pending', name: 'Pending' },
        { id: 'completed', name: 'Completed' },
        { id: 'failed', name: 'Failed' },
      ]}
      alwaysOn
    />
  </Filter>
);

const TransactionCard = () => {
  const r = useRecord<any>();
  if (!r) return null;
  const meta = TYPE_TO_ICON[r.type] ?? { icon: 'lucide:circle-dollar-sign', tone: 'neutral' as const };
  const amountColor = Number(r.amount) < 0 ? Colors.error[700] : Colors.success[700];
  return (
    <Stack spacing={1.5}>
      <CardHeader
        avatar={<IconAvatar icon={meta.icon} tone={meta.tone} />}
        title={<span style={{ textTransform: 'capitalize' }}>{String(r.type ?? 'unknown').replace(/_/g, ' ')}</span>}
        subtitle={
          <ReferenceField source="user_id" reference="profiles" link={false}>
            <TextField source="full_name" />
          </ReferenceField>
        }
        right={<StatusChip source="status" />}
      />
      <Divider />
      <CardRow
        label="Amount"
        value={
          <Typography variant="body2" fontWeight={700} sx={{ color: amountColor }}>
            {formatXaf(r.amount)}
          </Typography>
        }
      />
      {r.reference && <CardRow label="Reference" value={String(r.reference).slice(0, 12) + '…'} />}
      <CardRow label="When" value={new Date(r.created_at).toLocaleString('en-US')} />
    </Stack>
  );
};

const TransactionDatagrid = () => (
  <Datagrid bulkActionButtons={false}>
    <ReferenceField source="user_id" reference="profiles" label="User" link={false}>
      <TextField source="full_name" />
    </ReferenceField>
    <FunctionField
      label="Type"
      render={(r: any) => (
        <span style={{ textTransform: 'capitalize' }}>{String(r.type ?? '').replace(/_/g, ' ')}</span>
      )}
    />
    <FunctionField
      label="Amount"
      sortBy="amount"
      render={(r: any) => (
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ color: Number(r.amount) < 0 ? Colors.error[700] : Colors.success[700] }}
        >
          {formatXaf(r.amount)}
        </Typography>
      )}
    />
    <FunctionField label="Status" render={() => <StatusChip source="status" />} />
    <TextField source="reference" />
    <DateField source="created_at" showTime />
  </Datagrid>
);

export const TransactionList = () => (
  <List
    sort={{ field: 'created_at', order: 'DESC' }}
    filters={<TransactionFilter />}
    sx={{ '& .RaList-content': { boxShadow: 'none' } }}
  >
    <ResponsiveList desktop={<TransactionDatagrid />} card={<TransactionCard />} rowClick={false} />
  </List>
);
