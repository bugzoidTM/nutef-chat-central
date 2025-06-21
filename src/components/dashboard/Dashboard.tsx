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
    setSelectedConversation(conversationId);
    
    // Encontrar a conversa selecionada
    const selectedConv = conversations.find(c => c.id === conversationId);
    
    // Se a conversa for nova, mudar para "em andamento"
    if (selectedConv && selectedConv.status === 'new') {
      try {
        console.log('🔄 Atualizando status da conversa de "new" para "in_progress"');
        
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
        } else {
          console.log('✅ Status da conversa atualizado com sucesso');
          
          // ⭐ Invalidar queries para atualizar a UI imediatamente
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['last-messages'] });
          queryClient.invalidateQueries({ queryKey: ['message-counts'] });
        }
      } catch (error) {
        console.error('❌ Erro ao atualizar conversa:', error);
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
