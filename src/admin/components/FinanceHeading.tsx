import { useListContext } from 'react-admin';

export const FinanceHeading = ({ title, description }: { title: string; description: string }) => {
  const { total, isPending } = useListContext();
  return <header className="finance-heading"><div><h2>{title}</h2><p>{description}</p></div><span>{isPending ? 'Loading…' : typeof total === 'number' ? `${total.toLocaleString()} matching records` : ''}</span></header>;
};
