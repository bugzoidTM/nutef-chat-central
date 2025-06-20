import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useMessagesConfig } from '@/hooks/useMessagesConfig';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import Sidebar from './Sidebar';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';
import { MessageSourceSelector } from './MessageSourceSelector';
import type { SectorType, StatusType } from '@/types/dashboard';

const Dashboard = () => {
  const { profile } = useAuth();
  
  const [selectedSector, setSelectedSector] = useState<SectorType>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Configuração da fonte de mensagens
  const { config, isEvolutionMode } = useMessagesConfig();

  // Custom hooks
  const { conversations, conversationCounts, sendMessageMutation } = useConversations(selectedSector, selectedStatus);
  
  // Usar o hook de mensagens com configuração dinâmica
  const { messages, messagesLoading } = useMessages(selectedConversation, {
    source: config.source,
    instanceName: config.instanceName,
    instancePhone: config.instancePhone,
  });
  
  useRealtimeSubscriptions();

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
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header da lista de conversas com seletor de fonte */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
              <MessageSourceSelector />
            </div>
            
            {/* Indicador da fonte ativa */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {isEvolutionMode ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Evolution API ({config.instanceName})</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Banco de Dados</span>
                </>
              )}
            </div>
          </div>
          
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
        
        <ChatArea
          conversation={selectedConversationData || null}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={sendMessageMutation.isPending || messagesLoading}
        />
      </div>
    </div>
  );
};

export default Dashboard;
