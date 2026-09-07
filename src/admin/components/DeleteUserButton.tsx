import { useState } from 'react';
import { useRecordContext, useNotify, useRefresh } from 'react-admin';
import {
  IconButton, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, Tooltip, Alert,
} from '@mui/material';
import { Colors } from '@/constants/Colors';
import { Icon } from '@iconify/react';
import { supabase } from '@/lib/supabase';

/**
 * Users can't be deleted through the normal dataProvider path. The panel runs on the
 * anon key, and there is no DELETE policy on profiles for authenticated users, so a
 * direct DELETE matches zero rows and PostgREST still returns 204 — react-admin then
 * reports success while the row is untouched. Deleting the profile alone would also
 * leave the auth account alive, and signing back in recreates the profile via
 * handle_new_user. So this goes through the admin-delete-user edge function, which
 * removes the auth account under the service role.
 */
export const DeleteUserButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [outstanding, setOutstanding] = useState<string | null>(null);

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    setOutstanding(null);
  };

  const runDelete = async (force: boolean) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: record.id, force },
      });

      // A 409 arrives as a FunctionsHttpError, so the useful detail is on the
      // response body rather than error.message.
      const payload = (data ?? {}) as any;

      if (error) {
        let body: any = payload;
        try {
          body = await (error as any).context?.json?.();
        } catch {
          /* fall back to whatever invoke returned */
        }
        if (body?.requiresForce) {
          setOutstanding(body.details || 'This user still has outstanding funds.');
          return;
        }
        notify(body?.error || error.message || 'Failed to delete user', { type: 'error' });
        return;
      }

      if (payload?.requiresForce) {
        setOutstanding(payload.details || 'This user still has outstanding funds.');
        return;
      }

      notify(`Deleted ${payload?.deleted?.email || 'user'}`, { type: 'success' });
      setOpen(false);
      setOutstanding(null);
      refresh();
    } catch (e: any) {
      notify(e?.message || 'Failed to delete user', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <>
      <Tooltip title="Delete user">
        <IconButton
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          size="small"
          sx={{
            color: Colors.error[600],
            '&:hover': { backgroundColor: Colors.error[50] },
          }}
        >
          <Icon icon="lucide:trash-2" width={18} />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} onClick={(e) => e.stopPropagation()}>
        <DialogTitle sx={{ color: Colors.error[700], fontWeight: 600 }}>
          Delete user
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Permanently delete <strong>{record.full_name || record.email}</strong>? This
            removes their login, profile, messages, reviews and notifications, and
            archives their listings. Payments and withdrawal history are kept for
            accounting, with the user detached. This cannot be undone.
          </DialogContentText>
          {outstanding && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {outstanding}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ color: Colors.neutral[700], '&:hover': { backgroundColor: Colors.neutral[100] } }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => runDelete(Boolean(outstanding))}
            disabled={loading}
            variant="contained"
            sx={{
              backgroundColor: Colors.error[600],
              '&:hover': { backgroundColor: Colors.error[700] },
            }}
            autoFocus
          >
            {loading
              ? 'Deleting...'
              : outstanding
                ? 'Delete anyway'
                : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
