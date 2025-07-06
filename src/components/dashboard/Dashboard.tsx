
import React, { useState } from 'react';
import ConversationList from './ConversationList';
import { ChatArea } from './ChatArea';
import QueueManagement from './QueueManagement';
import { useConversations } from '@/hooks/useConversations';
import { useConversationSelection } from '@/hooks/useConversationSelection';
import { useChatbotIntegration } from '@/hooks/useChatbotIntegration';
import { MessageSquare, Menu, X, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
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
    console.log('🚀 Dashboard - Selecionando conversa:', conversationId);
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      console.log('✅ Dashboard - Conversa encontrada:', conversation);
      handleSelectConversation(conversationId);
    } else {
      console.error('❌ Dashboard - Conversa não encontrada:', conversationId);
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-2"
          >
            <PanelLeftOpen className={`h-4 w-4 transition-transform ${leftSidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className="p-2"
        >
          <PanelRightOpen className={`h-4 w-4 transition-transform ${rightSidebarOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <div className={`
          bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out
          ${leftSidebarOpen ? 'w-80' : 'w-0'}
          overflow-hidden
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
        <div className="flex-1 min-w-0 flex flex-col bg-white">
          {selectedConversationData ? (
            <ChatArea conversation={selectedConversationData} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <MessageSquare className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Selecione uma conversa</h3>
                <p className="text-gray-500 leading-relaxed">
                  Escolha uma conversa da lista à esquerda para começar a atender
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Queue Management */}
        <div className={`
          bg-white border-l border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out
          ${rightSidebarOpen ? 'w-80' : 'w-0'}
          overflow-hidden
        `}>
          <QueueManagement />
        </div>
      </div>
    </div>
  );
};
