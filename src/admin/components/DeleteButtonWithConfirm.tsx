import { useState } from 'react';
import { useDelete, useRecordContext, useNotify, useRedirect, useResourceContext } from 'react-admin';
import { IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Tooltip } from '@mui/material';
import { Colors } from '@/constants/Colors';
import { Icon } from '@iconify/react';

export const DeleteButtonWithConfirm = (props: any) => {
  const [open, setOpen] = useState(false);
  const record = useRecordContext();
  const resource = useResourceContext();
  const [deleteOne, { isLoading }] = useDelete();
  const notify = useNotify();
  const redirect = useRedirect();

  const handleClickOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = async () => {
    try {
      await deleteOne(
        resource || props.resource,
        { id: record.id, previousData: record },
        {
          onSuccess: () => {
            notify('Element deleted successfully', { type: 'success' });
            redirect('list', resource || props.resource);
          },
          onError: (error: any) => {
            notify(error?.message || 'Error deleting element', { type: 'error' });
          },
        }
      );
      setOpen(false);
    } catch (error: any) {
      notify(error?.message || 'Error deleting element', { type: 'error' });
    }
  };

  return (
    <>
      <Tooltip title="Delete">
        <IconButton
          onClick={handleClickOpen}
          size="small"
          sx={{
            color: Colors.error[600],
            '&:hover': {
              backgroundColor: Colors.error[50],
            },
          }}
        >
          <Icon icon="lucide:trash-2" width={18} />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ color: Colors.error[700], fontWeight: 600 }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            onClick={handleClose}
            sx={{
              color: Colors.neutral[700],
              '&:hover': {
                backgroundColor: Colors.neutral[100],
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant="contained"
            sx={{
              backgroundColor: Colors.error[600],
              '&:hover': {
                backgroundColor: Colors.error[700],
              },
            }}
            autoFocus
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
