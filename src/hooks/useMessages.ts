
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchChatMessages } from '@/services/evolution/messageApi';

export const useMessages = (selectedConversation: string | null) => {
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];

      console.log('🔍 useMessages - Fetching conversation info:', selectedConversation);

      const { data: convo, error: convError } = await supabase
        .from('conversations')
        .select('client_phone, instance_id')
        .eq('id', selectedConversation)
        .single();

      if (convError || !convo) throw convError || new Error('Conversation not found');

      const { data: instance, error: instError } = await supabase
        .from('instances')
        .select('instance_name, phone')
        .eq('id', convo.instance_id)
        .single();

      if (instError || !instance) throw instError || new Error('Instance not found');

      const jid = `${convo.client_phone}@s.whatsapp.net`;

      console.log('🔍 useMessages - Fetching messages from Evolution API:', { instanceName: instance.instance_name, jid });

      const response = await fetchChatMessages(instance.instance_name, jid);

      const formatted = (response.messages || []).map((msg: any) => ({
        id: msg.key?.id || msg.messageTimestamp || Math.random().toString(),
        content:
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.videoMessage?.caption ||
          (msg.message?.audioMessage ? '[Áudio]' : '[Mensagem]'),
        direction: msg.key?.fromMe ? 'outgoing' : 'incoming',
        timestamp: msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000).toISOString() : new Date().toISOString(),
        from_phone: msg.key?.fromMe ? instance.phone : convo.client_phone,
        to_phone: msg.key?.fromMe ? convo.client_phone : instance.phone,
      }));

      console.log('📝 useMessages - Evolution result:', { count: formatted.length });

      return formatted;
    },
    enabled: !!selectedConversation,
  });

  // Log messages error if exists
  if (messagesError) {
    console.error('❌ useMessages - Messages error:', messagesError);
  }

  return {
    messages,
    messagesLoading,
  };
};
