import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CrmStage {
  id: string;
  name: string;
  color: string;
  position: number;
  is_active: boolean;
}

export interface CrmTag {
  id: string;
  name: string;
  color: string;
}

export interface CrmConversation {
  id: string;
  client_name: string | null;
  client_phone: string;
  crm_stage_id: string | null;
  status: string;
  last_message_at: string;
  assigned_to: string | null;
  tags: CrmTag[];
}

export interface ContactNote {
  id: string;
  conversation_id: string;
  author_id: string | null;
  author_name?: string;
  content: string;
  created_at: string;
}

export const useCrm = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['crm-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('is_active', true)
        .order('position');
      if (error) throw error;
      return data as CrmStage[];
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['crm-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .order('name');
      if (error) throw error;
      return data as CrmTag[];
    },
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['crm-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, client_name, client_phone, crm_stage_id, status, last_message_at, assigned_to, conversation_tags(tag_id, tags(id, name, color))')
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        tags: (c.conversation_tags || [])
          .map((ct: any) => ct.tags)
          .filter(Boolean),
      })) as CrmConversation[];
    },
  });

  // Realtime: recarregar quadro quando conversas ou tags mudarem
  useEffect(() => {
    const channel = supabase
      .channel('crm-board')
      .on('postgres_changes', { event: '*', schema: 'watende', table: 'conversations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
      })
      .on('postgres_changes', { event: '*', schema: 'watende', table: 'conversation_tags' }, () => {
        queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const moveConversation = useMutation({
    mutationFn: async ({ conversationId, stageId }: { conversationId: string; stageId: string }) => {
      const { error } = await supabase
        .from('conversations')
        .update({ crm_stage_id: stageId })
        .eq('id', conversationId);
      if (error) throw error;
    },
    onMutate: async ({ conversationId, stageId }) => {
      // Atualização otimista para o drag soltar sem "pulo" visual
      await queryClient.cancelQueries({ queryKey: ['crm-conversations'] });
      const previous = queryClient.getQueryData<CrmConversation[]>(['crm-conversations']);
      queryClient.setQueryData<CrmConversation[]>(['crm-conversations'], (old = []) =>
        old.map(c => (c.id === conversationId ? { ...c, crm_stage_id: stageId } : c))
      );
      return { previous };
    },
    onError: (error: any, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['crm-conversations'], context.previous);
      toast.error(`Erro ao mover card: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
    },
  });

  const createTag = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name, color, created_by: profile?.id || null })
        .select()
        .single();
      if (error) throw error;
      return data as CrmTag;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-tags'] }),
    onError: (error: any) => toast.error(`Erro ao criar tag: ${error.message}`),
  });

  const toggleTag = useMutation({
    mutationFn: async ({ conversationId, tagId, assigned }: { conversationId: string; tagId: string; assigned: boolean }) => {
      if (assigned) {
        const { error } = await supabase
          .from('conversation_tags')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('tag_id', tagId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('conversation_tags')
          .insert({ conversation_id: conversationId, tag_id: tagId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-conversations'] }),
    onError: (error: any) => toast.error(`Erro ao atualizar tag: ${error.message}`),
  });

  return {
    stages,
    tags,
    conversations,
    isLoading: stagesLoading || conversationsLoading,
    moveConversation,
    createTag,
    toggleTag,
  };
};

export const useContactNotes = (conversationId: string | null) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['contact-notes', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_notes')
        .select('*, profiles:author_id(name)')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((n: any) => ({
        ...n,
        author_name: n.profiles?.name || 'Desconhecido',
      })) as ContactNote[];
    },
  });

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('contact_notes')
        .insert({ conversation_id: conversationId!, author_id: profile?.id || null, content });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-notes', conversationId] }),
    onError: (error: any) => toast.error(`Erro ao salvar nota: ${error.message}`),
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('contact_notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contact-notes', conversationId] }),
    onError: (error: any) => toast.error(`Erro ao excluir nota: ${error.message}`),
  });

  return { notes, isLoading, addNote, deleteNote };
};
