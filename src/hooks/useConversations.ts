
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { SectorType, StatusType, Conversation } from '@/types/dashboard';
import * as evolutionApi from '@/services/evolutionApi';

export const useConversations = (selectedSector: SectorType, selectedStatus: StatusType) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('🔍 useConversations - Initialized with:', { 
    selectedSector, 
    selectedStatus, 
    profile: profile ? { id: profile.id, role: profile.role } : null 
  });

  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useQuery({
    queryKey: ['conversations', selectedSector, selectedStatus],
    queryFn: async () => {
      console.log('📊 useConversations - Fetching conversations...');
      
      let query = supabase
        .from('conversations')
        .select(`
          *,
          instances (
            instance_name,
            phone
          )
        `)
        .order('last_message_at', { ascending: false });

      if (selectedSector !== 'all') {
        query = query.eq('sector', selectedSector);
        console.log('🔽 Filtering by sector:', selectedSector);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
        console.log('🔽 Filtering by status:', selectedStatus);
      }

      const { data, error } = await query;
      
      console.log('📊 useConversations - Query result:', { 
        data: data ? `${data.length} conversations` : 'null', 
        error: error?.message || 'none' 
      });
      
      if (error) {
        console.error('❌ useConversations - Error fetching conversations:', error);
        throw error;
      }
      
      return data || [];
    },
    retry: (failureCount, error: any) => {
      console.log(`🔄 useConversations - Retry attempt ${failureCount}:`, error?.message);
      return failureCount < 2;
    },
  });

  // Log conversations error if exists
  if (conversationsError) {
    console.error('❌ useConversations - Conversations error:', conversationsError);
  }

  // Get conversation counts
  const conversationCounts = {
    new: conversations.filter(c => c.status === 'new').length,
    in_progress: conversations.filter(c => c.status === 'in_progress').length,
    finished: conversations.filter(c => c.status === 'finished').length,
  };

  console.log('📈 useConversations - Conversation counts:', conversationCounts);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) throw new Error('Conversa não encontrada');

      // Get instance information for this conversation
      const { data: instance, error: instanceError } = await supabase
        .from('instances')
        .select('instance_name, phone')
        .eq('id', conversation.instance_id)
        .single();

      if (instanceError || !instance) {
        throw new Error('Instância não encontrada');
      }

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

      // Send message via Evolution API using sendTextMessage function
      try {
        console.log('Sending message via Evolution API with configured environment variables');
        await evolutionApi.sendTextMessage(instance.instance_name, conversation.client_phone, content);
        console.log('Message sent successfully via Evolution API');
      } catch (evolutionError) {
        console.error('Error sending message via Evolution API:', evolutionError);
        throw new Error('Erro ao enviar mensagem via WhatsApp');
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-messages'] });
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
