
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      {/* Left Sidebar - Conversations and Queue */}
      <div className="w-80 flex flex-col gap-4">
        <QueueManagement />
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleConversationSelect}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Main Chat Area */}
      {selectedConversationData ? (
        <ChatArea conversation={selectedConversationData} />
      ) : (
        <Card className="flex-1">
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
              <p className="text-muted-foreground">
                Escolha uma conversa da lista à esquerda para começar a atender
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
