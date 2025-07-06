
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
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

interface AttendantFormProps {
  formData: AttendantFormData;
  setFormData: (data: AttendantFormData) => void;
  editingAttendant: Attendant | null;
  activeSectors: Sector[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isCreating: boolean;
  isUpdating: boolean;
}

export const AttendantForm: React.FC<AttendantFormProps> = ({
  formData,
  setFormData,
  editingAttendant,
  activeSectors,
  onSubmit,
  onCancel,
  isCreating,
  isUpdating,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {!editingAttendant && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Uma senha temporária será criada. O atendente deve alterá-la no primeiro acesso.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Nome Completo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Digite o nome completo"
            required
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">E-mail *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
            required
            disabled={!!editingAttendant}
            className="h-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">Telefone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(11) 99999-9999"
            required
            className="h-10"
          />
        </div>

        {!editingAttendant && (
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Senha Inicial *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              className="h-10"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sector" className="text-sm font-medium">Setor</Label>
        <Select 
          value={formData.sector_id || 'none'} 
          onValueChange={(value) => setFormData({ ...formData, sector_id: value === 'none' ? null : value })}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Selecione um setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum setor</SelectItem>
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
        <div className="space-y-2">
          <Label htmlFor="max_chats" className="text-sm font-medium">Limite de Chats Simultâneos</Label>
          <Input
            id="max_chats"
            type="number"
            min="1"
            max="50"
            value={formData.max_concurrent_chats}
            onChange={(e) => setFormData({ ...formData, max_concurrent_chats: parseInt(e.target.value) || 10 })}
            className="h-10"
          />
        </div>

        <div className="flex items-center space-x-2 mt-6">
          <Switch
            id="can_transfer"
            checked={formData.can_transfer}
            onCheckedChange={(checked) => setFormData({ ...formData, can_transfer: checked })}
          />
          <Label htmlFor="can_transfer" className="text-sm font-medium">Pode transferir conversas</Label>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-6"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isCreating || isUpdating}
          className="px-6 bg-green-600 hover:bg-green-700"
        >
          {isCreating || isUpdating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {editingAttendant ? 'Atualizando...' : 'Criando...'}
            </div>
          ) : (
            editingAttendant ? 'Atualizar Atendente' : 'Criar Atendente'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};
