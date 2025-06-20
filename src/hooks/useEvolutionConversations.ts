import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { findChats, convertChatsToConversations, sendTextMessage } from '@/services/evolution/messageApi';
import { useEvolutionInstances } from '@/hooks/useEvolutionInstances';
import { useToast } from '@/hooks/use-toast';
import type { EvolutionConversation } from '@/services/evolution/types';
import type { SectorType, StatusType } from '@/types/dashboard';

export const useEvolutionConversations = (selectedSector: SectorType, selectedStatus: StatusType) => {
  const { defaultInstance, hasConnectedInstances } = useEvolutionInstances();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('🔍 useEvolutionConversations - Initialized with:', { 
    selectedSector, 
    selectedStatus, 
    defaultInstance: defaultInstance?.instanceName,
    hasConnectedInstances
  });

  const { 
    data: conversations = [], 
    isLoading: conversationsLoading, 
    error: conversationsError 
  } = useQuery({
    queryKey: ['evolution-conversations', selectedSector, selectedStatus, defaultInstance?.instanceName],
    queryFn: async (): Promise<EvolutionConversation[]> => {
      if (!defaultInstance || !hasConnectedInstances) {
        console.log('⚠️ useEvolutionConversations - No connected instances available');
        return [];
      }

      console.log('📊 useEvolutionConversations - Fetching chats for instance:', defaultInstance.instanceName);
      
      try {
        // Buscar chats da instância
        const chats = await findChats(defaultInstance.instanceName);
        
        // Converter para formato de conversas
        const evolutionConversations = convertChatsToConversations(
          chats, 
          defaultInstance.instanceName,
          defaultInstance.phoneNumber || ''
        );

        console.log('✅ useEvolutionConversations - Conversations fetched:', evolutionConversations.length);

        // Aplicar filtros
        let filteredConversations = evolutionConversations;

        if (selectedSector !== 'all') {
          filteredConversations = filteredConversations.filter(c => c.sector === selectedSector);
          console.log('🔽 Filtering by sector:', selectedSector, '- Result:', filteredConversations.length);
        }

        if (selectedStatus !== 'all') {
          filteredConversations = filteredConversations.filter(c => c.status === selectedStatus);
          console.log('🔽 Filtering by status:', selectedStatus, '- Result:', filteredConversations.length);
        }

        // Ordenar por última mensagem
        filteredConversations.sort((a, b) => 
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );

        return filteredConversations;
      } catch (error) {
        console.error('❌ useEvolutionConversations - Error fetching conversations:', error);
        throw error;
      }
    },
    enabled: hasConnectedInstances && !!defaultInstance,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    retry: (failureCount, error: any) => {
      console.log(`🔄 useEvolutionConversations - Retry attempt ${failureCount}:`, error?.message);
      return failureCount < 2;
    },
  });

  // Log conversations error if exists
  if (conversationsError) {
    console.error('❌ useEvolutionConversations - Conversations error:', conversationsError);
  }

  // Get conversation counts
  const conversationCounts = {
    new: conversations.filter(c => c.status === 'new').length,
    in_progress: conversations.filter(c => c.status === 'in_progress').length,
    finished: conversations.filter(c => c.status === 'finished').length,
  };

  console.log('📈 useEvolutionConversations - Conversation counts:', conversationCounts);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!defaultInstance) {
        throw new Error('Nenhuma instância conectada disponível');
      }

      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) {
        throw new Error('Conversa não encontrada');
      }

      console.log('📤 Sending message via Evolution API:', {
        instanceName: defaultInstance.instanceName,
        remoteJid: conversationId,
        content
      });

      // Enviar mensagem via Evolution API
      const response = await sendTextMessage(
        defaultInstance.instanceName, 
        conversation.client_phone, 
        content
      );

      console.log('✅ Message sent successfully via Evolution API');
      return response;
    },
    onSuccess: () => {
      // Invalidar queries para atualizar a interface
      queryClient.invalidateQueries({ queryKey: ['evolution-messages'] });
      queryClient.invalidateQueries({ queryKey: ['evolution-conversations'] });
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso via Evolution API.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Error sending message via Evolution API:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Erro desconhecido ao enviar mensagem",
        variant: "destructive",
      });
    },
  });

  return {
    conversations,
    conversationsLoading,
    conversationCounts,
    sendMessageMutation,
    defaultInstance,
    hasConnectedInstances,
    conversationsError,
  };
}; 