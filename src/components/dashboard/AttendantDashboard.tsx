
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useConversationSelection } from '@/hooks/useConversationSelection';
import { useChatbotIntegration } from '@/hooks/useChatbotIntegration';
import ConversationList from './ConversationList';
import { ChatArea } from './ChatArea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, PanelLeftOpen, Clock, CheckCircle } from 'lucide-react';
import type { SectorType, StatusType } from '@/types/dashboard';

export const AttendantDashboard = () => {
  const { profile } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);

  // Atendentes só veem conversas do seu setor
  const sectorType = 'all' as SectorType; // Will be filtered by RLS
  const { conversations, conversationsLoading } = useConversations(sectorType, selectedStatus);
  const { selectedConversation, handleSelectConversation } = useConversationSelection(conversations, sectorType, selectedStatus);
  
  // Initialize chatbot integration
  useChatbotIntegration();

  const handleConversationSelect = (conversationId: string) => {
    console.log('🚀 AttendantDashboard - Selecionando conversa:', conversationId);
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      console.log('✅ AttendantDashboard - Conversa encontrada:', conversation);
      handleSelectConversation(conversationId);
    } else {
      console.error('❌ AttendantDashboard - Conversa não encontrada:', conversationId);
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
  
  // Filter conversations by status for stats
  const newConversations = conversations.filter(c => c.status === 'new').length;
  const inProgressConversations = conversations.filter(c => c.status === 'in_progress').length;
  const finishedConversations = conversations.filter(c => c.status === 'finished').length;

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
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Olá, {profile?.nickname || profile?.name}!
            </h1>
            <p className="text-sm text-gray-500">Atendimento</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              {newConversations} Novas
            </Badge>
            <Badge variant="default" className="text-xs">
              {inProgressConversations} Em Andamento
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {finishedConversations} Finalizadas
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <div className={`
          bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out
          ${leftSidebarOpen ? 'w-80' : 'w-0'}
          overflow-hidden
        `}>
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">Suas Conversas</h2>
            
            {/* Status Filters */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('all')}
                className="text-xs"
              >
                Todas ({conversations.length})
              </Button>
              <Button
                variant={selectedStatus === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('new')}
                className="text-xs"
              >
                <Clock className="h-3 w-3 mr-1" />
                Novas ({newConversations})
              </Button>
              <Button
                variant={selectedStatus === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('in_progress')}
                className="text-xs"
              >
                Em Andamento ({inProgressConversations})
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleConversationSelect}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
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
                
                {newConversations > 0 && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-orange-700">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        {newConversations} conversa{newConversations > 1 ? 's' : ''} aguardando atendimento
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
