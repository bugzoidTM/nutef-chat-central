
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

          // Check working hours for this sector
          const { data: workingHours } = await supabase
            .from('working_hours')
            .select('*')
            .eq('sector_id', conversation.sectors.id)
            .maybeSingle();

          // Check if we're within working hours
          const isWithinWorkingHours = checkWorkingHours(workingHours);
          
          if (!isWithinWorkingHours && workingHours?.auto_response_enabled) {
            console.log('⏰ Outside working hours, sending auto response');
            
            // Send automatic response
            const autoMessage = workingHours.auto_response_message
              .replace('{start_time}', workingHours.start_time)
              .replace('{end_time}', workingHours.end_time);

            await supabase.from('messages').insert({
              conversation_id: conversation.id,
              from_phone: 'SYSTEM',
              to_phone: message.from_phone,
              content: autoMessage,
              message_type: 'text',
              direction: 'outgoing',
              sender_name: 'Sistema Automático',
              sender_sector: 'Sistema'
            });

            // Add to off-hours queue if enabled
            if (workingHours.queue_enabled) {
              await supabase.from('off_hours_queue').insert({
                conversation_id: conversation.id,
                sector_id: conversation.sectors.id,
                client_phone: message.from_phone,
                client_name: conversation.client_name,
                priority: 1,
                status: 'waiting'
              });

              // Send queue confirmation message
              if (workingHours.queue_message) {
                await supabase.from('messages').insert({
                  conversation_id: conversation.id,
                  from_phone: 'SYSTEM',
                  to_phone: message.from_phone,
                  content: workingHours.queue_message,
                  message_type: 'text',
                  direction: 'outgoing',
                  sender_name: 'Sistema Automático',
                  sender_sector: 'Sistema'
                });
              }
            }

            // Invalidate queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
            queryClient.invalidateQueries({ queryKey: ['off-hours-queue'] });
            return;
          }

          // If within working hours, proceed with normal chatbot processing
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

  // Helper function to check working hours
  const checkWorkingHours = (workingHours: any): boolean => {
    if (!workingHours || !workingHours.is_enabled) return true;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Check if current day is a working day
    if (!workingHours.working_days.includes(currentDay)) {
      return false;
    }

    // Check if current time is within working hours
    if (currentTime < workingHours.start_time || currentTime > workingHours.end_time) {
      return false;
    }

    return true;
  };
};
