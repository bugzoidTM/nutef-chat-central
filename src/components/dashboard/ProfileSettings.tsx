
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';

const ProfileSettings = () => {
  const { profile, refetchProfile } = useAuth();
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSaveNickname = async () => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: nickname.trim() || null })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Apelido atualizado com sucesso!');
      await refetchProfile();
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar apelido:', error);
      toast.error('Erro ao atualizar apelido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start px-3 h-9">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações do Perfil</DialogTitle>
          <DialogDescription>
            Configure como você aparece nas conversas
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={profile?.name || ''}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">
              Nome completo não pode ser alterado
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nickname">Apelido (opcional)</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Como você quer aparecer nas mensagens"
              maxLength={50}
            />
            <p className="text-xs text-gray-500">
              Se não definir, será usado seu nome completo
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNickname} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettings;
