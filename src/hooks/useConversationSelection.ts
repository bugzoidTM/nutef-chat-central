
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { SectorType, StatusType } from '@/types/dashboard';

export const useConversationSelection = (
  conversations: any[],
  selectedSector: SectorType,
  selectedStatus: StatusType
) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const handleSelectConversation = async (conversationId: string) => {
    console.log('🚀 CLIQUE DETECTADO - handleSelectConversation chamada para:', conversationId);
    
    // ⭐ Primeiro seleciona a conversa imediatamente para mostrar o conteúdo
    setSelectedConversation(conversationId);
    
    // ⭐ Encontrar a conversa selecionada
    const selectedConv = conversations.find(c => c.id === conversationId);
    
    console.log('🎯 Conversa selecionada encontrada:', {
      id: conversationId,
      phone: selectedConv?.client_phone,
      status: selectedConv?.status,
      unreadMessages: selectedConv?.unread_messages
    });
    
    // ⭐ Debug específico para a conversa atual
    if (selectedConv?.client_phone?.includes('5511964982174')) {
      console.log('🎯 DEBUG CAROLINE - Clicou na conversa:', {
        id: conversationId,
        phone: selectedConv.client_phone,
        status: selectedConv.status,
        unreadMessages: selectedConv.unread_messages
      });
    }
    
    // ⭐ Só marcar mensagens como lidas se houver mensagens não lidas
    if (selectedConv && selectedConv.unread_messages && selectedConv.unread_messages > 0) {
      try {
        console.log('📖 INICIANDO processo de marcar mensagens como lidas...');
        console.log('📖 Conversação ID:', conversationId);
        console.log('📖 Mensagens não lidas:', selectedConv.unread_messages);
        
        // ⭐ CORREÇÃO CRÍTICA: Usar query mais direta para buscar mensagens não lidas
        const { data: unreadMessages, error: checkError } = await supabase
          .from('messages')
          .select('id, content, is_read, direction, timestamp')
          .eq('conversation_id', conversationId)
          .eq('direction', 'incoming')
          .eq('is_read', false)
          .order('timestamp', { ascending: false });

        console.log('🔍 Mensagens não lidas encontradas:', {
          total: unreadMessages?.length || 0,
          error: checkError,
          messages: unreadMessages?.slice(0, 3).map(m => ({
            id: m.id,
            content: m.content?.substring(0, 30),
            is_read: m.is_read
          }))
        });

        if (checkError) {
          console.error('❌ Erro ao buscar mensagens não lidas:', checkError);
          return;
        }

        if (!unreadMessages || unreadMessages.length === 0) {
          console.log('⚠️ AVISO: Não há mensagens não lidas reais, mas contador mostra:', selectedConv.unread_messages);
          // ⭐ Forçar atualização das queries para sincronizar dados
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['message-counts'] }),
            queryClient.invalidateQueries({ queryKey: ['conversations', selectedSector, selectedStatus] }),
            queryClient.invalidateQueries({ queryKey: ['last-messages'] })
          ]);
          return;
        }
        
        // ⭐ Atualização otimista primeiro - zerar contador imediatamente na UI
        queryClient.setQueryData(['conversations', selectedSector, selectedStatus], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((conv: any) => 
            conv.id === conversationId 
              ? { ...conv, unread_messages: 0 }
              : conv
          );
        });

        // ⭐ CORREÇÃO CRÍTICA: Atualizar usando query mais específica
        const messageIds = unreadMessages.map(m => m.id);
        console.log('📊 IDs das mensagens a serem marcadas como lidas:', messageIds);

        const { data: updatedMessages, error: readError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .eq('direction', 'incoming')
          .eq('is_read', false)
          .select('id, content, is_read, conversation_id');

        console.log('📊 Resultado da atualização:', {
          error: readError,
          updatedCount: updatedMessages?.length || 0,
          updatedMessages: updatedMessages?.slice(0, 3)
        });

        if (readError) {
          console.error('❌ Erro ao marcar mensagens como lidas:', readError);
          // ⭐ Reverter a atualização otimista em caso de erro
          queryClient.invalidateQueries({ queryKey: ['conversations', selectedSector, selectedStatus] });
        } else {
          console.log('✅ Mensagens marcadas como lidas:', updatedMessages?.length || 0, 'mensagens');
          
          // ⭐ Debug específico para Caroline
          if (selectedConv?.client_phone?.includes('5511964982174')) {
            console.log('🎯 DEBUG CAROLINE - Mensagens atualizadas:', updatedMessages);
          }
          
          // ⭐ Invalidar queries relacionadas para sincronizar dados
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['message-counts'] }),
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
            queryClient.invalidateQueries({ queryKey: ['last-messages'] })
          ]);
          
          console.log('✅ Queries invalidadas - contador deve zerar');
        }
      } catch (error) {
        console.error('❌ Erro CRÍTICO ao marcar mensagens como lidas:', error);
        // ⭐ Reverter a atualização otimista em caso de erro crítico
        queryClient.invalidateQueries({ queryKey: ['conversations', selectedSector, selectedStatus] });
      }
    } else {
      console.log('📖 Não há mensagens não lidas para marcar');
    }
    
    // Se a conversa for nova, mudar para "em andamento" de forma assíncrona
    if (selectedConv && selectedConv.status === 'new') {
      try {
        console.log('🔄 Atualizando status da conversa de "new" para "in_progress"');
        
        // ⭐ Atualização otimista - atualiza a UI primeiro
        queryClient.setQueryData(['conversations', selectedSector, selectedStatus], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((conv: any) => 
            conv.id === conversationId 
              ? { ...conv, status: 'in_progress', assigned_to: profile?.id }
              : conv
          );
        });
        
        // Depois atualiza no banco de dados
        const { error } = await supabase
          .from('conversations')
          .update({ 
            status: 'in_progress',
            assigned_to: profile?.id,
            last_message_at: new Date().toISOString(),
          })
          .eq('id', conversationId);

        if (error) {
          console.error('❌ Erro ao atualizar status da conversa:', error);
          // ⭐ Se houve erro, reverte a atualização otimista
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        } else {
          console.log('✅ Status da conversa atualizado com sucesso');
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar conversa:', error);
        // ⭐ Se houve erro, reverte a atualização otimista
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    }
  };

  return {
    selectedConversation,
    handleSelectConversation
  };
};
