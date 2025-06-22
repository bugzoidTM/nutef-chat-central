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
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  transferred_by: string;
  accepted_at: string | null;
  completed_at: string | null;
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
  transferred_by_user?: {
    id: string;
    name: string;
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
  const { canTransferTo, isAdmin } = usePermissions();
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

  // Buscar transferências pendentes para o usuário atual
  const { data: pendingTransfers = [], isLoading: loadingPendingTransfers } = useQuery({
    queryKey: ['pending-transfers', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('conversation_transfers')
        .select('*')
        .eq('to_attendant_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ConversationTransfer[];
    },
    enabled: !!profile?.id,
  });

  // Buscar todas as transferências (apenas para admins)
  const { data: allTransfers = [], isLoading: loadingAllTransfers } = useQuery({
    queryKey: ['all-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_transfers')
        .select(`
          *,
          conversation:conversations(id, client_name, client_phone),
          from_attendant:profiles!from_attendant_id(id, name),
          to_attendant:profiles!to_attendant_id(id, name),
          from_sector:sectors!from_sector_id(id, name, color),
          to_sector:sectors!to_sector_id(id, name, color),
          transferred_by_user:profiles!transferred_by(id, name)
        `)
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
      // Verificar se o usuário pode transferir para o destino especificado
      if (!canTransferTo(transferData.to_sector_id, transferData.to_attendant_id)) {
        throw new Error('Você não tem permissão para transferir para este destino');
      }

      // Buscar dados atuais da conversa
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('sector_id, assigned_to')
        .eq('id', transferData.conversation_id)
        .single();
      
      if (convError) throw convError;

      const { data, error } = await supabase
        .from('conversation_transfers')
        .insert({
          conversation_id: transferData.conversation_id,
          from_attendant_id: conversation.assigned_to,
          to_attendant_id: transferData.to_attendant_id,
          from_sector_id: conversation.sector_id,
          to_sector_id: transferData.to_sector_id,
          reason: transferData.reason,
          status: 'pending',
          transferred_by: profile?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['all-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Transferência criada com sucesso!');
      setIsTransferDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar transferência: ${error.message}`);
    },
  });

  // Aceitar transferência
  const acceptTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      // Atualizar o status da transferência
      const { data: transfer, error: transferError } = await supabase
        .from('conversation_transfers')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', transferId)
        .select()
        .single();
      
      if (transferError) throw transferError;

      // Atualizar a conversa com o novo atendente/setor
      const updateData: any = {};
      if (transfer.to_attendant_id) {
        updateData.assigned_to = transfer.to_attendant_id;
      }
      if (transfer.to_sector_id) {
        updateData.sector_id = transfer.to_sector_id;
      }

      const { error: convError } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', transfer.conversation_id);
      
      if (convError) throw convError;

      // Marcar transferência como completa
      const { error: completeError } = await supabase
        .from('conversation_transfers')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', transferId);
      
      if (completeError) throw completeError;

      return transfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['all-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Transferência aceita com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao aceitar transferência: ${error.message}`);
    },
  });

  // Rejeitar transferência
  const rejectTransferMutation = useMutation({
    mutationFn: async (transferId: string) => {
      const { data, error } = await supabase
        .from('conversation_transfers')
        .update({
          status: 'rejected',
        })
        .eq('id', transferId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['all-transfers'] });
      toast.success('Transferência rejeitada');
    },
    onError: (error: any) => {
      toast.error(`Erro ao rejeitar transferência: ${error.message}`);
    },
  });

  return {
    // Dados
    conversationTransfers,
    pendingTransfers,
    allTransfers,
    
    // Estados de loading
    loadingConversationTransfers,
    loadingPendingTransfers,
    loadingAllTransfers,
    
    // Ações
    createTransfer: createTransferMutation.mutate,
    acceptTransfer: acceptTransferMutation.mutate,
    rejectTransfer: rejectTransferMutation.mutate,
    
    // Estados das mutações
    isCreatingTransfer: createTransferMutation.isPending,
    isAcceptingTransfer: acceptTransferMutation.isPending,
    isRejectingTransfer: rejectTransferMutation.isPending,
    
    // UI state
    isTransferDialogOpen,
    setIsTransferDialogOpen,
    
    // Contadores
    pendingTransfersCount: pendingTransfers.length,
    
    // Helpers
    canCreateTransfer: (toSectorId: string | null, toAttendantId?: string) => 
      canTransferTo(toSectorId, toAttendantId),
  };
}; 