import { List, Datagrid, TextField, DateField, NumberField, SelectInput, TextInput } from 'react-admin';

const states = ['pending', 'processing', 'completed', 'skipped', 'failed'].map(id => ({ id, name: id }));
export function PropertyMediaCleanupList() {
  return <List title="Property media cleanup" sort={{ field: 'created_at', order: 'DESC' }}
    actions={false} exporter={false} filters={[
      <SelectInput key="state" source="state" choices={states} alwaysOn />,
      <TextInput key="property" source="property_id" label="Property ID" />,
    ]}>
    <Datagrid bulkActionButtons={false} rowClick={false}>
      <TextField source="property_id" />
      <TextField source="state" />
      <NumberField source="attempts" />
      <DateField source="available_at" showTime label="Next attempt / lease expiry" />
      <DateField source="finished_at" showTime />
      <TextField source="last_error" label="Result / error" />
    </Datagrid>
  </List>;
}
