
import React, { useState } from 'react';
import ConversationList from './ConversationList';
import { ChatArea } from './ChatArea';
import { QueueManagement } from './QueueManagement';
import { useConversations } from '@/hooks/useConversations';
import { useConversationSelection } from '@/hooks/useConversationSelection';
import { useChatbotIntegration } from '@/hooks/useChatbotIntegration';
import { MessageSquare, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Conversation } from '@/types/dashboard';

export const Dashboard = () => {
  const { conversations, conversationsLoading } = useConversations('all', 'all');
  const { selectedConversation, handleSelectConversation } = useConversationSelection(conversations, 'all', 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
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
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Header with controls */}
      <div className="h-12 bg-white border-b border-gray-200 px-4 flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="lg:hidden"
          >
            {rightSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <div className={`
          bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out
          ${leftSidebarOpen ? 'w-80' : 'w-0 lg:w-80'}
          ${leftSidebarOpen ? 'block' : 'hidden lg:block'}
        `}>
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleConversationSelect}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 min-w-0 flex flex-col">
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
        <div className={`
          bg-white border-l border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out
          ${rightSidebarOpen ? 'w-80' : 'w-0 lg:w-80'}
          ${rightSidebarOpen ? 'block' : 'hidden lg:block'}
        `}>
          <QueueManagement />
        </div>
      </div>
    </div>
  );
};
