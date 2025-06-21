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
  const { messages } = useMessages(selectedConversation); // Back to using Supabase messages
  useRealtimeSubscriptions();

  // ⭐ Função para atualizar o status da conversa quando selecionada
  const handleSelectConversation = async (conversationId: string) => {
    // ⭐ Primeiro seleciona a conversa imediatamente para mostrar o conteúdo
    setSelectedConversation(conversationId);
    
    // ⭐ Marcar todas as mensagens desta conversa como lidas
    try {
      console.log('📖 Marcando mensagens como lidas para conversa:', conversationId);
      
      // ⭐ Tentar marcar mensagens como lidas (se campo is_read existir)
      const { error: readError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('direction', 'incoming')
        .eq('is_read', false);

      if (readError) {
        if (readError.message.includes('is_read')) {
          console.log('⚠️ Campo is_read ainda não existe, usando fallback com localStorage');
          
          // ⭐ Fallback: buscar mensagens da conversa e marcar como lidas no localStorage
          const { data: messages, error: fetchError } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversationId)
            .eq('direction', 'incoming');

          if (!fetchError && messages) {
            // ⭐ Marcar mensagens como lidas no localStorage
            const readMessages = JSON.parse(localStorage.getItem('read_messages') || '[]');
            const messageIds = messages.map(msg => msg.id);
            const updatedReadMessages = [...new Set([...readMessages, ...messageIds])];
            localStorage.setItem('read_messages', JSON.stringify(updatedReadMessages));
            
            console.log('✅ Mensagens marcadas como lidas no localStorage');
            
            // ⭐ Invalidar query do contador para atualizar UI imediatamente
            queryClient.invalidateQueries({ queryKey: ['message-counts'] });
          }
        } else {
          console.error('❌ Erro ao marcar mensagens como lidas:', readError);
        }
      } else {
        console.log('✅ Mensagens marcadas como lidas');
        
        // ⭐ Invalidar query do contador para atualizar UI imediatamente
        queryClient.invalidateQueries({ queryKey: ['message-counts'] });
      }
    } catch (error) {
      console.error('❌ Erro ao marcar mensagens como lidas:', error);
    }
    
    // Encontrar a conversa selecionada
    const selectedConv = conversations.find(c => c.id === conversationId);
    
    // Se a conversa for nova, mudar para "em andamento" de forma assíncrona
    if (selectedConv && selectedConv.status === 'new') {
      try {
        console.log('🔄 Atualizando status da conversa de "new" para "in_progress"');
        
        // ⭐ Atualização otimista - atualiza a UI primeiro
        queryClient.setQueryData(['conversations', selectedSector, selectedStatus], (oldData: any[]) => {
          if (!oldData) return oldData;
          return oldData.map(conv => 
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
