// Title and one-line explanation above a finance table. The result count lives in the table itself.
export const FinanceHeading = ({ title, description }: { title: string; description: string }) => (
  <header className="finance-heading"><div><h2>{title}</h2><p>{description}</p></div></header>
);
