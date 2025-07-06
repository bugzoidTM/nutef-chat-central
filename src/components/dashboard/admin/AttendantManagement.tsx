import React, { useState, useEffect } from 'react';
import { useAttendants, type Attendant, type CreateAttendantData } from '@/hooks/useAttendants';
import { useSectors } from '@/hooks/useSectors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { AttendantTable } from './attendant/AttendantTable';
import { AttendantDialog } from './attendant/AttendantDialog';
import { AttendantEmptyState } from './attendant/AttendantEmptyState';

interface AttendantFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  sector_id: string | null;
  can_transfer: boolean;
  max_concurrent_chats: number;
}

const AttendantManagement = () => {
  const { attendants, createAttendant, updateAttendant, toggleAttendant, isCreating, isUpdating, refetch } = useAttendants();
  const { activeSectors } = useSectors();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState<Attendant | null>(null);
  const [formData, setFormData] = useState<AttendantFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    sector_id: null,
    can_transfer: true,
    max_concurrent_chats: 10,
  });

  // Log para debug
  useEffect(() => {
    console.log('📊 AttendantManagement - Atendentes carregados:', {
      count: attendants?.length || 0,
      attendants: attendants
    });
  }, [attendants]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      sector_id: null,
      can_transfer: true,
      max_concurrent_chats: 10,
    });
    setEditingAttendant(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Criando atendente com dados:', formData);
    
    if (editingAttendant) {
      const { password, ...updateData } = formData;
      updateAttendant({
        id: editingAttendant.id,
        ...updateData,
      });
      setIsEditDialogOpen(false);
    } else {
      createAttendant(formData);
      setIsCreateDialogOpen(false);
    }
    
    resetForm();
  };

  const handleEdit = (attendant: Attendant) => {
    setEditingAttendant(attendant);
    setFormData({
      name: attendant.name,
      email: attendant.email,
      phone: attendant.phone,
      password: '',
      sector_id: attendant.sector_id,
      can_transfer: attendant.can_transfer,
      max_concurrent_chats: attendant.max_concurrent_chats,
    });
    setIsEditDialogOpen(true);
  };

  const handleToggle = (attendant: Attendant) => {
    toggleAttendant({
      id: attendant.id,
      is_active: !attendant.is_active,
    });
  };

  const handleCancel = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Atendentes</h2>
          <p className="text-gray-600">Gerencie sua equipe de atendimento</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Atendente
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {attendants && attendants.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Atendentes</CardTitle>
            <CardDescription>
              {attendants.length} atendente{attendants.length !== 1 ? 's' : ''} cadastrado{attendants.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendantTable
              attendants={attendants}
              onEdit={handleEdit}
              onToggle={handleToggle}
            />
          </CardContent>
        </Card>
      ) : (
        <AttendantEmptyState />
      )}

      <AttendantDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        editingAttendant={null}
        formData={formData}
        setFormData={setFormData}
        activeSectors={activeSectors}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isCreating={isCreating}
        isUpdating={isUpdating}
      />

      <AttendantDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingAttendant={editingAttendant}
        formData={formData}
        setFormData={setFormData}
        activeSectors={activeSectors}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isCreating={isCreating}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default AttendantManagement;
