
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export const useChatbotIntegration = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🤖 Setting up chatbot integration...');

    // Listen for new incoming messages
    const channel = supabase
      .channel('chatbot-integration')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'direction=eq.incoming'
        },
        async (payload) => {
          console.log('📥 New incoming message:', payload);
          
          const message = payload.new;
          
          // Get conversation details
          const { data: conversation } = await supabase
            .from('conversations')
            .select('*, sectors(id)')
            .eq('id', message.conversation_id)
            .single();

          if (!conversation || !conversation.sectors?.id) {
            console.log('❌ No conversation or sector found');
            return;
          }

          // Only process if conversation is new or no attendant assigned
          if (conversation.status !== 'new' || conversation.assigned_to) {
            console.log('🚫 Conversation already has attendant or is not new');
            return;
          }

          try {
            // Call chatbot processor
            const response = await supabase.functions.invoke('chatbot-processor', {
              body: {
                conversationId: conversation.id,
                userInput: message.content,
                sectorId: conversation.sectors.id,
                clientPhone: message.from_phone
              }
            });

            if (response.error) {
              console.error('❌ Chatbot processor error:', response.error);
              return;
            }

            const result = response.data;
            console.log('🤖 Chatbot response:', result);

            if (result.shouldEscalate) {
              // Update conversation status to indicate human needed
              await supabase
                .from('conversations')
                .update({ 
                  status: 'new' // Keep as new but add to queue
                })
                .eq('id', conversation.id);

              // Invalidate queries to refresh UI
              queryClient.invalidateQueries({ queryKey: ['conversations'] });
              queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
            }

          } catch (error) {
            console.error('❌ Error processing chatbot:', error);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🤖 Cleaning up chatbot integration');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
