
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebhookConfig {
  id: string;
  instance_name: string;
  webhook_url: string;
  webhook_secret: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useWebhookConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get webhook configs using raw SQL query
  const { data: webhookConfigs = [], isLoading } = useQuery({
    queryKey: ['webhook-configs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_webhook_configs');
      
      if (error) {
        // Fallback to direct query if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('webhook_configs' as any)
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        return (fallbackData || []) as WebhookConfig[];
      }
      
      return (data || []) as WebhookConfig[];
    },
  });

  // Create or update webhook config
  const saveWebhookConfigMutation = useMutation({
    mutationFn: async ({ instanceName, webhookUrl, webhookSecret }: {
      instanceName: string;
      webhookUrl: string;
      webhookSecret?: string;
    }) => {
      const { data, error } = await supabase
        .from('webhook_configs' as any)
        .upsert({
          instance_name: instanceName,
          webhook_url: webhookUrl,
          webhook_secret: webhookSecret || null,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-configs'] });
      toast({
        title: "Webhook configurado",
        description: "Configuração de webhook salva com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao configurar webhook",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle webhook active status
  const toggleWebhookMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('webhook_configs' as any)
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook-configs'] });
      toast({
        title: "Status atualizado",
        description: "Status do webhook atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    webhookConfigs,
    isLoading,
    saveWebhookConfig: saveWebhookConfigMutation.mutate,
    toggleWebhook: toggleWebhookMutation.mutate,
    isSaving: saveWebhookConfigMutation.isPending,
    isToggling: toggleWebhookMutation.isPending,
  };
};
