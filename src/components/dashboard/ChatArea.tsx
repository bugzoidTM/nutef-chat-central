
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Phone, User, Clock, MessageSquare, CheckSquare, Settings } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Conversation Header */}
      <div className="border-b border-gray-200 p-3 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-base font-semibold truncate">
                {conversation.client_name || 'Cliente sem nome'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                <span className="truncate">{conversation.client_phone}</span>
                <Separator orientation="vertical" className="h-3" />
                <Clock className="h-3 w-3" />
                <span>{format(new Date(conversation.last_message_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChatbotIndicator 
              conversationId={conversation.id} 
              sectorId={conversation.sector_id || ''} 
            />
            <Badge variant={conversation.status === 'new' ? 'default' : 'secondary'} className="text-xs">
              {conversation.status === 'new' ? 'Nova' : 
               conversation.status === 'in_progress' ? 'Em Andamento' : 'Finalizada'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      message.direction === 'outgoing'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
          <div className="border-t border-gray-200 p-2 flex-shrink-0">
            <QuickResponseSelector onSelectResponse={handleQuickResponse} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-3 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={sendMessageMutation.isPending}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        {sidebarOpen && (
          <div className="w-72 border-l border-gray-200 bg-gray-50 flex-shrink-0">
            <Tabs defaultValue="context" className="h-full flex flex-col">
              <div className="border-b border-gray-200 bg-white p-2 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="context" className="text-xs p-1">
                    <User className="h-3 w-3 mr-1" />
                    Contexto
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="text-xs p-1">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Notas
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs p-1">
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Tarefas
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="context" className="h-full mt-0">
                  <ScrollArea className="h-full p-3">
                    <ConversationContextPanel conversationId={conversation.id} />
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="comments" className="h-full mt-0">
                  <ScrollArea className="h-full p-3">
                    <InternalCommentsPanel conversationId={conversation.id} />
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="tasks" className="h-full mt-0">
                  <ScrollArea className="h-full p-3">
                    <InternalTasksPanel conversationId={conversation.id} />
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};
