'use client';

import { CropRecord, CropStatus } from '@/lib/api';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';
import { CropRecordFormData } from './cropRecordUtils';

interface EditCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedRecord: CropRecord | null;
  formData: CropRecordFormData;
  setFormData: (data: CropRecordFormData) => void;
}

export function EditCropModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedRecord,
  formData, 
  setFormData 
}: EditCropModalProps) {
  if (!selectedRecord) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Crop Record" size="lg">
      <div className="max-h-[70vh] overflow-y-auto">
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Date Planted">
            <Input
              type="date"
              value={formData.datePlanted}
              onChange={(e) => setFormData({ ...formData, datePlanted: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Date Harvested (optional)">
            <Input
              type="date"
              value={formData.dateHarvested}
              onChange={(e) => setFormData({ ...formData, dateHarvested: e.target.value })}
            />
          </FormField>

          <FormField label="Notes">
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
              rows={3}
            />
          </FormField>

          <FormField label="Outcome">
            <Select
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value as CropRecordFormData['outcome'] })}
            >
              <option value="">Select an outcome</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </Select>
          </FormField>

          <FormField label="Status">
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as CropStatus | '' })}
            >
              <option value="">Select a status</option>
              <option value="PLANTED">Planted</option>
              <option value="GROWING">Growing</option>
              <option value="HARVESTED">Harvested</option>
              <option value="DISEASED">Diseased</option>
              <option value="FAILED">Failed</option>
            </Select>
          </FormField>

          <FormField label="Quantity Harvested">
            <Input
              type="number"
              value={formData.quantityHarvested}
              onChange={(e) => setFormData({ ...formData, quantityHarvested: e.target.value })}
              placeholder="Enter quantity"
            />
          </FormField>

          <FormField label="Unit">
            <Input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="Enter unit (e.g., kg, lbs)"
            />
          </FormField>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update Crop Record
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
