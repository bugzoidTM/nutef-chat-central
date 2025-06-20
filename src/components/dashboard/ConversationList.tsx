import React from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Users, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { EvolutionConversation } from '@/services/evolution/types';

interface ConversationListProps {
  conversations: EvolutionConversation[];
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isLoading?: boolean;
}

const ConversationList = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  searchTerm,
  onSearchChange,
  isLoading = false,
}: ConversationListProps) => {
  const filteredConversations = conversations.filter(conversation =>
    conversation.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.client_phone.includes(searchTerm)
  );

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'finished':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Novo';
      case 'in_progress':
        return 'Em andamento';
      case 'finished':
        return 'Finalizado';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Tente buscar por um termo diferente.'
                : 'As conversas aparecerão aqui quando chegarem mensagens.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation === conversation.id
                    ? 'bg-green-50 border border-green-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {conversation.is_group ? (
                          <Users className="h-6 w-6" />
                        ) : (
                          conversation.client_name?.charAt(0) || 
                          conversation.client_phone.slice(-2)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Unread indicator */}
                    {conversation.unread_count && conversation.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.client_name || 'Cliente'}
                        {conversation.is_group && (
                          <Users className="inline h-3 w-3 ml-1 text-gray-400" />
                        )}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.last_message_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 mb-2">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600 truncate">
                        {conversation.client_phone}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getSectorColor(conversation.sector)}`}
                        >
                          {getSectorLabel(conversation.sector)}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(conversation.status)}`}
                        >
                          {getStatusLabel(conversation.status)}
                        </Badge>
                      </div>
                      
                      {/* Instance indicator */}
                      <span className="text-xs text-gray-400 truncate">
                        {conversation.instance_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
