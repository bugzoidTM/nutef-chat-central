import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { toast } from 'sonner';

export interface QueueItem {
  id: string;
  conversation_id: string;
  sector_id: string;
  priority: number;
  created_at: string;
  assigned_at: string | null;
  assigned_to: string | null;
  timeout_at: string | null;
  status: 'waiting' | 'assigned' | 'timeout' | 'completed';
  // Dados relacionados
  conversation?: {
    id: string;
    client_name: string | null;
    client_phone: string;
    last_message_at: string;
  };
  sector?: {
    id: string;
    name: string;
    color: string;
  };
  attendant?: {
    id: string;
    name: string;
  };
}

export interface QueueStats {
  waiting: number;
  assigned: number;
  timeout: number;
  averageWaitTime: number;
  totalProcessed: number;
}

export const useQueueSystem = (sectorId?: string) => {
  const { profile } = useAuth();
  const { isAdmin, isAttendant, sectorId: userSectorId, maxConcurrentChats } = usePermissions();
  const queryClient = useQueryClient();

  // Buscar itens da fila
  const { data: queueItems = [], isLoading: loadingQueue, refetch } = useQuery({
    queryKey: ['queue-items', sectorId || userSectorId],
    queryFn: async () => {
      const targetSectorId = sectorId || userSectorId;
      
      let query = supabase
        .from('conversation_queue')
        .select(`
          *,
          conversation:conversation_id (
            id,
            client_name,
            client_phone,
            last_message_at
          ),
          sector:sector_id (
            id,
            name,
            color
          ),
          attendant:assigned_to (
            id,
            name
          )
        `);

      if (targetSectorId && !isAdmin) {
        query = query.eq('sector_id', targetSectorId);
      }

      query = query.order('priority', { ascending: false })
                  .order('created_at', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      return data as QueueItem[];
    },
    enabled: !!(profile && (isAdmin || isAttendant)),
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  // Buscar estatísticas da fila
  const { data: queueStats } = useQuery({
    queryKey: ['queue-stats', sectorId || userSectorId],
    queryFn: async () => {
      const targetSectorId = sectorId || userSectorId;
      
      const { data, error } = await supabase.rpc('get_queue_stats', {
        p_sector_id: targetSectorId
      });

      if (error) throw error;
      
      // Properly handle the Json type conversion
      const stats = data as unknown;
      
      // Validate that the data has the expected structure
      if (stats && typeof stats === 'object' && stats !== null) {
        const statsObj = stats as Record<string, unknown>;
        return {
          waiting: Number(statsObj.waiting) || 0,
          assigned: Number(statsObj.assigned) || 0,
          timeout: Number(statsObj.timeout) || 0,
          averageWaitTime: Number(statsObj.averageWaitTime) || 0,
          totalProcessed: Number(statsObj.totalProcessed) || 0,
        } as QueueStats;
      }
      
      // Return default stats if data is invalid
      return {
        waiting: 0,
        assigned: 0,
        timeout: 0,
        averageWaitTime: 0,
        totalProcessed: 0,
      } as QueueStats;
    },
    enabled: !!(profile && (isAdmin || isAttendant)),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar conversas pendentes para atribuição
  const { data: pendingConversations = [] } = useQuery({
    queryKey: ['pending-conversations', sectorId || userSectorId],
    queryFn: async () => {
      const targetSectorId = sectorId || userSectorId;
      
      let query = supabase
        .from('conversations')
        .select(`
          id,
          client_name,
          client_phone,
          created_at,
          last_message_at,
          sector_id,
          sectors:sector_id (name, color)
        `)
        .eq('status', 'new')
        .is('assigned_to', null);

      if (targetSectorId && !isAdmin) {
        query = query.eq('sector_id', targetSectorId);
      }

      query = query.order('created_at', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      return data;
    },
    enabled: !!(profile && (isAdmin || isAttendant)),
    refetchInterval: 15000,
  });

  // Adicionar à fila
  const addToQueueMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('conversation_queue')
        .insert({
          conversation_id: conversationId,
          sector_id: sectorId || userSectorId,
          priority: 1,
          status: 'waiting'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      toast.success('Conversa adicionada à fila');
    },
    onError: (error: any) => {
      toast.error(`Erro ao adicionar à fila: ${error.message}`);
    },
  });

  // Atribuir da fila
  const assignFromQueueMutation = useMutation({
    mutationFn: async ({ queueId, attendantId }: { queueId: string; attendantId?: string }) => {
      const targetAttendantId = attendantId || profile?.id;
      
      if (!targetAttendantId) {
        throw new Error('ID do atendente não encontrado');
      }

      // Buscar o item da fila
      const { data: queueItem, error: queueError } = await supabase
        .from('conversation_queue')
        .select('conversation_id, sector_id')
        .eq('id', queueId)
        .single();

      if (queueError) throw queueError;

      // Atualizar a conversa
      const { error: conversationError } = await supabase
        .from('conversations')
        .update({
          assigned_to: targetAttendantId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.conversation_id);

      if (conversationError) throw conversationError;

      // Atualizar o item da fila
      const { error: queueUpdateError } = await supabase
        .from('conversation_queue')
        .update({
          assigned_to: targetAttendantId,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', queueId);

      if (queueUpdateError) throw queueUpdateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversa atribuída com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atribuir conversa: ${error.message}`);
    },
  });

  // Remover da fila
  const removeFromQueueMutation = useMutation({
    mutationFn: async (queueId: string) => {
      const { error } = await supabase
        .from('conversation_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', queueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      toast.success('Item removido da fila');
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover da fila: ${error.message}`);
    },
  });

  // Processar timeouts
  const processTimeoutsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('process_queue_timeouts');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Timeouts processados');
    },
    onError: (error: any) => {
      toast.error(`Erro ao processar timeouts: ${error.message}`);
    },
  });

  return {
    // Dados
    queueItems,
    queueStats: queueStats || {
      waiting: 0,
      assigned: 0,
      timeout: 0,
      averageWaitTime: 0,
      totalProcessed: 0
    },
    pendingConversations,
    
    // Estados de loading
    loadingQueue,
    
    // Ações
    addToQueue: addToQueueMutation.mutate,
    assignFromQueue: assignFromQueueMutation.mutate,
    removeFromQueue: removeFromQueueMutation.mutate,
    processTimeouts: processTimeoutsMutation.mutate,
    refetchQueue: refetch,
    
    // Estados das mutações
    isAddingToQueue: addToQueueMutation.isPending,
    isAssigningFromQueue: assignFromQueueMutation.isPending,
    isRemovingFromQueue: removeFromQueueMutation.isPending,
    isProcessingTimeouts: processTimeoutsMutation.isPending,
    
    // Helpers
    getQueuePosition: (conversationId: string) => {
      const waitingItems = queueItems.filter(item => item.status === 'waiting');
      return waitingItems.findIndex(item => item.conversation_id === conversationId) + 1;
    },
    
    getWaitTime: (queueItem: QueueItem) => {
      const now = new Date();
      const created = new Date(queueItem.created_at);
      return Math.floor((now.getTime() - created.getTime()) / 1000 / 60); // minutos
    },
    
    canTakeFromQueue: () => {
      if (isAdmin) return true;
      if (!isAttendant) return false;
      
      // Verificar se tem espaço para mais conversas
      const currentAssigned = queueItems.filter(item => 
        item.assigned_to === profile?.id && item.status === 'assigned'
      ).length;
      
      return currentAssigned < maxConcurrentChats;
    },

    // Filtrar itens por status
    getItemsByStatus: (status: QueueItem['status']) => {
      return queueItems.filter(item => item.status === status);
    },

    // Obter próximo item da fila
    getNextInQueue: () => {
      const waitingItems = queueItems
        .filter(item => item.status === 'waiting')
        .sort((a, b) => {
          // Ordenar por prioridade (desc) e depois por data de criação (asc)
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
      
      return waitingItems[0] || null;
    },
  };
};
