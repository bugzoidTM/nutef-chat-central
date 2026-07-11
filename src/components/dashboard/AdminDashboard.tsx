
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useConversationSelection } from '@/hooks/useConversationSelection';
import { useChatbotIntegration } from '@/hooks/useChatbotIntegration';
import ConversationList from './ConversationList';
import { ChatArea } from './ChatArea';
import QueueManagement from './QueueManagement';
import AttendantManagement from './admin/AttendantManagement';
import { CrmBoard } from '@/components/crm/CrmBoard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, BarChart3, Settings, PanelLeftOpen, PanelRightOpen, KanbanSquare, Archive, Trash2, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { invokeFn } from '@/lib/invokeFn';
import { toast } from 'sonner';
import type { SectorType, StatusType } from '@/types/dashboard';

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const [selectedSector, setSelectedSector] = useState<SectorType>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('conversations');

  const [deletingArchived, setDeletingArchived] = useState(false);
  const queryClient = useQueryClient();

  const { conversations, conversationsLoading } = useConversations(selectedSector, selectedStatus);
  const { selectedConversation, handleSelectConversation } = useConversationSelection(conversations, selectedSector, selectedStatus);

  const showingArchived = selectedStatus === 'archived';

  const handleDeleteArchived = async () => {
    if (!window.confirm('Excluir DEFINITIVAMENTE todas as conversas arquivadas e suas mensagens? Esta ação não pode ser desfeita.')) return;
    setDeletingArchived(true);
    try {
      const { data, error } = await invokeFn<{ deleted: number }>('delete-archived', {});
      if (error) throw error;
      toast.success(`${data?.deleted ?? 0} conversas arquivadas excluídas.`);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
    } catch (e: any) {
      toast.error(`Erro ao excluir arquivadas: ${e.message}`);
    } finally {
      setDeletingArchived(false);
    }
  };
  
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
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="conversations" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Conversas
                </TabsTrigger>
                <TabsTrigger value="crm" className="text-xs">
                  <KanbanSquare className="h-3 w-3 mr-1" />
                  CRM
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
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    variant={showingArchived ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setSelectedStatus(showingArchived ? 'all' : 'archived')}
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    {showingArchived ? 'Voltar às ativas' : 'Arquivadas'}
                  </Button>
                  {showingArchived && conversations.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="text-xs h-7"
                      onClick={handleDeleteArchived}
                      disabled={deletingArchived}
                    >
                      {deletingArchived
                        ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        : <Trash2 className="h-3 w-3 mr-1" />}
                      Excluir todas ({conversations.length})
                    </Button>
                  )}
                </div>
                <ConversationList
                  conversations={conversations}
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleConversationSelect}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </TabsContent>
              
              <TabsContent value="crm" className="h-full">
                <div className="text-center py-8">
                  <KanbanSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    Funil de vendas na área principal: arraste os cards entre as etapas e clique para etiquetas e notas
                  </p>
                </div>
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
          ) : activeTab === 'crm' ? (
            <CrmBoard onOpenConversation={handleConversationSelect} />
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
