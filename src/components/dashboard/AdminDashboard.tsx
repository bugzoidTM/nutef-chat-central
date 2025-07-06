
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useConversationSelection } from '@/hooks/useConversationSelection';
import { useChatbotIntegration } from '@/hooks/useChatbotIntegration';
import ConversationList from './ConversationList';
import { ChatArea } from './ChatArea';
import QueueManagement from './QueueManagement';
import AttendantManagement from './admin/AttendantManagement';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, BarChart3, Settings, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import type { SectorType, StatusType } from '@/types/dashboard';

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const [selectedSector, setSelectedSector] = useState<SectorType>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('conversations');

  const { conversations, conversationsLoading } = useConversations(selectedSector, selectedStatus);
  const { selectedConversation, handleSelectConversation } = useConversationSelection(conversations, selectedSector, selectedStatus);
  
  // Initialize chatbot integration
  useChatbotIntegration();

  const handleConversationSelect = (conversationId: string) => {
    console.log('🚀 AdminDashboard - Selecionando conversa:', conversationId);
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      console.log('✅ AdminDashboard - Conversa encontrada:', conversation);
      handleSelectConversation(conversationId);
      setActiveTab('conversations'); // Switch to conversations tab when selecting
    } else {
      console.error('❌ AdminDashboard - Conversa não encontrada:', conversationId);
    }
  };

  if (conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
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
          <h1 className="text-xl font-semibold text-gray-900">
            Painel Administrativo - {profile?.name}
          </h1>
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
        {/* Left Sidebar - Navigation */}
        <div className={`
          bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out
          ${leftSidebarOpen ? 'w-80' : 'w-0'}
          overflow-hidden
        `}>
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="conversations" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Conversas
                </TabsTrigger>
                <TabsTrigger value="attendants" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Atendentes
                </TabsTrigger>
                <TabsTrigger value="reports" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Relatórios
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="conversations" className="h-full">
                <ConversationList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleConversationSelect}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </TabsContent>
              
              <TabsContent value="attendants" className="h-full">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    Gestão de atendentes disponível na área principal
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="reports" className="h-full">
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    Relatórios em desenvolvimento
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col bg-white">
          {activeTab === 'conversations' && selectedConversationData ? (
            <ChatArea conversation={selectedConversationData} />
          ) : activeTab === 'attendants' ? (
            <AttendantManagement />
          ) : activeTab === 'conversations' ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <MessageSquare className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Selecione uma conversa</h3>
                <p className="text-gray-500 leading-relaxed">
                  Escolha uma conversa da lista à esquerda para começar a visualizar
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <Settings className="h-20 w-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-3 text-gray-700">Área em desenvolvimento</h3>
                <p className="text-gray-500 leading-relaxed">
                  Esta funcionalidade estará disponível em breve
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
