
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ConversationList from './ConversationList';
import { ChatArea } from './ChatArea';
import { QueueManagement } from './QueueManagement';
import { useConversations } from '@/hooks/useConversations';
import { useConversationSelection } from '@/hooks/useConversationSelection';
import { useChatbotIntegration } from '@/hooks/useChatbotIntegration';
import { MessageSquare } from 'lucide-react';
import type { Conversation } from '@/types/dashboard';

export const Dashboard = () => {
  const { conversations, conversationsLoading } = useConversations('all', 'all');
  const { selectedConversation, handleSelectConversation } = useConversationSelection(conversations, 'all', 'all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize chatbot integration
  useChatbotIntegration();

  const handleConversationSelect = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      handleSelectConversation(conversationId);
    }
  };

  if (conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleConversationSelect}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversationData ? (
            <ChatArea conversation={selectedConversationData} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
                <p className="text-muted-foreground">
                  Escolha uma conversa da lista à esquerda para começar a atender
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Queue Management */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <QueueManagement />
        </div>
      </div>
    </div>
  );
};
