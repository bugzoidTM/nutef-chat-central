import { useQuery } from '@tanstack/react-query';
import { findMessages, convertEvolutionMessageToUnified } from '@/services/evolution/messageApi';
import { useEvolutionInstances } from '@/hooks/useEvolutionInstances';
import type { UnifiedMessage } from '@/services/evolution/types';

export const useMessages = (selectedConversation: string | null) => {
  const { defaultInstance, hasConnectedInstances } = useEvolutionInstances();
  
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['evolution-messages', selectedConversation, defaultInstance?.instanceName],
    queryFn: async (): Promise<UnifiedMessage[]> => {
      if (!selectedConversation || !defaultInstance || !hasConnectedInstances) {
        console.log('⚠️ useMessages - Missing requirements:', { 
          selectedConversation: !!selectedConversation,
          defaultInstance: !!defaultInstance,
          hasConnectedInstances
        });
        return [];
      }
      
      console.log('🔍 useMessages - Fetching messages for conversation:', selectedConversation);
      console.log('📡 useMessages - Using instance:', defaultInstance.instanceName, defaultInstance.phoneNumber);
      
      try {
        // Buscar mensagens da Evolution API
        const evolutionResponse = await findMessages(
          defaultInstance.instanceName, 
          selectedConversation, 
          50, 
          0
        );
        
        console.log('📝 useMessages - Evolution API response:', { 
          messagesCount: evolutionResponse.messages?.length || 0
        });

        // Converter mensagens da Evolution para formato unificado
        const unifiedMessages = evolutionResponse.messages?.map(msg => 
          convertEvolutionMessageToUnified(msg, defaultInstance.phoneNumber || '')
        ) || [];

        // Ordenar por timestamp (mais antigo primeiro)
        unifiedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        console.log('✅ useMessages - Messages processed:', unifiedMessages.length);
        return unifiedMessages;
      } catch (error) {
        console.error('❌ useMessages - Evolution API error:', error);
        throw error;
      }
    },
    enabled: !!selectedConversation && hasConnectedInstances && !!defaultInstance,
    refetchInterval: 15000, // Atualizar a cada 15 segundos
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
    defaultInstance,
    hasConnectedInstances,
  };
};
