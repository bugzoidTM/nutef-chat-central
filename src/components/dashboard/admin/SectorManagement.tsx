
import React, { useState } from 'react';
import { useSectors } from '@/hooks/useSectors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const SectorManagement = () => {
  const { sectors, activeSectors, isLoading, createSector, updateSector, toggleSector, isCreating, isUpdating } = useSectors();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSector) {
      updateSector({ id: editingSector.id, ...formData });
      setEditingSector(null);
    } else {
      createSector(formData);
      setIsCreateDialogOpen(false);
    }
    
    setFormData({ name: '', description: '', color: '#3B82F6', is_active: true });
  };

  const handleEdit = (sector: any) => {
    setEditingSector(sector);
    setFormData({
      name: sector.name,
      description: sector.description || '',
      color: sector.color,
      is_active: sector.is_active
    });
  };

  const predefinedColors = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#8B5CF6', // Roxo
    '#F97316', // Laranja
    '#06B6D4', // Ciano
    '#84CC16', // Lima
    '#EC4899', // Rosa
    '#6B7280'  // Cinza
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Carregando setores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Setores</h1>
          <p className="text-gray-600">Configure os setores do seu sistema de atendimento</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Setor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Criar Novo Setor</DialogTitle>
                <DialogDescription>
                  Configure as informações do novo setor de atendimento.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Setor</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Vendas, Suporte..."
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição das responsabilidades do setor"
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Cor do Setor</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: formData.color }}
                    />
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-8 p-1"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Criando...' : 'Criar Setor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Setores */}
      <div className="grid gap-4">
        {sectors.map((sector) => (
          <Card key={sector.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: sector.color }}
                />
                <div>
                  <CardTitle className="text-lg">{sector.name}</CardTitle>
                  {sector.description && (
                    <CardDescription>{sector.description}</CardDescription>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={sector.is_active ? 'default' : 'secondary'}>
                  {sector.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                
                <Dialog open={editingSector?.id === sector.id} onOpenChange={(open) => !open && setEditingSector(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(sector)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                      <DialogHeader>
                        <DialogTitle>Editar Setor</DialogTitle>
                        <DialogDescription>
                          Modifique as informações do setor.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-name">Nome do Setor</Label>
                          <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="edit-description">Descrição</Label>
                          <Textarea
                            id="edit-description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Cor do Setor</Label>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-8 h-8 rounded border border-gray-300"
                              style={{ backgroundColor: formData.color }}
                            />
                            <Input
                              type="color"
                              value={formData.color}
                              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                              className="w-16 h-8 p-1"
                            />
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setFormData({ ...formData, color })}
                                className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={isUpdating}>
                          {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={sector.is_active}
                    onCheckedChange={(checked) => toggleSector({ id: sector.id, is_active: checked })}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Criado em: {new Date(sector.created_at).toLocaleDateString('pt-BR')}</span>
                {sector.updated_at !== sector.created_at && (
                  <span>Atualizado em: {new Date(sector.updated_at).toLocaleDateString('pt-BR')}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {sectors.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <div className="text-gray-500">
                <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhum setor configurado</h3>
                <p className="mb-4">Crie seu primeiro setor para começar a organizar seu atendimento.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Setor
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SectorManagement;
