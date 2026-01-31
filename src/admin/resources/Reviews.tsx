import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Edit,
  SimpleForm,
  TextInput,
  NumberInput,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  EditButton,
  ShowButton,
  useRecordContext,
} from 'react-admin';
import { useMediaQuery, Theme } from '@mui/material';
import { DeleteButtonWithConfirm } from '../components/DeleteButtonWithConfirm';
import { EditToolbar } from '../components/EditToolbar';

const ReviewTitle = () => {
  const record = useRecordContext();
  return <span>Review #{record?.id?.slice(0, 8)}</span>;
};

export const ReviewList = () => {
  const isSmall = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  return (
    <List
      sort={{ field: 'created_at', order: 'DESC' }}
      sx={{
        '& .RaList-content': {
          boxShadow: 'none',
        },
      }}
    >
      {isSmall ? (
        <Datagrid
          rowClick="edit"
          sx={{
            '& .RaDatagrid-table': {
              minWidth: '700px',
            },
            overflowX: 'auto',
          }}
        >
          <TextField source="id" label="ID" />
          <ReferenceField source="property_id" reference="properties" label="Property">
            <TextField source="title" />
          </ReferenceField>
          <ReferenceField source="user_id" reference="profiles" label="User">
            <TextField source="full_name" />
          </ReferenceField>
          <NumberField source="rating" />
          <TextField source="comment" />
          <DateField source="created_at" showTime />
          <EditButton />
          <ShowButton />
          <DeleteButtonWithConfirm />
        </Datagrid>
      ) : (
        <Datagrid rowClick="edit">
          <TextField source="id" label="ID" />
          <ReferenceField source="property_id" reference="properties" label="Property">
            <TextField source="title" />
          </ReferenceField>
          <ReferenceField source="user_id" reference="profiles" label="User">
            <TextField source="full_name" />
          </ReferenceField>
          <NumberField source="rating" />
          <TextField source="comment" />
          <DateField source="created_at" showTime />
          <EditButton />
          <ShowButton />
          <DeleteButtonWithConfirm />
        </Datagrid>
      )}
    </List>
  );
};

export const ReviewEdit = () => (
  <Edit title={<ReviewTitle />}>
    <SimpleForm toolbar={<EditToolbar />}>
      <ReferenceInput source="property_id" reference="properties" label="Property">
        <SelectInput optionText="title" disabled />
      </ReferenceInput>
      <ReferenceInput source="user_id" reference="profiles" label="User">
        <SelectInput optionText="full_name" disabled />
      </ReferenceInput>
      <NumberInput source="rating" min={1} max={5} />
      <TextInput source="comment" multiline rows={4} fullWidth />
    </SimpleForm>
  </Edit>
);
