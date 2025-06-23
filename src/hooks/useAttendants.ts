import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Attendant {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'attendant';
  sector_id: string | null;
  is_active: boolean;
  managed_by: string | null;
  can_transfer: boolean;
  max_concurrent_chats: number;
  created_at: string;
  updated_at: string;
  setup_completed: boolean | null;
  whatsapp_connected: boolean | null;
  instance_name: string | null;
  // Dados relacionados
  sector?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface CreateAttendantData {
  name: string;
  email: string;
  phone: string;
  password: string;
  sector_id: string | null;
  can_transfer?: boolean;
  max_concurrent_chats?: number;
}

export const useAttendants = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todos os atendentes
  const { data: attendants = [], isLoading, error } = useQuery({
    queryKey: ['attendants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          sector:sectors(id, name, color)
        `)
        .eq('role', 'attendant')
        .order('name');
      
      if (error) throw error;
      return data.map(item => ({
        ...item,
        can_transfer: true, // Default value since column may not exist yet
        max_concurrent_chats: 10, // Default value since column may not exist yet
        sector: item.sector ? {
          id: item.sector.id,
          name: item.sector.name,
          color: item.sector.color,
        } : undefined,
      })) as Attendant[];
    },
    enabled: profile?.role === 'admin',
  });

  // Buscar atendentes ativos
  const { data: activeAttendants = [] } = useQuery({
    queryKey: ['attendants', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          sector:sectors(id, name, color)
        `)
        .eq('role', 'attendant')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data.map(item => ({
        ...item,
        can_transfer: true, // Default value since column may not exist yet
        max_concurrent_chats: 10, // Default value since column may not exist yet
        sector: item.sector ? {
          id: item.sector.id,
          name: item.sector.name,
          color: item.sector.color,
        } : undefined,
      })) as Attendant[];
    },
    enabled: profile?.role === 'admin',
  });

  // Criar atendente
  const createAttendantMutation = useMutation({
    mutationFn: async (attendantData: CreateAttendantData) => {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: attendantData.email,
        password: attendantData.password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // 2. Criar perfil
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          name: attendantData.name,
          email: attendantData.email,
          phone: attendantData.phone,
          role: 'attendant',
          sector_id: attendantData.sector_id,
          managed_by: profile?.id,
          can_transfer: attendantData.can_transfer ?? true,
          max_concurrent_chats: attendantData.max_concurrent_chats ?? 10,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
      toast.success('Atendente criado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao criar atendente:', error);
      toast.error(`Erro ao criar atendente: ${error.message || 'Erro desconhecido'}`);
    },
  });

  // Atualizar atendente
  const updateAttendantMutation = useMutation({
    mutationFn: async ({ 
      id, 
      ...attendantData 
    }: { 
      id: string 
    } & Partial<Pick<Attendant, 'name' | 'phone' | 'sector_id' | 'can_transfer' | 'max_concurrent_chats' | 'is_active'>>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...attendantData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
      toast.success('Atendente atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar atendente: ${error.message}`);
    },
  });

  // Desativar/Ativar atendente
  const toggleAttendantMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
      toast.success(`Atendente ${is_active ? 'ativado' : 'desativado'} com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao alterar status do atendente: ${error.message}`);
    },
  });

  // Atribuir setor ao atendente
  const assignSectorMutation = useMutation({
    mutationFn: async ({ attendantId, sectorId }: { attendantId: string; sectorId: string | null }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          sector_id: sectorId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attendantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
      toast.success('Setor atribuído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atribuir setor: ${error.message}`);
    },
  });

  return {
    attendants,
    activeAttendants,
    isLoading,
    error,
    createAttendant: createAttendantMutation.mutate,
    updateAttendant: updateAttendantMutation.mutate,
    toggleAttendant: toggleAttendantMutation.mutate,
    assignSector: assignSectorMutation.mutate,
    isCreating: createAttendantMutation.isPending,
    isUpdating: updateAttendantMutation.isPending,
    isToggling: toggleAttendantMutation.isPending,
    isAssigning: assignSectorMutation.isPending,
  };
};
