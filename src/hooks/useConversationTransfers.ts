import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TransferRequest {
  id: string;
  conversation_id: string;
  from_attendant_id: string | null;
  to_attendant_id: string | null;
  from_sector_id: string | null;
  to_sector_id: string | null;
  transferred_by: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  reason: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  // Dados relacionados
  conversation?: {
    client_name: string | null;
    client_phone: string;
  };
  from_attendant_name?: string | null;
  to_attendant_name?: string | null;
  from_sector_name?: string | null;
  to_sector_name?: string | null;
  transferred_by_name?: string | null;
}

export const useConversationTransfers = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Buscar transferências pendentes para o usuário atual
  const { data: pendingTransfers = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pending-transfers', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      console.log('🔄 Buscando transferências pendentes para:', profile.id);

      const { data: transfers, error } = await supabase
        .from('conversation_transfers')
        .select('*')
        .eq('to_attendant_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar transferências pendentes:', error);
        throw error;
      }

      if (!transfers || transfers.length === 0) {
        return [];
      }

      // Buscar dados relacionados
      const conversationIds = transfers.map(t => t.conversation_id).filter(Boolean);
      const attendantIds = [
        ...transfers.map(t => t.from_attendant_id),
        ...transfers.map(t => t.transferred_by)
      ].filter(Boolean);

      // Buscar conversas
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, client_name, client_phone')
        .in('id', conversationIds);

      // Buscar atendentes
      const { data: attendants } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', attendantIds);

      // Enriquecer dados e garantir tipagem correta
      const enrichedTransfers: TransferRequest[] = transfers.map(transfer => {
        const conversation = conversations?.find(c => c.id === transfer.conversation_id);
        const fromAttendant = attendants?.find(a => a.id === transfer.from_attendant_id);
        const transferredBy = attendants?.find(a => a.id === transfer.transferred_by);

        return {
          ...transfer,
          status: transfer.status as 'pending' | 'accepted' | 'rejected' | 'completed',
          conversation: conversation ? {
            client_name: conversation.client_name,
            client_phone: conversation.client_phone
          } : undefined,
          from_attendant_name: fromAttendant?.name || null,
          transferred_by_name: transferredBy?.name || null,
        };
      });

      console.log('✅ Transferências pendentes encontradas:', enrichedTransfers.length);
      return enrichedTransfers;
    },
    enabled: !!profile?.id,
    refetchInterval: 5000, // Verificar a cada 5 segundos
  });

  // Buscar histórico de transferências
  const { data: transferHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['transfer-history', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data: transfers, error } = await supabase
        .from('conversation_transfers')
        .select('*')
        .or(`from_attendant_id.eq.${profile.id},to_attendant_id.eq.${profile.id},transferred_by.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao buscar histórico de transferências:', error);
        throw error;
      }

      return transfers || [];
    },
    enabled: !!profile?.id,
  });

  // Criar transferência
  const createTransferMutation = useMutation({
    mutationFn: async ({
      conversationId,
      toAttendantId,
      toSectorId,
      reason
    }: {
      conversationId: string;
      toAttendantId?: string;
      toSectorId?: string;
      reason?: string;
    }) => {
      if (!profile?.id) throw new Error('Usuário não autenticado');

      console.log('🔄 Criando transferência:', { conversationId, toAttendantId, toSectorId, reason });

      // Buscar dados da conversa atual
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('sector_id, assigned_to')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      const { data, error } = await supabase
        .from('conversation_transfers')
        .insert({
          conversation_id: conversationId,
          from_attendant_id: conversation.assigned_to,
          to_attendant_id: toAttendantId || null,
          from_sector_id: conversation.sector_id,
          to_sector_id: toSectorId || null,
          transferred_by: profile.id,
          status: 'pending',
          reason: reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Transferência solicitada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-history'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao criar transferência:', error);
      toast.error('Erro ao solicitar transferência: ' + error.message);
    },
  });

  // Aceitar transferência
  const acceptTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      console.log('✅ Aceitando transferência:', transferId);

      const { data, error } = await supabase
        .from('conversation_transfers')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', transferId)
        .select()
        .single();

      if (error) throw error;

      // Atualizar a conversa para o novo atendente
      if (data.conversation_id && data.to_attendant_id) {
        const { error: convError } = await supabase
          .from('conversations')
          .update({
            assigned_to: data.to_attendant_id,
            sector_id: data.to_sector_id,
            status: 'in_progress',
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.conversation_id);

        if (convError) throw convError;
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Transferência aceita com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-history'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao aceitar transferência:', error);
      toast.error('Erro ao aceitar transferência: ' + error.message);
    },
  });

  // Rejeitar transferência
  const rejectTransferMutation = useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string; reason?: string }) => {
      console.log('❌ Rejeitando transferência:', transferId, reason);

      const { data, error } = await supabase
        .from('conversation_transfers')
        .update({
          status: 'rejected',
          reason: reason || 'Transferência rejeitada pelo atendente',
          completed_at: new Date().toISOString(),
        })
        .eq('id', transferId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Transferência rejeitada');
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-history'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao rejeitar transferência:', error);
      toast.error('Erro ao rejeitar transferência: ' + error.message);
    },
  });

  // Cancelar transferência
  const cancelTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      console.log('🚫 Cancelando transferência:', transferId);

      const { data, error } = await supabase
        .from('conversation_transfers')
        .update({
          status: 'rejected',
          reason: 'Transferência cancelada pelo solicitante',
          completed_at: new Date().toISOString(),
        })
        .eq('id', transferId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Transferência cancelada');
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['transfer-history'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro ao cancelar transferência:', error);
      toast.error('Erro ao cancelar transferência: ' + error.message);
    },
  });

  return {
    // Dados
    pendingTransfers,
    transferHistory,
    
    // Estados de loading
    loadingPending,
    loadingHistory,
    
    // Ações
    createTransfer: createTransferMutation.mutate,
    acceptTransfer: acceptTransferMutation.mutate,
    rejectTransfer: rejectTransferMutation.mutate,
    cancelTransfer: cancelTransferMutation.mutate,
    
    // Estados das mutações
    isCreatingTransfer: createTransferMutation.isPending,
    isAcceptingTransfer: acceptTransferMutation.isPending,
    isRejectingTransfer: rejectTransferMutation.isPending,
    isCancelingTransfer: cancelTransferMutation.isPending,
    
    // Contador de transferências pendentes
    pendingTransfersCount: pendingTransfers.length,
  };
};
