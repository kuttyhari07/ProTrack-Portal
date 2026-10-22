import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-red-100 dark:bg-red-950/60 p-3 text-red-600 dark:text-red-400 shrink-0">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-semibold text-[#172033] dark:text-[#F3F4F6]">
            {title}
          </h4>
          <p className="mt-1.5 text-sm text-[#667085] dark:text-[#9CA3AF]">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
