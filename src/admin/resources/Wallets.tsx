import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  ReferenceField,
  FunctionField,
} from 'react-admin';
import { Stack, Typography, Divider } from '@mui/material';
import { Colors } from '@/constants/Colors';
import {
  ResponsiveList,
  CardHeader,
  CardRow,
  IconAvatar,
  useRecord,
} from '../components/MobileListCard';

const formatXaf = (n: number | string | null | undefined) => {
  const num = Number(n ?? 0);
  return `${Math.round(num).toLocaleString('en-US')} XAF`;
};

const WalletCard = () => {
  const r = useRecord<any>();
  if (!r) return null;
  const balance = Number(r.balance ?? 0);
  const isPlatform = r.user_id === '00000000-0000-0000-0000-000000000000';
  return (
    <Stack spacing={1.5}>
      <CardHeader
        avatar={<IconAvatar icon={isPlatform ? 'lucide:building' : 'lucide:wallet'} tone={balance < 0 ? 'error' : 'primary'} />}
        title={
          isPlatform ? 'Propella platform' : (
            <ReferenceField source="user_id" reference="profiles" link={false}>
              <TextField source="full_name" />
            </ReferenceField>
          )
        }
        subtitle={`Updated ${new Date(r.updated_at).toLocaleDateString('en-US')}`}
        right={
          <Typography
            variant="subtitle2"
            fontWeight={800}
            sx={{ color: balance < 0 ? Colors.error[700] : Colors.success[700] }}
          >
            {formatXaf(balance)}
          </Typography>
        }
      />
      {(r.locked_balance || r.total_earned || r.total_withdrawn) && <Divider />}
      {r.locked_balance != null && Number(r.locked_balance) > 0 && (
        <CardRow label="Locked" value={formatXaf(r.locked_balance)} />
      )}
      {r.total_earned != null && (
        <CardRow label="Total earned" value={formatXaf(r.total_earned)} />
      )}
      {r.total_withdrawn != null && (
        <CardRow label="Total withdrawn" value={formatXaf(r.total_withdrawn)} />
      )}
    </Stack>
  );
};

const WalletDatagrid = () => (
  <Datagrid bulkActionButtons={false}>
    <ReferenceField source="user_id" reference="profiles" label="User" link={false}>
      <TextField source="full_name" />
    </ReferenceField>
    <FunctionField
      label="Balance"
      sortBy="balance"
      render={(r: any) => (
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ color: Number(r.balance ?? 0) < 0 ? Colors.error[700] : Colors.success[700] }}
        >
          {formatXaf(r.balance)}
        </Typography>
      )}
    />
    <NumberField source="locked_balance" options={{ style: 'currency', currency: 'XAF' }} />
    <NumberField source="total_earned" options={{ style: 'currency', currency: 'XAF' }} />
    <NumberField source="total_withdrawn" options={{ style: 'currency', currency: 'XAF' }} />
    <DateField source="updated_at" showTime />
  </Datagrid>
);

export const WalletList = () => (
  <List
    sort={{ field: 'updated_at', order: 'DESC' }}
    sx={{ '& .RaList-content': { boxShadow: 'none' } }}
  >
    <ResponsiveList desktop={<WalletDatagrid />} card={<WalletCard />} rowClick={false} />
  </List>
);
