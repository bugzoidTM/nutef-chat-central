
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
      console.log('📊 useConversations - Fetching conversations from Supabase...');
      
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
      
      console.log('📊 useConversations - Supabase query result:', { 
        data: data ? `${data.length} conversations` : 'null', 
        error: error?.message || 'none',
        rawData: data
      });
      
      if (error) {
        console.error('❌ useConversations - Error fetching conversations:', error);
        throw error;
      }
      
      return data || [];
    },
    refetchInterval: 3000, // Refresh every 3 seconds
    retry: (failureCount, error: any) => {
      console.log(`🔄 useConversations - Retry attempt ${failureCount}:`, error?.message);
      return failureCount < 2;
    },
  });

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
  console.log('📋 useConversations - All conversations:', conversations);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      console.log('📤 Sending message for conversation:', conversationId, 'content:', content);
      
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) {
        console.error('❌ Conversation not found:', conversationId);
        throw new Error('Conversa não encontrada');
      }

      console.log('📞 Found conversation:', conversation);

      // Get instance information for this conversation
      const { data: instance, error: instanceError } = await supabase
        .from('instances')
        .select('instance_name, phone')
        .eq('id', conversation.instance_id)
        .single();

      if (instanceError || !instance) {
        console.error('❌ Instance not found:', instanceError);
        throw new Error('Instância não encontrada');
      }

      console.log('🏢 Found instance:', instance);

      // Update conversation status to in_progress if it's new
      if (conversation.status === 'new') {
        console.log('🔄 Updating conversation status to in_progress');
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ 
            status: 'in_progress',
            assigned_to: profile?.id,
            last_message_at: new Date().toISOString(),
          })
          .eq('id', conversationId);

        if (updateError) {
          console.error('❌ Error updating conversation:', updateError);
          throw updateError;
        }
      }

      // Send message via Evolution API
      try {
        console.log('📤 Sending message via Evolution API:', { 
          instanceName: instance.instance_name, 
          number: conversation.client_phone, 
          text: content 
        });
        
        await evolutionApi.sendTextMessage(instance.instance_name, conversation.client_phone, content);
        console.log('✅ Message sent successfully via Evolution API');

        // Insert the outgoing message into Supabase
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: content,
            direction: 'outgoing',
            from_phone: instance.phone,
            to_phone: conversation.client_phone,
            message_type: 'text',
            timestamp: new Date().toISOString(),
          });

        if (messageError) {
          console.error('❌ Error inserting outgoing message:', messageError);
        } else {
          console.log('✅ Outgoing message inserted into Supabase');
        }

      } catch (evolutionError) {
        console.error('❌ Error sending message via Evolution API:', evolutionError);
        throw new Error('Erro ao enviar mensagem via WhatsApp');
      }

      return { success: true };
    },
    onSuccess: () => {
      console.log('✅ Message sent successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Error in sendMessageMutation:', error);
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
