
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageCircle } from 'lucide-react';
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

  const truncateMessage = (message: string | null | undefined, maxLength: number = 30) => {
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
      <div className="p-3 border-b border-gray-200 bg-white flex-shrink-0">
        <h2 className="text-base font-semibold text-gray-900 mb-2">Conversas</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`
                  p-3 cursor-pointer hover:bg-gray-50 transition-colors
                  ${selectedConversation === conversation.id ? 'bg-green-50 border-r-4 border-green-500' : ''}
                `}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                      {conversation.client_name?.charAt(0) || conversation.client_phone.slice(-2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.client_name || 'Cliente'}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatDistanceToNow(new Date(conversation.last_message_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 truncate mb-1">
                      {conversation.client_phone}
                    </p>
                    
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-600 truncate flex-1 pr-2">
                        {truncateMessage(conversation.last_message_content)}
                      </p>
                      {conversation.unread_messages && conversation.unread_messages > 0 && (
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center flex-shrink-0">
                          {conversation.unread_messages}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge className={`text-xs ${getSectorColor(conversation.sector)}`}>
                        {getSectorLabel(conversation.sector)}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>
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
