import { useState, useEffect } from 'react';
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
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);

  // Buscar fila de atendimento
  const { data: queueItems = [], isLoading: loadingQueue } = useQuery({
    queryKey: ['queue-items', sectorId || userSectorId],
    queryFn: async () => {
      const targetSectorId = sectorId || userSectorId;
      if (!targetSectorId && !isAdmin) return [];
      
      let query = supabase
        .from('conversation_queue')
        .select(`
          *,
          conversation:conversations(id, client_name, client_phone, last_message_at),
          sector:sectors(id, name, color),
          attendant:profiles!assigned_to(id, name)
        `);

      // Filtrar por setor se não for admin
      if (!isAdmin && targetSectorId) {
        query = query.eq('sector_id', targetSectorId);
      }

      query = query.order('priority', { ascending: false })
                  .order('created_at', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      
      return data as QueueItem[];
    },
    enabled: !!(sectorId || userSectorId || isAdmin),
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  // Buscar estatísticas da fila
  const { data: queueStats } = useQuery({
    queryKey: ['queue-stats', sectorId || userSectorId],
    queryFn: async () => {
      const targetSectorId = sectorId || userSectorId;
      
      const { data, error } = await supabase
        .rpc('get_queue_stats', { 
          p_sector_id: targetSectorId || null 
        });
      
      if (error) throw error;
      return data as QueueStats;
    },
    enabled: !!(sectorId || userSectorId || isAdmin),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar conversas que precisam ser adicionadas à fila
  const { data: pendingConversations = [] } = useQuery({
    queryKey: ['pending-conversations', sectorId || userSectorId],
    queryFn: async () => {
      const targetSectorId = sectorId || userSectorId;
      if (!targetSectorId && !isAdmin) return [];

      let query = supabase
        .from('conversations')
        .select(`
          id, client_name, client_phone, sector_id, created_at, last_message_at,
          sector:sectors(id, name, color)
        `)
        .eq('status', 'new')
        .is('assigned_to', null);

      if (!isAdmin && targetSectorId) {
        query = query.eq('sector_id', targetSectorId);
      }

      // Apenas conversas que não estão na fila
      query = query.not('id', 'in', `(${queueItems.map(q => q.conversation_id).join(',') || 'null'})`);

      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      
      return data;
    },
    enabled: !!(sectorId || userSectorId || isAdmin) && queueItems.length >= 0,
  });

  // Adicionar conversa à fila
  const addToQueueMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('sector_id')
        .eq('id', conversationId)
        .single();
      
      if (convError) throw convError;

      const { data, error } = await supabase
        .from('conversation_queue')
        .insert({
          conversation_id: conversationId,
          sector_id: conversation.sector_id,
          priority: 1, // Prioridade normal
          status: 'waiting',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-conversations'] });
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar à fila:', error);
      toast.error('Erro ao adicionar conversa à fila');
    },
  });

  // Atribuir conversa da fila para atendente
  const assignFromQueueMutation = useMutation({
    mutationFn: async ({ queueId, attendantId }: { queueId: string; attendantId?: string }) => {
      const targetAttendantId = attendantId || profile?.id;
      if (!targetAttendantId) throw new Error('Atendente não identificado');

      // Verificar limite de conversas do atendente
      const { data: currentCount, error: countError } = await supabase
        .from('conversations')
        .select('id', { count: 'exact' })
        .eq('assigned_to', targetAttendantId)
        .in('status', ['new', 'in_progress']);
      
      if (countError) throw countError;
      
      if (currentCount && currentCount.length >= maxConcurrentChats) {
        throw new Error(`Limite de ${maxConcurrentChats} conversas simultâneas atingido`);
      }

      // Atualizar fila
      const { data: queueItem, error: queueError } = await supabase
        .from('conversation_queue')
        .update({
          assigned_to: targetAttendantId,
          assigned_at: new Date().toISOString(),
          timeout_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos
          status: 'assigned'
        })
        .eq('id', queueId)
        .select()
        .single();
      
      if (queueError) throw queueError;

      // Atualizar conversa
      const { error: convError } = await supabase
        .from('conversations')
        .update({
          assigned_to: targetAttendantId,
          status: 'in_progress'
        })
        .eq('id', queueItem.conversation_id);
      
      if (convError) throw convError;

      return queueItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Conversa atribuída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atribuir conversa: ${error.message}`);
    },
  });

  // Remover da fila (conversa finalizada)
  const removeFromQueueMutation = useMutation({
    mutationFn: async (queueId: string) => {
      const { data, error } = await supabase
        .from('conversation_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', queueId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-items'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });

  // Sistema de auto-reatribuição por timeout
  useEffect(() => {
    if (!autoAssignEnabled || !isAdmin) return;

    const checkTimeouts = async () => {
      const now = new Date().toISOString();
      
      // Buscar itens que passaram do timeout
      const { data: timeoutItems, error } = await supabase
        .from('conversation_queue')
        .select('*')
        .eq('status', 'assigned')
        .not('timeout_at', 'is', null)
        .lt('timeout_at', now);
      
      if (error || !timeoutItems?.length) return;

      for (const item of timeoutItems) {
        try {
          // Marcar como timeout
          await supabase
            .from('conversation_queue')
            .update({ status: 'timeout' })
            .eq('id', item.id);

          // Buscar próximo atendente disponível do mesmo setor
          const { data: availableAttendants, error: attendantError } = await supabase
            .from('profiles')
            .select('id, max_concurrent_chats')
            .eq('sector_id', item.sector_id)
            .eq('role', 'attendant')
            .eq('is_active', true);
          
          if (attendantError || !availableAttendants?.length) continue;

          // Encontrar atendente com menor carga
          let bestAttendant = null;
          let minLoad = Infinity;

          for (const attendant of availableAttendants) {
            const { count } = await supabase
              .from('conversations')
              .select('id', { count: 'exact' })
              .eq('assigned_to', attendant.id)
              .in('status', ['new', 'in_progress']);
            
            const currentLoad = count || 0;
            if (currentLoad < attendant.max_concurrent_chats && currentLoad < minLoad) {
              minLoad = currentLoad;
              bestAttendant = attendant;
            }
          }

          if (bestAttendant) {
            // Criar novo item na fila para o próximo atendente
            await addToQueueMutation.mutateAsync(item.conversation_id);
            
            // Criar registro de transferência automática
            await supabase
              .from('conversation_transfers')
              .insert({
                conversation_id: item.conversation_id,
                from_attendant_id: item.assigned_to,
                to_attendant_id: bestAttendant.id,
                from_sector_id: item.sector_id,
                to_sector_id: item.sector_id,
                reason: 'Reatribuição automática por timeout (5 minutos sem resposta)',
                status: 'completed',
                transferred_by: null, // Sistema automático
                accepted_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
              });

            toast.info(`Conversa reatribuída automaticamente após timeout`);
          }
        } catch (error) {
          console.error('Erro na reatribuição automática:', error);
        }
      }
    };

    // Verificar timeouts a cada 30 segundos
    const interval = setInterval(checkTimeouts, 30000);
    return () => clearInterval(interval);
  }, [autoAssignEnabled, isAdmin, addToQueueMutation]);

  // Auto-adicionar conversas pendentes à fila
  useEffect(() => {
    if (pendingConversations.length > 0 && isAdmin) {
      pendingConversations.forEach(conv => {
        addToQueueMutation.mutate(conv.id);
      });
    }
  }, [pendingConversations.length, isAdmin]);

  return {
    // Dados
    queueItems,
    queueStats,
    pendingConversations,
    
    // Estados de loading
    loadingQueue,
    
    // Ações
    addToQueue: addToQueueMutation.mutate,
    assignFromQueue: assignFromQueueMutation.mutate,
    removeFromQueue: removeFromQueueMutation.mutate,
    
    // Estados das mutações
    isAddingToQueue: addToQueueMutation.isPending,
    isAssigningFromQueue: assignFromQueueMutation.isPending,
    isRemovingFromQueue: removeFromQueueMutation.isPending,
    
    // Configurações
    autoAssignEnabled,
    setAutoAssignEnabled,
    
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
  };
}; 