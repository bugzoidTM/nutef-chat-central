
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchMessages, convertEvolutionMessage } from '@/services/evolution/messagesApi';

export const useEvolutionMessages = (selectedConversation: string | null) => {
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['evolution-messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      console.log('🔍 useEvolutionMessages - Fetching messages from Evolution API for conversation:', selectedConversation);
      
      try {
        // First, get conversation details to get the client phone and instance info
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select(`
            *,
            instances (
              instance_name,
              phone
            )
          `)
          .eq('id', selectedConversation)
          .single();

        if (convError || !conversation) {
          console.error('❌ useEvolutionMessages - Error fetching conversation:', convError);
          return [];
        }

        const instanceName = conversation.instances?.instance_name;
        const instancePhone = conversation.instances?.phone;
        const clientPhone = conversation.client_phone;

        if (!instanceName || !instancePhone || !clientPhone) {
          console.error('❌ useEvolutionMessages - Missing required data:', { instanceName, instancePhone, clientPhone });
          return [];
        }

        // Format client phone for Evolution API (add @s.whatsapp.net)
        const remoteJid = clientPhone.includes('@') ? clientPhone : `${clientPhone}@s.whatsapp.net`;
        
        console.log('📞 useEvolutionMessages - Fetching from Evolution:', { instanceName, remoteJid });
        
        // Fetch messages directly from Evolution API
        const evolutionMessages = await fetchMessages(instanceName, remoteJid, 100);
        
        console.log('📝 useEvolutionMessages - Evolution API returned:', evolutionMessages.length, 'messages');
        
        // Convert Evolution messages to our format
        const convertedMessages = evolutionMessages.map(msg => 
          convertEvolutionMessage(msg, instancePhone)
        );
        
        // Sort by timestamp
        convertedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        console.log('✅ useEvolutionMessages - Converted messages:', convertedMessages.length);
        
        return convertedMessages;
      } catch (error) {
        console.error('❌ useEvolutionMessages - Error:', error);
        return [];
      }
    },
    enabled: !!selectedConversation,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
    retry: (failureCount, error: any) => {
      console.log(`🔄 useEvolutionMessages - Retry attempt ${failureCount}:`, error?.message);
      return failureCount < 2;
    },
  });

  // Log messages error if exists
  if (messagesError) {
    console.error('❌ useEvolutionMessages - Messages error:', messagesError);
  }

  return {
    messages,
    messagesLoading,
  };
};
