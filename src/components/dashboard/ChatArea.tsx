
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Phone, User, Clock, MessageSquare, CheckSquare, Settings, Loader2, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const queryClient = useQueryClient();
  const handleArchive = async () => {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'archived', assigned_to: null })
      .eq('id', conversation.id);
    if (error) {
      toast.error(`Erro ao arquivar: ${error.message}`);
    } else {
      toast.success('Conversa arquivada. Ela reabre se o cliente mandar nova mensagem.');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm', { locale: ptBR });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'finished':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Nova';
      case 'in_progress':
        return 'Em Andamento';
      case 'finished':
        return 'Finalizada';
      case 'archived':
        return 'Arquivada';
      default:
        return status;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Conversation Header */}
      <div className="border-b border-gray-200 p-4 bg-white flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-green-100 text-green-600">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold truncate text-gray-900">
                {conversation.client_name || 'Cliente sem nome'}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{conversation.client_phone}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(conversation.last_message_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ChatbotIndicator 
              conversationId={conversation.id} 
              sectorId={conversation.sector_id || ''} 
            />
            <Badge variant={getStatusBadgeVariant(conversation.status)}>
              {getStatusLabel(conversation.status)}
            </Badge>
            {conversation.status !== 'archived' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchive}
                className="p-2"
                title="Arquivar conversa"
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages Container */}
          <div className="flex-1 relative">
            {messagesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">Carregando mensagens...</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma mensagem ainda</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                            message.direction === 'outgoing'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-900 border'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {message.content}
                          </p>
                          <div className="flex items-center justify-between mt-2 gap-3">
                            <p className={`text-xs ${
                              message.direction === 'outgoing' ? 'text-green-100' : 'text-gray-500'
                            }`}>
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
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Quick Responses */}
          <div className="border-t border-gray-200 p-3 flex-shrink-0 bg-gray-50">
            <QuickResponseSelector onSelectResponse={handleQuickResponse} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
            <div className="flex gap-3">
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
                size="default"
                className="px-6"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        {sidebarOpen && (
          <div className="w-72 border-l border-gray-200 bg-gray-50 flex-shrink-0">
            <Tabs defaultValue="context" className="h-full flex flex-col">
              <div className="border-b border-gray-200 bg-white p-3 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-3 h-9">
                  <TabsTrigger value="context" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    Contexto
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Notas
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs">
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Tarefas
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="context" className="h-full mt-0">
                  <ScrollArea className="h-full p-4">
                    <ConversationContextPanel conversationId={conversation.id} />
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="comments" className="h-full mt-0">
                  <ScrollArea className="h-full p-4">
                    <InternalCommentsPanel conversationId={conversation.id} />
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="tasks" className="h-full mt-0">
                  <ScrollArea className="h-full p-4">
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
