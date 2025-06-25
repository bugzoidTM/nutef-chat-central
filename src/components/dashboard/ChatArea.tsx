
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Phone, User, Clock, MessageSquare, Zap } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useAuth } from '@/hooks/useAuth';
import QuickResponseSelector from './QuickResponseSelector';
import { ChatbotIndicator } from './ChatbotIndicator';
import { ConversationContextPanel } from './ConversationContextPanel';
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
      <Card className="flex-1">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando mensagens...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Conversation Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {conversation.client_name || 'Cliente sem nome'}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
        </CardHeader>
      </Card>

      <div className="flex gap-4 flex-1">
        {/* Messages Area */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
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
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <p className="text-xs opacity-70">
                          {formatMessageTime(message.timestamp)}
                        </p>
                        {message.direction === 'outgoing' && message.sender_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs opacity-70">{message.sender_name}</span>
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
            <div className="border-t p-4">
              <QuickResponseSelector onSelectResponse={handleQuickResponse} />
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={sendMessageMutation.isPending}
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
          </CardContent>
        </Card>

        {/* Context Panel */}
        <div className="w-80">
          <ConversationContextPanel conversationId={conversation.id} />
        </div>
      </div>
    </div>
  );
};
