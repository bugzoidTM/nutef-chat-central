import React, { useState } from 'react';
import { useAttendants, type Attendant, type CreateAttendantData } from '@/hooks/useAttendants';
import { useSectors } from '@/hooks/useSectors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Edit3, UserCheck, UserX, MoreHorizontal, Users, Phone, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const { attendants, createAttendant, updateAttendant, toggleAttendant, isCreating, isUpdating } = useAttendants();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

  const AttendantForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do atendente"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
            required
            disabled={!!editingAttendant}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(11) 99999-9999"
            required
          />
        </div>

        {!editingAttendant && (
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Senha inicial"
              required
              minLength={6}
            />
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="sector">Setor</Label>
        <Select 
          value={formData.sector_id || ''} 
          onValueChange={(value) => setFormData({ ...formData, sector_id: value || null })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhum setor</SelectItem>
            {activeSectors.map((sector) => (
              <SelectItem key={sector.id} value={sector.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: sector.color }}
                  />
                  {sector.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="max_chats">Limite de Chats Simultâneos</Label>
          <Input
            id="max_chats"
            type="number"
            min="1"
            max="50"
            value={formData.max_concurrent_chats}
            onChange={(e) => setFormData({ ...formData, max_concurrent_chats: parseInt(e.target.value) || 10 })}
          />
        </div>

        <div className="flex items-center space-x-2 mt-6">
          <Switch
            id="can_transfer"
            checked={formData.can_transfer}
            onCheckedChange={(checked) => setFormData({ ...formData, can_transfer: checked })}
          />
          <Label htmlFor="can_transfer">Pode transferir conversas</Label>
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isCreating || isUpdating}>
          {editingAttendant ? 'Atualizar' : 'Criar'} Atendente
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Atendente</DialogTitle>
              <DialogDescription>
                Adicione um novo atendente à sua equipe
              </DialogDescription>
            </DialogHeader>
            <AttendantForm />
          </DialogContent>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atendente</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Limites</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendants.map((attendant) => (
                  <TableRow key={attendant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {attendant.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{attendant.name}</div>
                          <div className="text-sm text-gray-500">{attendant.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {attendant.sector ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: attendant.sector.color }}
                          />
                          <span className="text-sm">{attendant.sector.name}</span>
                        </div>
                      ) : (
                        <Badge variant="outline">Sem setor</Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {attendant.phone}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="h-3 w-3" />
                          {attendant.email}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={attendant.is_active ? 'default' : 'secondary'}>
                        {attendant.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>Max: {attendant.max_concurrent_chats} chats</div>
                        <div className="text-gray-500">
                          {attendant.can_transfer ? 'Pode transferir' : 'Não pode transferir'}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(attendant)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggle(attendant)}>
                            {attendant.is_active ? (
                              <UserX className="h-4 w-4 mr-2" />
                            ) : (
                              <UserCheck className="h-4 w-4 mr-2" />
                            )}
                            {attendant.is_active ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum atendente cadastrado</h3>
          <p className="text-gray-600 mb-4">Comece adicionando seu primeiro atendente à equipe</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Atendente
          </Button>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Atendente</DialogTitle>
            <DialogDescription>
              Faça alterações nos dados do atendente
            </DialogDescription>
          </DialogHeader>
          <AttendantForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendantManagement; 