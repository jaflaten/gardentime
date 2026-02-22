'use client';

import { ZoneType } from '@/lib/api';
import { Modal, Button, Input, Select, FormField } from '@/components/ui';

interface EditGrowAreaFormData {
  name: string;
  zoneSize: string;
  zoneType: ZoneType | '';
  nrOfRows: string;
  notes: string;
}

interface EditGrowAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: EditGrowAreaFormData;
  setFormData: (data: EditGrowAreaFormData) => void;
}

export function EditGrowAreaModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData 
}: EditGrowAreaModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Grow Area" size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Name">
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </FormField>

        <FormField label="Zone Size">
          <Input
            type="text"
            value={formData.zoneSize}
            onChange={(e) => setFormData({ ...formData, zoneSize: e.target.value })}
            placeholder="Enter zone size"
          />
        </FormField>

        <FormField label="Zone Type">
          <Select
            value={formData.zoneType}
            onChange={(e) => setFormData({ ...formData, zoneType: e.target.value as ZoneType })}
          >
            <option value="">Select zone type</option>
            <option value="BOX">Box</option>
            <option value="FIELD">Field</option>
            <option value="BED">Bed</option>
            <option value="BUCKET">Bucket</option>
          </Select>
        </FormField>

        <FormField label="Number of Rows">
          <Input
            type="number"
            value={formData.nrOfRows}
            onChange={(e) => setFormData({ ...formData, nrOfRows: e.target.value })}
            placeholder="Enter number of rows"
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

        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Update Grow Area
          </Button>
        </div>
      </form>
    </Modal>
  );
}
