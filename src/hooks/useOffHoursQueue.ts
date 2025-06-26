
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface OffHoursQueueItem {
  id: string;
  conversation_id: string;
  sector_id: string;
  client_phone: string;
  client_name: string | null;
  received_at: string;
  status: 'waiting' | 'contacted' | 'resolved';
  priority: number;
  notes: string | null;
  contacted_at: string | null;
  contacted_by: string | null;
  created_at: string;
  updated_at: string;
  // Related data (will be fetched separately if needed)
  conversation?: {
    client_name: string | null;
    last_message_at: string;
  };
  sector?: {
    name: string;
    color: string;
  };
  attendant?: {
    name: string;
  };
}

export const useOffHoursQueue = (sectorId?: string) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch off-hours queue items
  const { data: queueItems = [], isLoading } = useQuery({
    queryKey: ['off-hours-queue', sectorId],
    queryFn: async () => {
      let query = supabase
        .from('off_hours_queue')
        .select('*')
        .order('priority', { ascending: false })
        .order('received_at', { ascending: true });

      if (sectorId) {
        query = query.eq('sector_id', sectorId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching off-hours queue:', error);
        throw error;
      }

      return (data || []) as OffHoursQueueItem[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Add to off-hours queue
  const addToOffHoursQueue = useMutation({
    mutationFn: async ({
      conversationId,
      sectorId,
      clientPhone,
      clientName,
      priority = 1,
      notes
    }: {
      conversationId: string;
      sectorId: string;
      clientPhone: string;
      clientName?: string;
      priority?: number;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('off_hours_queue')
        .insert({
          conversation_id: conversationId,
          sector_id: sectorId,
          client_phone: clientPhone,
          client_name: clientName,
          priority,
          notes,
          status: 'waiting'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['off-hours-queue'] });
    },
  });

  // Mark as contacted
  const markAsContacted = useMutation({
    mutationFn: async (queueId: string) => {
      const { error } = await supabase
        .from('off_hours_queue')
        .update({
          status: 'contacted',
          contacted_at: new Date().toISOString(),
          contacted_by: profile?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['off-hours-queue'] });
      toast({
        title: "Status atualizado",
        description: "Item marcado como contatado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark as resolved
  const markAsResolved = useMutation({
    mutationFn: async (queueId: string) => {
      const { error } = await supabase
        .from('off_hours_queue')
        .update({
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['off-hours-queue'] });
      toast({
        title: "Item resolvido",
        description: "Item removido da fila de atendimento.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resolver",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update notes
  const updateNotes = useMutation({
    mutationFn: async ({ queueId, notes }: { queueId: string; notes: string }) => {
      const { error } = await supabase
        .from('off_hours_queue')
        .update({
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['off-hours-queue'] });
      toast({
        title: "Notas atualizadas",
        description: "As observações foram salvas.",
      });
    },
  });

  // Get queue statistics
  const getQueueStats = () => {
    const waiting = queueItems.filter(item => item.status === 'waiting').length;
    const contacted = queueItems.filter(item => item.status === 'contacted').length;
    const total = queueItems.length;

    return {
      waiting,
      contacted,
      total,
      oldestWaiting: queueItems
        .filter(item => item.status === 'waiting')
        .sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime())[0]
    };
  };

  return {
    queueItems,
    isLoading,
    addToOffHoursQueue,
    markAsContacted,
    markAsResolved,
    updateNotes,
    getQueueStats,
    isAddingToQueue: addToOffHoursQueue.isPending,
    isMarkingContacted: markAsContacted.isPending,
    isMarkingResolved: markAsResolved.isPending,
    isUpdatingNotes: updateNotes.isPending,
  };
};
