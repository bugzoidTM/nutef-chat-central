
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Sidebar from './Sidebar';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';
import type { Database } from '@/integrations/supabase/types';

type SectorType = Database['public']['Enums']['sector_type'] | 'all';
type StatusType = Database['public']['Enums']['conversation_status'] | 'all';

const Dashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSector, setSelectedSector] = useState<SectorType>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Query conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', selectedSector, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (selectedSector !== 'all') {
        query = query.eq('sector', selectedSector);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Query messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedConversation,
  });

  // Get conversation counts
  const conversationCounts = {
    new: conversations.filter(c => c.status === 'new').length,
    in_progress: conversations.filter(c => c.status === 'in_progress').length,
    finished: conversations.filter(c => c.status === 'finished').length,
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) throw new Error('Conversa não encontrada');

      // Insert message in database
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          from_phone: 'system', // Will be replaced with instance phone
          to_phone: conversation.client_phone,
          content,
          direction: 'outgoing',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update conversation status to in_progress if it's new
      if (conversation.status === 'new') {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ 
            status: 'in_progress',
            assigned_to: profile?.id,
            last_message_at: new Date().toISOString(),
          })
          .eq('id', conversationId);

        if (updateError) throw updateError;
      }

      // TODO: Send message via Evolution API
      console.log('Sending message via Evolution API:', {
        to: conversation.client_phone,
        content,
      });

      return messageData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    // Subscribe to conversations changes
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    // Subscribe to messages changes
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [queryClient]);

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
    return <div>Carregando...</div>;
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
      
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <ChatArea
        conversation={selectedConversationData || null}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={sendMessageMutation.isPending}
      />
    </div>
  );
};

export default Dashboard;
