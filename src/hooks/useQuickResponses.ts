
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { QuickResponse, QuickResponseCategory, CreateQuickResponseData, UpdateQuickResponseData } from '@/types/quickResponses';

export const useQuickResponses = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quick responses
  const { data: quickResponses = [], isLoading } = useQuery({
    queryKey: ['quick-responses'],
    queryFn: async () => {
      console.log('📋 Fetching quick responses...');
      
      const { data, error } = await supabase
        .from('quick_responses')
        .select(`
          *,
          category:quick_response_categories(*)
        `)
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('❌ Error fetching quick responses:', error);
        throw error;
      }

      console.log('✅ Quick responses fetched:', data?.length || 0);
      return data as QuickResponse[];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['quick-response-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_response_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as QuickResponseCategory[];
    },
  });

  // Create quick response
  const createQuickResponse = useMutation({
    mutationFn: async (responseData: CreateQuickResponseData) => {
      const { data, error } = await supabase
        .from('quick_responses')
        .insert({
          ...responseData,
          sector_id: responseData.sector_id || profile?.sector_id,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-responses'] });
      toast({
        title: "Resposta rápida criada",
        description: "A resposta foi adicionada à biblioteca.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar resposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update quick response
  const updateQuickResponse = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateQuickResponseData }) => {
      const { error } = await supabase
        .from('quick_responses')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-responses'] });
      toast({
        title: "Resposta atualizada",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar resposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete quick response
  const deleteQuickResponse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quick_responses')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-responses'] });
      toast({
        title: "Resposta removida",
        description: "A resposta foi removida da biblioteca.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover resposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Use quick response (increment usage count)
  const useQuickResponse = useMutation({
    mutationFn: async (responseId: string) => {
      const { error } = await supabase.rpc('increment_quick_response_usage', {
        response_id: responseId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-responses'] });
    },
  });

  return {
    quickResponses,
    categories,
    isLoading,
    createQuickResponse,
    updateQuickResponse,
    deleteQuickResponse,
    useQuickResponse,
  };
};
