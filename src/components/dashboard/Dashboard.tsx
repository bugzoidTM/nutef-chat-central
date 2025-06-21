
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';
import type { SectorType, StatusType } from '@/types/dashboard';

const Dashboard = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedSector, setSelectedSector] = useState<SectorType>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Custom hooks
  const { conversations, conversationCounts, sendMessageMutation } = useConversations(selectedSector, selectedStatus);
  const { messages } = useMessages(selectedConversation);
  useRealtimeSubscriptions();

  // ⭐ Função para atualizar o status da conversa quando selecionada
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
    
    // ⭐ Debug específico para Nutef
    if (selectedConv?.client_phone?.includes('551193247')) {
      console.log('🎯 DEBUG NUTEF - Clicou na conversa:', {
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
        
        // ⭐ Atualização otimista primeiro - zerar contador imediatamente na UI
        queryClient.setQueryData(['conversations', selectedSector, selectedStatus], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((conv: any) => 
            conv.id === conversationId 
              ? { ...conv, unread_messages: 0 }
              : conv
          );
        });

        const { data: updatedMessages, error: readError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', conversationId)
          .eq('direction', 'incoming')
          .eq('is_read', false)
          .select('id, content, is_read');

        console.log('📊 Resultado da atualização:', {
          error: readError,
          updatedCount: updatedMessages?.length || 0,
          updatedMessages: updatedMessages
        });

        if (readError) {
          console.error('❌ Erro ao marcar mensagens como lidas:', readError);
          // ⭐ Reverter a atualização otimista em caso de erro
          queryClient.invalidateQueries({ queryKey: ['conversations', selectedSector, selectedStatus] });
        } else {
          console.log('✅ Mensagens marcadas como lidas:', updatedMessages?.length || 0, 'mensagens');
          
          // ⭐ Debug específico para Nutef
          if (selectedConv?.client_phone?.includes('551193247')) {
            console.log('🎯 DEBUG NUTEF - Mensagens atualizadas:', updatedMessages);
          }
          
          // ⭐ Invalidar queries relacionadas para sincronizar dados
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['message-counts'] }),
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
          ]);
          
          console.log('✅ Queries invalidadas');
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

  const handleSendMessage = (content: string) => {
    if (selectedConversation) {
      sendMessageMutation.mutate({
        conversationId: selectedConversation,
        content,
      });
    }
  };

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <Sidebar
        selectedSector={selectedSector}
        selectedStatus={selectedStatus}
        onSectorChange={setSelectedSector}
        onStatusChange={setSelectedStatus}
        conversationCounts={conversationCounts}
      />
      
      <div className="flex-1 flex">
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        <ChatArea
          conversation={selectedConversationData || null}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
};

export default Dashboard;
