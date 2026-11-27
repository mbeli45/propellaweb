import { useRecordContext } from 'react-admin';

// One money format for the whole admin: "120,000 XAF".
export const formatXaf = (value: unknown, signed = false) => {
  const num = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(num)) return '—';
  const sign = signed && num > 0 ? '+' : num < 0 ? '−' : '';
  return `${sign}${Math.round(Math.abs(num)).toLocaleString('en-US')} XAF`;
};

// Drop-in for <NumberField options={{style:'currency',currency:'XAF'}} /> in lists and cards.
export const MoneyField = ({ source }: { source: string; label?: string; sortable?: boolean }) => {
  const record = useRecordContext<any>();
  return <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatXaf(record?.[source])}</span>;
};
