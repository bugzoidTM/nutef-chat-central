import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { toast } from 'sonner';

export interface ConversationTransfer {
  id: string;
  conversation_id: string;
  from_attendant_id: string | null;
  to_attendant_id: string | null;
  from_sector_id: string | null;
  to_sector_id: string | null;
  reason: string;
  created_at: string;
  // Dados relacionados
  conversation?: {
    id: string;
    client_name: string | null;
    client_phone: string;
  };
  from_attendant?: {
    id: string;
    name: string;
  };
  to_attendant?: {
    id: string;
    name: string;
  };
  from_sector?: {
    id: string;
    name: string;
    color: string;
  };
  to_sector?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface CreateTransferData {
  conversation_id: string;
  to_attendant_id?: string | null;
  to_sector_id?: string | null;
  reason: string;
}

export const useConversationTransfers = (conversationId?: string) => {
  const { profile } = useAuth();
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  // Buscar transferências para uma conversa específica
  const { data: conversationTransfers = [], isLoading: loadingConversationTransfers } = useQuery({
    queryKey: ['conversation-transfers', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from('conversation_transfers')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ConversationTransfer[];
    },
    enabled: !!conversationId,
  });

  // Buscar todas as transferências (apenas para admins)
  const { data: allTransfers = [], isLoading: loadingAllTransfers } = useQuery({
    queryKey: ['all-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_transfers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ConversationTransfer[];
    },
    enabled: isAdmin,
  });

  // Criar transferência
  const createTransferMutation = useMutation({
    mutationFn: async (transferData: CreateTransferData) => {
      // Buscar dados atuais da conversa
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('assigned_to')
        .eq('id', transferData.conversation_id)
        .single();
      
      if (convError) throw convError;

      const { data, error } = await supabase
        .from('conversation_transfers')
        .insert({
          conversation_id: transferData.conversation_id,
          from_attendant_id: conversation.assigned_to,
          to_attendant_id: transferData.to_attendant_id,
          to_sector_id: transferData.to_sector_id,
          reason: transferData.reason,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['all-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Transferência criada com sucesso!');
      setIsTransferDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar transferência: ${error.message}`);
    },
  });

  return {
    // Dados
    conversationTransfers,
    allTransfers,
    pendingTransfers: [], // Placeholder até implementar status
    
    // Estados de loading
    loadingConversationTransfers,
    loadingAllTransfers,
    loadingPendingTransfers: false,
    
    // Ações
    createTransfer: createTransferMutation.mutate,
    acceptTransfer: () => {}, // Placeholder
    rejectTransfer: () => {}, // Placeholder
    
    // Estados das mutações
    isCreatingTransfer: createTransferMutation.isPending,
    isAcceptingTransfer: false,
    isRejectingTransfer: false,
    
    // UI state
    isTransferDialogOpen,
    setIsTransferDialogOpen,
    
    // Contadores
    pendingTransfersCount: 0,
    
    // Helpers
    canCreateTransfer: () => true,
  };
};
