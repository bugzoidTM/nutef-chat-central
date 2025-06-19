
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { SectorType, StatusType, Conversation } from '@/types/dashboard';

export const useConversations = (selectedSector: SectorType, selectedStatus: StatusType) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', selectedSector, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (selectedSector !== 'all') {
        query = query.eq('sector', selectedSector);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Get conversation counts
  const conversationCounts = {
    new: conversations.filter(c => c.status === 'new').length,
    in_progress: conversations.filter(c => c.status === 'in_progress').length,
    finished: conversations.filter(c => c.status === 'finished').length,
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) throw new Error('Conversa não encontrada');

      // Insert message in database
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          from_phone: 'system', // Will be replaced with instance phone
          to_phone: conversation.client_phone,
          content,
          direction: 'outgoing',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation status to in_progress if it's new
      if (conversation.status === 'new') {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ 
            status: 'in_progress',
            assigned_to: profile?.id,
            last_message_at: new Date().toISOString(),
          })
          .eq('id', conversationId);

        if (updateError) throw updateError;
      }

      // TODO: Send message via Evolution API
      console.log('Sending message via Evolution API:', {
        to: conversation.client_phone,
        content,
      });

      return messageData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    conversations,
    conversationsLoading,
    conversationCounts,
    sendMessageMutation,
  };
};
