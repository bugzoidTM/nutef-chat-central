
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as evolutionApi from '@/services/evolutionApi';

export const useEvolutionMutations = (instanceName: string, refetchChats: () => void) => {
  const { toast } = useToast();

  // Create instance mutation with better error handling
  const createInstanceMutation = useMutation({
    mutationFn: async (options?: Partial<evolutionApi.CreateInstanceRequest>) => {
      console.log('Creating instance for phone:', instanceName);
      
      try {
        // Check if instance already exists
        const instanceExists = await evolutionApi.checkInstanceExists(instanceName);
        
        let response;
        if (!instanceExists) {
          // Create instance in Evolution API without webhook initially
          response = await evolutionApi.createInstance(instanceName, options);
          console.log('Evolution API response:', response);
          
          // After instance creation, set up webhook separately
          try {
            await evolutionApi.setupWebhookAutomatically(instanceName);
            console.log('Webhook configured successfully for instance:', instanceName);
          } catch (webhookError) {
            console.warn('Failed to configure webhook, but instance was created:', webhookError);
            // Don't fail the whole process if webhook setup fails
          }
        } else {
          console.log('Instance already exists, skipping creation');
          // If instance exists, just get connection state
          const connectionState = await evolutionApi.getConnectionState(instanceName);
          response = {
            instance: {
              instanceName,
              status: connectionState.instance.state
            }
          };
        }
        
        return response;
      } catch (error: any) {
        console.error('Error in instance creation process:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Instância configurada",
        description: `Instância ${instanceName} configurada com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error('Error creating instance:', error);
      let errorMessage = error.message;
      
      // Provide more specific error messages
      if (error.message.includes('Invalid "url" property')) {
        errorMessage = 'Erro na configuração do webhook. A instância será criada sem webhook.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Erro de configuração na Evolution API. Verifique os parâmetros.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Serviço Evolution API não encontrado. Verifique a configuração.';
      }
      
      toast({
        title: "Erro ao configurar instância",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Get QR code mutation
  const getQRCodeMutation = useMutation({
    mutationFn: () => evolutionApi.getQRCode(instanceName),
    onSuccess: () => {
      toast({
        title: "QR Code gerado",
        description: "Escaneie o QR Code com seu WhatsApp.",
      });
    },
    onError: (error: any) => {
      let errorMessage = error.message;
      
      if (error.message.includes('404')) {
        errorMessage = 'Instância não encontrada. Crie a instância primeiro.';
      }
      
      toast({
        title: "Erro ao gerar QR Code",
        description: errorMessage,
        variant: "destructive",
      });
    },
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

  return {
    createInstance: createInstanceMutation.mutateAsync,
    getQRCode: getQRCodeMutation.mutateAsync,
    sendMessage: sendMessageMutation.mutate,
    isCreatingInstance: createInstanceMutation.isPending,
    isGettingQRCode: getQRCodeMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
  };
};
