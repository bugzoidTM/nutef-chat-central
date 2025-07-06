
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import * as evolutionApi from '@/services/evolutionApi';

export const useSendMessage = (conversations: any[]) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
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

      // ⭐ Obter setor do usuário para adicionar no prefixo da mensagem
      let userSectorName = 'Suporte'; // default
      if (profile && profile.sector_id) {
        try {
          const { data: sectorData } = await supabase
            .from('sectors')
            .select('name')
            .eq('id', profile.sector_id)
            .single();
          
          if (sectorData) {
            userSectorName = sectorData.name;
          }
        } catch (error) {
          console.log('⚠️ Não foi possível obter setor do atendente, usando padrão');
        }
      }

      // ⭐ Usar nickname se disponível, senão usar nome completo
      const senderName = profile?.nickname || profile?.name || 'Atendente';
      const messageWithPrefix = `*${senderName} (${userSectorName})*:\n${content}`;

      // Send message via Evolution API
      try {
        console.log('📤 Sending message via Evolution API:', { 
          instanceName: instance.instance_name, 
          number: conversation.client_phone, 
          text: messageWithPrefix 
        });
        
        await evolutionApi.sendTextMessage(instance.instance_name, conversation.client_phone, messageWithPrefix);
        console.log('✅ Message sent successfully via Evolution API');

        // Insert the outgoing message into Supabase
        const now = new Date();
        // Adicionar 1 segundo para garantir que mensagens enviadas apareçam após as recebidas
        const messageTimestamp = new Date(now.getTime() + 1000).toISOString();
        
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: content,
            direction: 'outgoing',
            from_phone: instance.phone,
            to_phone: conversation.client_phone,
            message_type: 'text',
            timestamp: messageTimestamp,
            is_read: true,
            // ⭐ Usar nickname se disponível
            sender_name: senderName,
            sender_sector: userSectorName,
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
};
