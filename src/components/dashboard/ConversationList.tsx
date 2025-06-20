import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Conversation {
  id: string;
  client_name: string | null;
  client_phone: string;
  sector: string;
  status: string;
  last_message_at: string;
  assigned_to: string | null;
  // ⭐ NOVOS CAMPOS
  last_message_content?: string;
  total_messages?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  searchTerm,
  onSearchChange,
}: ConversationListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'finished':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Nova';
      case 'in_progress':
        return 'Em andamento';
      case 'finished':
        return 'Finalizada';
      default:
        return status;
    }
  };

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case 'support':
        return 'bg-blue-100 text-blue-800';
      case 'financial':
        return 'bg-purple-100 text-purple-800';
      case 'sales':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSectorLabel = (sector: string) => {
    switch (sector) {
      case 'support':
        return 'Suporte';
      case 'financial':
        return 'Financeiro';
      case 'sales':
        return 'Vendas';
      default:
        return sector;
    }
  };

  // ⭐ FUNÇÃO PARA TRUNCAR MENSAGEM (IGUAL WHATSAPP)
  const truncateMessage = (message: string | null | undefined, maxLength: number = 35) => {
    if (!message) return 'Nenhuma mensagem';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.client_phone.includes(searchTerm)
  );

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Nenhuma conversa encontrada
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation === conversation.id ? 'bg-green-50 border-green-200' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-green-100 text-green-600">
                    {conversation.client_name?.charAt(0) || conversation.client_phone.slice(-2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.client_name || 'Cliente'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.client_phone}
                  </p>
                  
                  {/* ⭐ NOVA SEÇÃO: ÚLTIMA MENSAGEM + CONTADOR */}
                  <div className="flex items-center justify-between mt-1 mb-2">
                    <p className="text-xs text-gray-600 truncate flex-1 pr-2">
                      {truncateMessage(conversation.last_message_content)}
                    </p>
                    {conversation.total_messages && conversation.total_messages > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                        <MessageCircle className="h-3 w-3" />
                        <span>{conversation.total_messages}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`text-xs ${getSectorColor(conversation.sector)}`}
                    >
                      {getSectorLabel(conversation.sector)}
                    </Badge>
                    <Badge 
                      className={`text-xs ${getStatusColor(conversation.status)}`}
                    >
                      {getStatusLabel(conversation.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
