import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { findMessages, convertEvolutionMessageToUnified } from '@/services/evolution/messageApi';
import type { UnifiedMessage } from '@/services/evolution/types';

type MessageSource = 'supabase' | 'evolution';

interface UseMessagesOptions {
  source?: MessageSource;
  instanceName?: string;
  instancePhone?: string;
}

export const useMessages = (
  selectedConversation: string | null, 
  options: UseMessagesOptions = {}
) => {
  const { 
    source = 'supabase', 
    instanceName = 'default',
    instancePhone = ''
  } = options;
  
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', selectedConversation, source, instanceName],
    queryFn: async (): Promise<UnifiedMessage[]> => {
      if (!selectedConversation) return [];
      
      console.log('🔍 useMessages - Fetching messages for conversation:', selectedConversation, 'source:', source);
      
      if (source === 'evolution') {
        if (!instanceName) {
          console.error('❌ useMessages - Instance name is required for Evolution API');
          throw new Error('Nome da instância é obrigatório para buscar mensagens da Evolution API');
        }

        try {
          // Para Evolution API, selectedConversation deve ser o remoteJid (número@s.whatsapp.net)
          const remoteJid = selectedConversation.includes('@') 
            ? selectedConversation 
            : `${selectedConversation}@s.whatsapp.net`;

          console.log('📡 useMessages - Fetching from Evolution API:', { instanceName, remoteJid });
          
          const evolutionResponse = await findMessages(instanceName, remoteJid, 50, 0);
          
          console.log('📝 useMessages - Evolution API response:', { 
            messagesCount: evolutionResponse.messages?.length || 0
          });

          // Converter mensagens da Evolution para formato unificado
          const unifiedMessages = evolutionResponse.messages?.map(msg => 
            convertEvolutionMessageToUnified(msg, instancePhone)
          ) || [];

          // Ordenar por timestamp (mais antigo primeiro)
          unifiedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          return unifiedMessages;
        } catch (error) {
          console.error('❌ useMessages - Evolution API error:', error);
          throw error;
        }
      } else {
        // Buscar do Supabase (comportamento original)
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversation)
          .order('timestamp', { ascending: true });

        console.log('📝 useMessages - Supabase query result:', { 
          data: data ? `${data.length} messages` : 'null', 
          error: error?.message || 'none' 
        });

        if (error) throw error;
        
        // Converter mensagens do Supabase para formato unificado
        const unifiedMessages: UnifiedMessage[] = (data || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          direction: msg.direction,
          timestamp: msg.timestamp,
          from_phone: msg.from_phone,
          to_phone: msg.to_phone,
          message_type: msg.message_type || 'text',
          media_url: msg.media_url,
          caption: msg.caption,
          source: 'supabase'
        }));

        return unifiedMessages;
      }
    },
    enabled: !!selectedConversation,
    retry: (failureCount, error: any) => {
      console.log(`🔄 useMessages - Retry attempt ${failureCount}:`, error?.message);
      return failureCount < 2;
    },
  });

  // Log messages error if exists
  if (messagesError) {
    console.error('❌ useMessages - Messages error:', messagesError);
  }

  return {
    messages,
    messagesLoading,
    messagesError,
  };
};

// Hook específico para buscar do Supabase (compatibilidade)
export const useSupabaseMessages = (selectedConversation: string | null) => {
  return useMessages(selectedConversation, { source: 'supabase' });
};

// Hook específico para buscar da Evolution API
export const useEvolutionMessages = (
  selectedConversation: string | null,
  instanceName: string,
  instancePhone: string
) => {
  return useMessages(selectedConversation, { 
    source: 'evolution', 
    instanceName,
    instancePhone 
  });
};
