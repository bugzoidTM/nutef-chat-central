
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface InternalComment {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  mentioned_user_ids: string[];
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  edited_at: string | null;
  author?: {
    name: string;
    sector_id: string;
  };
}

export interface CreateCommentData {
  conversation_id: string;
  content: string;
  mentioned_user_ids?: string[];
}

export const useInternalComments = (conversationId: string) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch internal comments for conversation
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['internal-comments', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('internal_comments')
        .select(`
          *,
          author:profiles!internal_comments_author_id_fkey (
            name,
            sector_id
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching internal comments:', error);
        throw error;
      }

      return (data || []) as (InternalComment & { author: { name: string; sector_id: string } })[];
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Create new internal comment
  const createComment = useMutation({
    mutationFn: async (data: CreateCommentData) => {
      if (!profile?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('internal_comments')
        .insert({
          conversation_id: data.conversation_id,
          author_id: profile.id,
          content: data.content,
          mentioned_user_ids: data.mentioned_user_ids || [],
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-comments', conversationId] });
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário interno foi adicionado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update existing comment
  const updateComment = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { error } = await supabase
        .from('internal_comments')
        .update({
          content,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-comments', conversationId] });
      toast({
        title: "Comentário atualizado",
        description: "Seu comentário foi atualizado com sucesso.",
      });
    },
  });

  return {
    comments,
    isLoading,
    createComment,
    updateComment,
    isCreating: createComment.isPending,
    isUpdating: updateComment.isPending,
  };
};
