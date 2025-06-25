
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { 
  ChatbotKnowledge, 
  ChatbotConfig, 
  ChatbotInteraction,
  ConversationContext,
  CreateKnowledgeData, 
  UpdateKnowledgeData,
  UpdateConfigData,
  ChatbotResponse
} from '@/types/chatbot';

export const useChatbot = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chatbot knowledge base
  const { data: knowledge = [], isLoading: isLoadingKnowledge } = useQuery({
    queryKey: ['chatbot-knowledge'],
    queryFn: async () => {
      console.log('🤖 Fetching chatbot knowledge...');
      
      const { data, error } = await supabase
        .from('chatbot_knowledge')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('❌ Error fetching knowledge:', error);
        throw error;
      }

      console.log('✅ Knowledge fetched:', data?.length || 0);
      return data as ChatbotKnowledge[];
    },
  });

  // Fetch chatbot configurations
  const { data: configs = [], isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['chatbot-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_configs')
        .select('*, sectors(name)')
        .order('created_at');

      if (error) throw error;
      return data as ChatbotConfig[];
    },
  });

  // Check if chatbot is active for a sector
  const checkChatbotActive = async (sectorId: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('is_chatbot_active', {
      p_sector_id: sectorId
    });

    if (error) {
      console.error('Error checking chatbot status:', error);
      return false;
    }

    return data || false;
  };

  // Find chatbot response
  const findChatbotResponse = async (userInput: string, sectorId: string): Promise<ChatbotResponse | null> => {
    const { data, error } = await supabase.rpc('find_chatbot_response', {
      p_user_input: userInput,
      p_sector_id: sectorId
    });

    if (error) {
      console.error('Error finding chatbot response:', error);
      return null;
    }

    return data?.[0] || null;
  };

  // Create knowledge entry
  const createKnowledge = useMutation({
    mutationFn: async (knowledgeData: CreateKnowledgeData) => {
      const { data, error } = await supabase
        .from('chatbot_knowledge')
        .insert({
          ...knowledgeData,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-knowledge'] });
      toast({
        title: "Conhecimento adicionado",
        description: "Nova entrada foi adicionada à base de conhecimento do chatbot.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar conhecimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update knowledge entry
  const updateKnowledge = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateKnowledgeData }) => {
      const { error } = await supabase
        .from('chatbot_knowledge')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-knowledge'] });
      toast({
        title: "Conhecimento atualizado",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar conhecimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete knowledge entry
  const deleteKnowledge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chatbot_knowledge')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-knowledge'] });
      toast({
        title: "Conhecimento removido",
        description: "A entrada foi removida da base de conhecimento.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover conhecimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update chatbot config
  const updateConfig = useMutation({
    mutationFn: async ({ sectorId, data }: { sectorId: string; data: UpdateConfigData }) => {
      const { error } = await supabase
        .from('chatbot_configs')
        .update(data)
        .eq('sector_id', sectorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-configs'] });
      toast({
        title: "Configuração atualizada",
        description: "As configurações do chatbot foram salvas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Record chatbot interaction
  const recordInteraction = useMutation({
    mutationFn: async (interaction: Omit<ChatbotInteraction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('chatbot_interactions')
        .insert(interaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Get conversation context
  const { data: getConversationContext } = useQuery({
    queryKey: ['conversation-context'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_context')
        .select('*');

      if (error) throw error;
      return data as ConversationContext[];
    },
  });

  // Update conversation context
  const updateConversationContext = useMutation({
    mutationFn: async ({ conversationId, context }: { 
      conversationId: string; 
      context: Partial<ConversationContext> 
    }) => {
      const { data, error } = await supabase
        .from('conversation_context')
        .upsert({
          conversation_id: conversationId,
          ...context,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  return {
    knowledge,
    configs,
    isLoadingKnowledge,
    isLoadingConfigs,
    checkChatbotActive,
    findChatbotResponse,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
    updateConfig,
    recordInteraction,
    getConversationContext,
    updateConversationContext,
  };
};
