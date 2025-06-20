import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEvolutionConversations } from '@/hooks/useEvolutionConversations';
import { useEvolutionInstances } from '@/hooks/useEvolutionInstances';
import { useMessages } from '@/hooks/useMessages';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import Sidebar from './Sidebar';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import type { SectorType, StatusType } from '@/types/dashboard';

const Dashboard = () => {
  const { profile } = useAuth();
  
  const [selectedSector, setSelectedSector] = useState<SectorType>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks da Evolution API
  const { 
    instances, 
    defaultInstance, 
    hasConnectedInstances, 
    isLoading: instancesLoading,
    stats: instanceStats 
  } = useEvolutionInstances();
  
  const { 
    conversations, 
    conversationCounts, 
    sendMessageMutation,
    conversationsLoading,
    conversationsError
  } = useEvolutionConversations(selectedSector, selectedStatus);
  
  const { 
    messages, 
    messagesLoading, 
    messagesError 
  } = useMessages(selectedConversation);
  
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

  // Loading state para instâncias
  if (instancesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando com Evolution API...</p>
          <p className="text-sm text-gray-500 mt-2">Buscando instâncias disponíveis</p>
        </div>
      </div>
    );
  }

  // Estado sem instâncias conectadas
  if (!hasConnectedInstances) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Nenhuma Instância Conectada
          </h2>
          <p className="text-gray-600 mb-6">
            Não foi possível encontrar nenhuma instância da Evolution API conectada e funcionando.
          </p>
          
          <Alert className="text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Verifique:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Se a Evolution API está rodando</li>
                <li>• Se pelo menos uma instância está conectada</li>
                <li>• Se as variáveis de ambiente estão configuradas</li>
                <li>• Se a API key está correta</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          {instances.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Instâncias encontradas:</strong> {instances.length}<br />
                <strong>Conectadas:</strong> {instanceStats.connected}<br />
                <strong>Desconectadas:</strong> {instanceStats.disconnected}
              </p>
            </div>
          )}
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
          {/* Header da lista de conversas com informações da instância */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Conversas</h2>
              <div className="flex items-center gap-2 text-xs">
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600 font-medium">Evolution API</span>
              </div>
            </div>
            
            {/* Informações da instância ativa */}
            {defaultInstance && (
              <div className="flex flex-col gap-1 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{defaultInstance.instanceName}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    {defaultInstance.connectionState}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{defaultInstance.phoneNumber}</span>
                  <span className="text-gray-500">{defaultInstance.profileName}</span>
                </div>
              </div>
            )}

            {/* Indicador de erro se houver */}
            {conversationsError && (
              <Alert className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Erro ao carregar conversas: {conversationsError.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            isLoading={conversationsLoading}
          />
        </div>
        
        <ChatArea
          conversation={selectedConversationData || null}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={sendMessageMutation.isPending || messagesLoading}
          messagesError={messagesError}
        />
      </div>
    </div>
  );
};

export default Dashboard;
