
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    name: string;
  };
}

export const useTaskComments = (taskId: string) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments for task
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('internal_task_comments')
        .select(`
          *,
          author:profiles!internal_task_comments_author_id_fkey (
            name
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching task comments:', error);
        throw error;
      }

      return (data || []) as TaskComment[];
    },
    enabled: !!taskId,
    refetchInterval: 5000,
  });

  // Create new task comment
  const createComment = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!profile?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('internal_task_comments')
        .insert({
          task_id: taskId,
          author_id: profile.id,
          content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    },
  });

  return {
    comments,
    isLoading,
    createComment,
    isCreating: createComment.isPending,
  };
};
