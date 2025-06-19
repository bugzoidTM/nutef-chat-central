
import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import * as evolutionApi from '@/services/evolutionApi';

export const useEvolutionInstance = (phoneNumber: string) => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [qrCode, setQrCode] = useState<string | null>(null);

  // Generate friendly instance name: whatsapp_ + clean phone number
  const generateInstanceName = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, ''); // Remove all non-digits
    return `whatsapp_${cleanPhone}`;
  };

  const instanceName = generateInstanceName(phoneNumber);

  // Create instance mutation
  const createInstanceMutation = useMutation({
    mutationFn: async (options?: Partial<evolutionApi.CreateInstanceRequest>) => {
      console.log('Creating instance for phone:', phoneNumber, 'instance name:', instanceName);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      if (!profile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      // Create instance in Evolution API with webhook configuration
      const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
      const response = await evolutionApi.createInstance(instanceName, {
        ...options,
        webhook: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE', 
          'CONNECTION_UPDATE'
        ]
      });
      console.log('Evolution API response:', response);
      
      // Save instance in database using profile.id instead of user.id
      const { error: instanceError } = await supabase
        .from('instances')
        .upsert({
          instance_name: instanceName,
          phone: phoneNumber,
          admin_id: profile.id, // Use profile.id instead of user.id
          status: 'connecting',
          webhook_url: webhookUrl,
        });

      if (instanceError) {
        console.error('Error saving instance to database:', instanceError);
        throw instanceError;
      }
      
      console.log('Instance saved to database successfully');
      
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Instância criada",
        description: `Instância ${instanceName} criada com sucesso.`,
      });
      
      if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
      }
    },
    onError: (error: any) => {
      console.error('Error creating instance:', error);
      toast({
        title: "Erro ao criar instância",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get QR code mutation
  const getQRCodeMutation = useMutation({
    mutationFn: () => evolutionApi.getQRCode(instanceName),
    onSuccess: (data) => {
      setQrCode(data.base64);
      toast({
        title: "QR Code gerado",
        description: "Escaneie o QR Code com seu WhatsApp.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar QR Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Connection state query
  const {
    data: connectionState,
    isLoading: connectionStateLoading,
    refetch: refetchConnectionState,
  } = useQuery({
    queryKey: ['connectionState', instanceName],
    queryFn: async () => {
      const response = await evolutionApi.getConnectionState(instanceName);
      
      // Update instance status in database when connection state changes
      if (profile && instanceName && response.instance) {
        const status = response.instance.state === 'open' ? 'connected' : 
                      response.instance.state === 'connecting' ? 'connecting' : 'disconnected';
        
        await supabase
          .from('instances')
          .update({ status })
          .eq('instance_name', instanceName)
          .eq('admin_id', profile.id); // Use profile.id
      }
      
      return response;
    },
    refetchInterval: 5000, // Check every 5 seconds
    retry: false,
    enabled: !!instanceName && !!profile,
  });

  // Find chats query
  const {
    data: chats,
    isLoading: chatsLoading,
    refetch: refetchChats,
  } = useQuery({
    queryKey: ['chats', instanceName],
    queryFn: () => evolutionApi.findChats(instanceName),
    enabled: connectionState?.instance.state === 'open' && !!instanceName,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ number, text }: { number: string; text: string }) =>
      evolutionApi.sendTextMessage(instanceName, number, text),
    onSuccess: () => {
      toast({
        title: "Mensagem enviada",
        description: "Mensagem enviada com sucesso via WhatsApp.",
      });
      refetchChats();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearQrCode = useCallback(() => {
    setQrCode(null);
  }, []);

  return {
    // State
    qrCode,
    connectionState: connectionState?.instance,
    chats: chats?.chats || [],
    instanceName,
    
    // Loading states
    connectionStateLoading,
    chatsLoading,
    
    // Mutations
    createInstance: createInstanceMutation.mutate,
    getQRCode: getQRCodeMutation.mutate,
    sendMessage: sendMessageMutation.mutate,
    
    // Loading states for mutations
    isCreatingInstance: createInstanceMutation.isPending,
    isGettingQRCode: getQRCodeMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    
    // Actions
    refetchConnectionState,
    refetchChats,
    clearQrCode,
  };
};
