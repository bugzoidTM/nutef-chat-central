import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Sector {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useSectors = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todos os setores
  const { data: sectors = [], isLoading, error } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Sector[];
    },
  });

  // Buscar apenas setores ativos
  const { data: activeSectors = [] } = useQuery({
    queryKey: ['sectors', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Sector[];
    },
  });

  // Criar setor
  const createSectorMutation = useMutation({
    mutationFn: async (sectorData: Omit<Sector, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data, error } = await supabase
        .from('sectors')
        .insert({
          ...sectorData,
          created_by: profile?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success('Setor criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar setor: ${error.message}`);
    },
  });

  // Atualizar setor
  const updateSectorMutation = useMutation({
    mutationFn: async ({ id, ...sectorData }: { id: string } & Partial<Omit<Sector, 'id' | 'created_at' | 'updated_at' | 'created_by'>>) => {
      const { data, error } = await supabase
        .from('sectors')
        .update({
          ...sectorData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success('Setor atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar setor: ${error.message}`);
    },
  });

  // Desativar/Ativar setor
  const toggleSectorMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('sectors')
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
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
      toast.success(`Setor ${is_active ? 'ativado' : 'desativado'} com sucesso!`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao alterar status do setor: ${error.message}`);
    },
  });

  return {
    sectors,
    activeSectors,
    isLoading,
    error,
    createSector: createSectorMutation.mutate,
    updateSector: updateSectorMutation.mutate,
    toggleSector: toggleSectorMutation.mutate,
    isCreating: createSectorMutation.isPending,
    isUpdating: updateSectorMutation.isPending,
    isToggling: toggleSectorMutation.isPending,
  };
}; 