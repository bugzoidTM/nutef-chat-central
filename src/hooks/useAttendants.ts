
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
  sector_id?: string | null;
  can_transfer?: boolean;
  max_concurrent_chats?: number;
}

export const useAttendants = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todos os atendentes
  const { data: attendants = [], isLoading, error, refetch } = useQuery({
    queryKey: ['attendants'],
    queryFn: async () => {
      console.log('🔍 Buscando atendentes...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          sectors!profiles_sector_id_fkey (
            id,
            name,
            color
          )
        `)
        .eq('role', 'attendant')
        .order('name');
      
      if (error) {
        console.error('❌ Erro ao buscar atendentes:', error);
        throw error;
      }
      
      console.log('✅ Atendentes encontrados:', {
        total: data?.length || 0,
        data: data
      });
      
      // Mapear os dados corretamente
      const mappedData = data?.map(item => ({
        ...item,
        can_transfer: item.can_transfer ?? true,
        max_concurrent_chats: item.max_concurrent_chats ?? 10,
        sector: item.sectors ? {
          id: item.sectors.id,
          name: item.sectors.name,
          color: item.sectors.color,
        } : undefined,
      })) as Attendant[];
      
      console.log('🔄 Dados mapeados:', mappedData);
      
      return mappedData;
    },
    enabled: profile?.role === 'admin',
    refetchOnWindowFocus: true,
    staleTime: 0, // Sempre buscar dados frescos
  });

  // Buscar atendentes ativos
  const { data: activeAttendants = [] } = useQuery({
    queryKey: ['attendants', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          sectors!profiles_sector_id_fkey (
            id,
            name,
            color
          )
        `)
        .eq('role', 'attendant')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data?.map(item => ({
        ...item,
        can_transfer: item.can_transfer ?? true,
        max_concurrent_chats: item.max_concurrent_chats ?? 10,
        sector: item.sectors ? {
          id: item.sectors.id,
          name: item.sectors.name,
          color: item.sectors.color,
        } : undefined,
      })) as Attendant[];
    },
    enabled: profile?.role === 'admin',
  });

  // Criar atendente usando Edge Function
  const createAttendantMutation = useMutation({
    mutationFn: async (attendantData: CreateAttendantData) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Não autenticado');
      }

      // Se não especificado setor, buscar o setor "Suporte" por padrão
      let finalAttendantData = { ...attendantData };
      if (!attendantData.sector_id) {
        const { data: supportSector } = await supabase
          .from('sectors')
          .select('id')
          .eq('name', 'Suporte')
          .single();
        
        if (supportSector) {
          finalAttendantData.sector_id = supportSector.id;
          console.log('🎯 Atribuindo setor Suporte automaticamente:', supportSector.id);
        }
      }

      const response = await fetch(`/api/fn/create-attendant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(finalAttendantData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erro ${response.status}`);
      }

      return result;
    },
    onSuccess: () => {
      // Invalidar múltiplas queries para garantir atualização
      queryClient.invalidateQueries({ queryKey: ['attendants'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      // Forçar refetch imediato
      refetch();
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
    refetch, // Expor refetch para uso manual se necessário
  };
};
