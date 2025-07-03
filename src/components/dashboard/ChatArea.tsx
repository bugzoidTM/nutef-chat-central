
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Phone, User, Clock, MessageSquare, CheckSquare } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useAuth } from '@/hooks/useAuth';
import QuickResponseSelector from './QuickResponseSelector';
import { ChatbotIndicator } from './ChatbotIndicator';
import { ConversationContextPanel } from './ConversationContextPanel';
import { InternalCommentsPanel } from './InternalCommentsPanel';
import { InternalTasksPanel } from './InternalTasksPanel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conversation } from '@/types/dashboard';

interface ChatAreaProps {
  conversation: Conversation;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ conversation }) => {
  const { profile } = useAuth();
  const { messages, messagesLoading } = useMessages(conversation.id);
  const sendMessageMutation = useSendMessage([conversation]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: conversation.id,
        content: newMessage,
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleQuickResponse = (content: string) => {
    setNewMessage(content);
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm', { locale: ptBR });
  };

  if (messagesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Conversation Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">
                {conversation.client_name || 'Cliente sem nome'}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="h-4 w-4" />
                {conversation.client_phone}
                <Separator orientation="vertical" className="h-4" />
                <Clock className="h-4 w-4" />
                {format(new Date(conversation.last_message_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChatbotIndicator 
              conversationId={conversation.id} 
              sectorId={conversation.sector_id || ''} 
            />
            <Badge variant={conversation.status === 'new' ? 'default' : 'secondary'}>
              {conversation.status === 'new' ? 'Nova' : 
               conversation.status === 'in_progress' ? 'Em Andamento' : 'Finalizada'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      message.direction === 'outgoing'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p className={`text-xs ${message.direction === 'outgoing' ? 'text-green-100' : 'text-gray-500'}`}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                      {message.direction === 'outgoing' && message.sender_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="text-xs text-green-100">{message.sender_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Responses */}
          <div className="border-t border-gray-200 p-4">
            <QuickResponseSelector onSelectResponse={handleQuickResponse} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={sendMessageMutation.isPending}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l border-gray-200 bg-gray-50">
          <Tabs defaultValue="context" className="h-full">
            <div className="border-b border-gray-200 bg-white">
              <TabsList className="grid w-full grid-cols-3 bg-transparent">
                <TabsTrigger value="context" className="text-xs">
                  <User className="h-4 w-4 mr-1" />
                  Contexto
                </TabsTrigger>
                <TabsTrigger value="comments" className="text-xs">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Comentários
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs">
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Tarefas
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="h-full overflow-y-auto">
              <TabsContent value="context" className="h-full mt-0 p-4">
                <ConversationContextPanel conversationId={conversation.id} />
              </TabsContent>
              
              <TabsContent value="comments" className="h-full mt-0 p-4">
                <InternalCommentsPanel conversationId={conversation.id} />
              </TabsContent>
              
              <TabsContent value="tasks" className="h-full mt-0 p-4">
                <InternalTasksPanel conversationId={conversation.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
