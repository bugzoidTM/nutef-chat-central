
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Conversation {
  id: string;
  client_name: string | null;
  client_phone: string;
  sector: string;
  status: string;
  last_message_at: string;
  assigned_to: string | null;
  last_message_content?: string;
  unread_messages?: number;
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
        return 'bg-red-100 text-red-700 border-red-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'finished':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'financial':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'sales':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Conversas</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`
                  p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200
                  ${selectedConversation === conversation.id 
                    ? 'bg-green-50 border-r-4 border-green-500 shadow-sm' 
                    : 'hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-green-100 text-green-600 text-sm font-medium">
                      {conversation.client_name?.charAt(0)?.toUpperCase() || 
                       conversation.client_phone.slice(-2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.client_name || 'Cliente'}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 ml-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(conversation.last_message_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {conversation.client_phone}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-600 truncate flex-1 pr-2">
                        {truncateMessage(conversation.last_message_content)}
                      </p>
                      {conversation.unread_messages && conversation.unread_messages > 0 && (
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[24px] text-center flex-shrink-0 font-medium">
                          {conversation.unread_messages > 99 ? '99+' : conversation.unread_messages}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs px-2 py-1 border ${getSectorColor(conversation.sector)}`}>
                        {getSectorLabel(conversation.sector)}
                      </Badge>
                      <Badge className={`text-xs px-2 py-1 border ${getStatusColor(conversation.status)}`}>
                        {getStatusLabel(conversation.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
