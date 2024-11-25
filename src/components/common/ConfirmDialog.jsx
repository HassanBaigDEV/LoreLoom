import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

export default function ConfirmDialog({
  open,
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        className: 'rounded-lg',
      }}
    >
      <DialogTitle className="text-gray-800">
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" className="text-gray-600">
          {content}
        </Typography>
      </DialogContent>
      <DialogActions className="p-4">
        <Button
          onClick={onCancel}
          variant="outlined"
          className="text-gray-600"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          className={isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 