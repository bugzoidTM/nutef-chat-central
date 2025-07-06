
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AttendantForm } from './AttendantForm';
import type { Attendant } from '@/hooks/useAttendants';
import type { Sector } from '@/hooks/useSectors';

interface AttendantFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  sector_id: string | null;
  can_transfer: boolean;
  max_concurrent_chats: number;
}

interface AttendantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingAttendant: Attendant | null;
  formData: AttendantFormData;
  setFormData: (data: AttendantFormData) => void;
  activeSectors: Sector[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isCreating: boolean;
  isUpdating: boolean;
}

export const AttendantDialog: React.FC<AttendantDialogProps> = ({
  isOpen,
  onOpenChange,
  editingAttendant,
  formData,
  setFormData,
  activeSectors,
  onSubmit,
  onCancel,
  isCreating,
  isUpdating,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {editingAttendant ? 'Editar Atendente' : 'Criar Novo Atendente'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {editingAttendant 
              ? 'Faça alterações nos dados do atendente'
              : 'Adicione um novo atendente à sua equipe de suporte'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <AttendantForm
            formData={formData}
            setFormData={setFormData}
            editingAttendant={editingAttendant}
            activeSectors={activeSectors}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isCreating={isCreating}
            isUpdating={isUpdating}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
