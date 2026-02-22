'use client';

import { CropRecord } from '@/lib/api';
import { Modal, Button } from '@/components/ui';

interface DeleteCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedRecord: CropRecord | null;
}

export function DeleteCropModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedRecord 
}: DeleteCropModalProps) {
  if (!selectedRecord) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Crop Record" size="lg">
      <p className="text-gray-700 mb-4">
        Are you sure you want to delete the crop record for {selectedRecord.plantName || `Plant #${selectedRecord.plantId}`}?
      </p>
      <div className="flex justify-end gap-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm}>
          Delete Crop Record
        </Button>
      </div>
    </Modal>
  );
}
