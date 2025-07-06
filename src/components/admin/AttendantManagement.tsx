
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, UserPlus, Edit, Trash2, Mail, Phone, Shield } from 'lucide-react';

interface NewAttendant {
  name: string;
  email: string;
  phone: string;
  nickname: string;
  sector_id: string;
  can_transfer: boolean;
  max_concurrent_chats: number;
}

const AttendantManagement = () => {
  const [isAddingAttendant, setIsAddingAttendant] = useState(false);
  const [newAttendant, setNewAttendant] = useState<NewAttendant>({
    name: '',
    email: '',
    phone: '',
    nickname: '',
    sector_id: '',
    can_transfer: true,
    max_concurrent_chats: 10,
  });

  const queryClient = useQueryClient();

  // Fetch attendants
  const { data: attendants = [], isLoading } = useQuery({
    queryKey: ['attendants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          sectors:sector_id (
            id,
            name,
            color
          )
        `)
        .eq('role', 'attendant')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch sectors for dropdown
  const { data: sectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('id, name, color')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Create attendant mutation
  const createAttendantMutation = useMutation({
    mutationFn: async (attendantData: NewAttendant) => {
      // First create auth user (this would need to be handled differently in production)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: attendantData.email,
        password: 'temp123456', // Temporary password - should be changed on first login
        email_confirm: true,
        user_metadata: {
          name: attendantData.name,
        }
      });

      if (authError) throw authError;

      // Then create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          name: attendantData.name,
          email: attendantData.email,
          phone: attendantData.phone,
          nickname: attendantData.nickname,
          role: 'attendant',
          sector_id: attendantData.sector_id,
          can_transfer: attendantData.can_transfer,
          max_concurrent_chats: attendantData.max_concurrent_chats,
          is_active: true,
        });

      if (profileError) throw profileError;

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Atendente criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
      setIsAddingAttendant(false);
      setNewAttendant({
        name: '',
        email: '',
        phone: '',
        nickname: '',
        sector_id: '',
        can_transfer: true,
        max_concurrent_chats: 10,
      });
    },
    onError: (error: any) => {
      console.error('Error creating attendant:', error);
      toast.error('Erro ao criar atendente: ' + error.message);
    },
  });

  // Toggle attendant status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
      toast.success('Status do atendente atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const handleCreateAttendant = () => {
    if (!newAttendant.name || !newAttendant.email || !newAttendant.phone || !newAttendant.sector_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    createAttendantMutation.mutate(newAttendant);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Atendentes</h2>
          <p className="text-gray-600">Gerencie os atendentes do sistema</p>
        </div>
        <Dialog open={isAddingAttendant} onOpenChange={setIsAddingAttendant}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Atendente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Atendente</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo atendente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newAttendant.name}
                  onChange={(e) => setNewAttendant(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do atendente"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nickname">Apelido</Label>
                <Input
                  id="nickname"
                  value={newAttendant.nickname}
                  onChange={(e) => setNewAttendant(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="Como aparecerá nas mensagens"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAttendant.email}
                  onChange={(e) => setNewAttendant(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={newAttendant.phone}
                  onChange={(e) => setNewAttendant(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Setor *</Label>
                <Select value={newAttendant.sector_id} onValueChange={(value) => setNewAttendant(prev => ({ ...prev, sector_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                          {sector.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxChats">Máximo de Conversas Simultâneas</Label>
                <Input
                  id="maxChats"
                  type="number"
                  min="1"
                  max="50"
                  value={newAttendant.max_concurrent_chats}
                  onChange={(e) => setNewAttendant(prev => ({ ...prev, max_concurrent_chats: parseInt(e.target.value) || 10 }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="canTransfer"
                  checked={newAttendant.can_transfer}
                  onCheckedChange={(checked) => setNewAttendant(prev => ({ ...prev, can_transfer: checked }))}
                />
                <Label htmlFor="canTransfer">Pode transferir conversas</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddingAttendant(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateAttendant} 
                  disabled={createAttendantMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {createAttendantMutation.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Attendants List */}
      <div className="grid gap-4">
        {attendants.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum atendente cadastrado</h3>
                <p className="text-gray-500 mb-4">Comece criando seu primeiro atendente</p>
                <Button onClick={() => setIsAddingAttendant(true)} className="bg-green-600 hover:bg-green-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Primeiro Atendente
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          attendants.map((attendant) => (
            <Card key={attendant.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{attendant.name}</CardTitle>
                      {attendant.nickname && (
                        <CardDescription>Apelido: {attendant.nickname}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={attendant.is_active ? 'default' : 'secondary'}>
                      {attendant.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Switch
                      checked={attendant.is_active}
                      onCheckedChange={() => toggleStatusMutation.mutate({
                        id: attendant.id,
                        isActive: attendant.is_active
                      })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{attendant.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{attendant.phone}</span>
                  </div>
                </div>
                
                {attendant.sectors && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: attendant.sectors.color }} />
                    <span className="text-sm">{attendant.sectors.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Max. conversas: {attendant.max_concurrent_chats}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {attendant.can_transfer ? 'Pode transferir' : 'Não pode transferir'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AttendantManagement;
