
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { setupWebhookAutomatically } from '@/services/evolutionApi';
import type { Tables } from '@/integrations/supabase/types';

type WebhookConfig = Tables<'webhook_configs'>;

export const useWebhookConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get webhook configs using direct table query
  const { data: webhookConfigs = [], isLoading } = useQuery({
    queryKey: ['webhook-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Setup webhook automatically
  const setupWebhookMutation = useMutation({
    mutationFn: async ({ instanceName }: { instanceName: string }) => {
      const webhookUrl = 'https://watende.nutef.com/webhook/whatsai';
      
      // Configure webhook in Evolution API
      await setupWebhookAutomatically(instanceName);
      
      // Save configuration in database
      const { data, error } = await supabase
        .from('webhook_configs')
        .upsert({
          instance_name: instanceName,
          webhook_url: webhookUrl,
          webhook_secret: null,
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
        title: "Webhook configurado automaticamente",
        description: "O sistema está pronto para receber mensagens.",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao configurar webhook:', error);
      toast({
        title: "Erro ao configurar webhook",
        description: error.message,
        variant: "destructive",
      });
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
        .from('webhook_configs')
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
        .from('webhook_configs')
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
    setupWebhookAutomatically: setupWebhookMutation.mutate,
    saveWebhookConfig: saveWebhookConfigMutation.mutate,
    toggleWebhook: toggleWebhookMutation.mutate,
    isSaving: saveWebhookConfigMutation.isPending,
    isToggling: toggleWebhookMutation.isPending,
    isSettingUp: setupWebhookMutation.isPending,
  };
};
