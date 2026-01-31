import { Toolbar, SaveButton, Button } from 'react-admin';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { Colors } from '@/constants/Colors';

export const EditToolbar = () => {
  const navigate = useNavigate();

  return (
    <Toolbar sx={{ justifyContent: 'space-between', padding: '16px !important' }}>
      <SaveButton />
      <Button
        label="Cancel"
        onClick={() => navigate(-1)}
        sx={{
          backgroundColor: Colors.neutral[100],
          color: Colors.neutral[700],
          '&:hover': {
            backgroundColor: Colors.neutral[200],
          },
        }}
      />
    </Toolbar>
  );
};
