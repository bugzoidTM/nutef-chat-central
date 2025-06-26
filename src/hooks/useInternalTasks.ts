
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface InternalTask {
  id: string;
  conversation_id: string;
  title: string;
  description: string | null;
  created_by: string;
  assigned_to_sector: string | null;
  assigned_to_user: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    name: string;
  };
  assigned_sector?: {
    name: string;
    color: string;
  };
  assigned_user?: {
    name: string;
  };
}

export interface CreateTaskData {
  conversation_id: string;
  title: string;
  description?: string;
  assigned_to_sector?: string;
  assigned_to_user?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  assigned_to_sector?: string;
  assigned_to_user?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
}

export const useInternalTasks = (conversationId: string) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch internal tasks for conversation
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['internal-tasks', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('internal_tasks')
        .select(`
          *,
          creator:profiles!internal_tasks_created_by_fkey (
            name
          ),
          assigned_sector:sectors!internal_tasks_assigned_to_sector_fkey (
            name,
            color
          ),
          assigned_user:profiles!internal_tasks_assigned_to_user_fkey (
            name
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching internal tasks:', error);
        throw error;
      }

      return (data || []) as InternalTask[];
    },
    enabled: !!conversationId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Create new internal task
  const createTask = useMutation({
    mutationFn: async (data: CreateTaskData) => {
      if (!profile?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('internal_tasks')
        .insert({
          conversation_id: data.conversation_id,
          title: data.title,
          description: data.description,
          created_by: profile.id,
          assigned_to_sector: data.assigned_to_sector,
          assigned_to_user: data.assigned_to_user,
          priority: data.priority || 'medium',
          due_date: data.due_date,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-tasks', conversationId] });
      toast({
        title: "Tarefa criada",
        description: "A tarefa interna foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update existing task
  const updateTask = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: UpdateTaskData }) => {
      const updateData: any = { ...data };
      
      if (data.status === 'completed' && !data.hasOwnProperty('completed_at')) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('internal_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-tasks', conversationId] });
      toast({
        title: "Tarefa atualizada",
        description: "A tarefa foi atualizada com sucesso.",
      });
    },
  });

  // Get task statistics
  const getTaskStats = () => {
    const pending = tasks.filter(task => task.status === 'pending').length;
    const inProgress = tasks.filter(task => task.status === 'in_progress').length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const overdue = tasks.filter(task => 
      task.due_date && 
      new Date(task.due_date) < new Date() && 
      task.status !== 'completed'
    ).length;

    return { pending, inProgress, completed, overdue, total: tasks.length };
  };

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    getTaskStats,
    isCreating: createTask.isPending,
    isUpdating: updateTask.isPending,
  };
};
