import React, { useState } from 'react';
import { useSectors, type Sector } from '@/hooks/useSectors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit3, Palette, Users, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SectorFormData {
  name: string;
  description: string;
  color: string;
  is_active: boolean;
}

const SectorManagement = () => {
  const { sectors, createSector, updateSector, toggleSector, isCreating, isUpdating } = useSectors();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [formData, setFormData] = useState<SectorFormData>({
    name: '',
    description: '',
    color: '#6B7280',
    is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSector) {
      updateSector({
        id: editingSector.id,
        ...formData,
      });
      setIsEditDialogOpen(false);
    } else {
      createSector(formData);
      setIsCreateDialogOpen(false);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#6B7280',
      is_active: true,
    });
    setEditingSector(null);
  };

  const handleEdit = (sector: Sector) => {
    setEditingSector(sector);
    setFormData({
      name: sector.name,
      description: sector.description || '',
      color: sector.color,
      is_active: sector.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleToggle = (sector: Sector) => {
    toggleSector({
      id: sector.id,
      is_active: !sector.is_active,
    });
  };

  const colorOptions = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Amarelo', value: '#F59E0B' },
    { name: 'Vermelho', value: '#EF4444' },
    { name: 'Roxo', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Cinza', value: '#6B7280' },
    { name: 'Laranja', value: '#F97316' },
  ];

  const SectorForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome do Setor</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Suporte Técnico"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição do setor..."
          rows={3}
        />
      </div>

      <div className="grid gap-2">
        <Label>Cor do Setor</Label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: color.value })}
              className={`w-8 h-8 rounded-full border-2 ${
                formData.color === color.value ? 'border-gray-800' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: formData.color }}
          />
          <span className="text-sm text-gray-600">Cor selecionada: {formData.color}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Setor ativo</Label>
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
          {editingSector ? 'Atualizar' : 'Criar'} Setor
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Setores</h2>
          <p className="text-gray-600">Crie e gerencie os setores do seu sistema de atendimento</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Setor</DialogTitle>
              <DialogDescription>
                Crie um novo setor para organizar seus atendentes
              </DialogDescription>
            </DialogHeader>
            <SectorForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <Card key={sector.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: sector.color }}
                  />
                  <CardTitle className="text-lg">{sector.name}</CardTitle>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(sector)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggle(sector)}>
                      <Users className="h-4 w-4 mr-2" />
                      {sector.is_active ? 'Desativar' : 'Ativar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={sector.is_active ? 'default' : 'secondary'}>
                  {sector.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <CardDescription className="text-sm">
                {sector.description || 'Sem descrição'}
              </CardDescription>
              <div className="mt-3 text-xs text-gray-500">
                Criado em {new Date(sector.created_at).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sectors.length === 0 && (
        <div className="text-center py-12">
          <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum setor criado</h3>
          <p className="text-gray-600 mb-4">Comece criando seu primeiro setor de atendimento</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Setor
          </Button>
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Setor</DialogTitle>
            <DialogDescription>
              Faça alterações no setor selecionado
            </DialogDescription>
          </DialogHeader>
          <SectorForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectorManagement; 