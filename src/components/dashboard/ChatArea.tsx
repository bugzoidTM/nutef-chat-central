import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Phone, MoreVertical, Database, Zap, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { UnifiedMessage } from '@/services/evolution/types';
import type { EvolutionConversation } from '@/services/evolution/types';

interface ChatAreaProps {
  conversation: EvolutionConversation | null;
  messages: UnifiedMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  messagesError?: Error | null;
}

const ChatArea = ({ 
  conversation, 
  messages, 
  onSendMessage, 
  isLoading = false, 
  messagesError = null 
}: ChatAreaProps) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !isLoading) {
      onSendMessage(messageText.trim());
      setMessageText('');
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

  const getMessageTypeLabel = (messageType: UnifiedMessage['message_type']) => {
    switch (messageType) {
      case 'image':
        return '📷 Imagem';
      case 'video':
        return '🎥 Vídeo';
      case 'audio':
        return '🎵 Áudio';
      case 'document':
        return '📄 Documento';
      case 'sticker':
        return '😊 Sticker';
      case 'location':
        return '📍 Localização';
      case 'contact':
        return '👤 Contato';
      default:
        return null;
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <Phone className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Bem-vindo ao NutefTalk
          </h3>
          <p className="text-gray-500">
            Selecione uma conversa para começar o atendimento via Evolution API
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-green-100 text-green-600">
                {conversation.client_name?.charAt(0) || conversation.client_phone.slice(-2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {conversation.client_name || 'Cliente'}
                </h2>
                {conversation.is_group && (
                  <Badge variant="outline" className="text-xs">
                    Grupo
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{conversation.client_phone}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getSectorColor(conversation.sector)}`}
                >
                  {getSectorLabel(conversation.sector)}
                </Badge>
              </div>
              {/* Informações da instância */}
              <div className="flex items-center gap-2 mt-1">
                <Zap className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-500">
                  {conversation.instance_name} • {conversation.instance_phone}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {/* Error message */}
        {messagesError && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar mensagens: {messagesError.message}
            </AlertDescription>
          </Alert>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-8">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                <p className="text-gray-500">Carregando mensagens da Evolution API...</p>
              </div>
            ) : messagesError ? (
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <p className="text-gray-500">Não foi possível carregar as mensagens</p>
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma mensagem ainda</p>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.direction === 'outgoing'
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {/* Indicador do tipo de mensagem */}
                {message.message_type !== 'text' && (
                  <p className={`text-xs mb-1 ${
                    message.direction === 'outgoing' ? 'text-green-100' : 'text-gray-600'
                  }`}>
                    {getMessageTypeLabel(message.message_type)}
                  </p>
                )}
                
                <p className="text-sm">{message.content}</p>
                
                <div className={`flex items-center justify-between mt-1 text-xs ${
                  message.direction === 'outgoing' ? 'text-green-100' : 'text-gray-500'
                }`}>
                  <span>
                    {formatDistanceToNow(new Date(message.timestamp), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  
                  {/* Indicador da fonte da mensagem (sempre Evolution agora) */}
                  <div className="ml-2 flex items-center gap-1">
                    <Zap className="h-3 w-3" title="Evolution API" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!messageText.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
