
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import { useQuickResponses } from '@/hooks/useQuickResponses';
import { useSectors } from '@/hooks/useSectors';
import type { CreateQuickResponseData, UpdateQuickResponseData } from '@/types/quickResponses';

const QuickResponseManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<string | null>(null);
  
  const { 
    quickResponses, 
    categories, 
    isLoading,
    createQuickResponse,
    updateQuickResponse,
    deleteQuickResponse
  } = useQuickResponses();
  
  const { sectors } = useSectors();

  const [formData, setFormData] = useState<CreateQuickResponseData>({
    title: '',
    content: '',
    category_id: '',
    sector_id: '',
  });

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    createQuickResponse.mutate({
      ...formData,
      category_id: formData.category_id || undefined,
      sector_id: formData.sector_id || undefined,
    });
    
    setFormData({ title: '', content: '', category_id: '', sector_id: '' });
    setIsCreateOpen(false);
  };

  const handleUpdate = (id: string, data: UpdateQuickResponseData) => {
    updateQuickResponse.mutate({ id, data });
    setEditingResponse(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta resposta rápida?')) {
      deleteQuickResponse.mutate(id);
    }
  };

  const getSectorName = (sectorId: string | null) => {
    if (!sectorId) return 'Global';
    const sector = sectors.find(s => s.id === sectorId);
    return sector?.name || 'Setor desconhecido';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Respostas Rápidas
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Resposta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Resposta Rápida</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Saudação inicial"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Digite o conteúdo da resposta..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sector">Setor</Label>
                  <Select 
                    value={formData.sector_id} 
                    onValueChange={(value) => setFormData({ ...formData, sector_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Global (todos os setores)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Global (todos os setores)</SelectItem>
                      {sectors.map(sector => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={!formData.title.trim() || !formData.content.trim()}>
                    Criar Resposta
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Carregando respostas...
                </TableCell>
              </TableRow>
            ) : quickResponses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma resposta rápida encontrada
                </TableCell>
              </TableRow>
            ) : (
              quickResponses.map(response => (
                <TableRow key={response.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{response.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {response.content}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {response.category && (
                      <Badge 
                        variant="secondary"
                        style={{
                          backgroundColor: response.category.color + '20',
                          color: response.category.color
                        }}
                      >
                        {response.category.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getSectorName(response.sector_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {response.usage_count}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingResponse(response.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(response.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default QuickResponseManagement;
