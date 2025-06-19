
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as evolutionApi from '@/services/evolutionApi';

export const useEvolutionMutations = (instanceName: string, refetchChats: () => void) => {
  const { toast } = useToast();

  // Create instance mutation with webhook included from the start
  const createInstanceMutation = useMutation({
    mutationFn: async (options?: Partial<evolutionApi.CreateInstanceRequest>) => {
      console.log('Creating instance mutation for:', instanceName);
      
      try {
        // Check if instance already exists
        console.log('Checking if instance exists...');
        const instanceExists = await evolutionApi.checkInstanceExists(instanceName);
        
        let response;
        if (!instanceExists) {
          console.log('Instance does not exist, creating new one...');
          // Create instance in Evolution API with webhook included
          response = await evolutionApi.createInstance(instanceName, options);
          console.log('Evolution API instance creation response:', response);
        } else {
          console.log('Instance already exists, getting connection state...');
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
      console.log('Instance mutation success:', data);
      toast({
        title: "Instância configurada",
        description: `Instância ${instanceName} configurada com sucesso com webhook habilitado.`,
      });
    },
    onError: (error: any) => {
      console.error('Error creating instance:', error);
      let errorMessage = error.message;
      
      // Provide more specific error messages
      if (error.message.includes('Invalid "url" property')) {
        errorMessage = 'Erro na configuração do webhook. Verifique a URL do webhook.';
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
    mutationFn: () => {
      console.log('Getting QR code for instance:', instanceName);
      return evolutionApi.getQRCode(instanceName);
    },
    onSuccess: (data) => {
      console.log('QR code generation success:', data);
      toast({
        title: "QR Code gerado",
        description: "Escaneie o QR Code com seu WhatsApp.",
      });
    },
    onError: (error: any) => {
      console.error('Error getting QR code:', error);
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
    mutationFn: ({ number, text }: { number: string; text: string }) => {
      console.log('Sending message via Evolution API:', { instanceName, number, text });
      return evolutionApi.sendTextMessage(instanceName, number, text);
    },
    onSuccess: () => {
      console.log('Message sent successfully');
      toast({
        title: "Mensagem enviada",
        description: "Mensagem enviada com sucesso via WhatsApp.",
      });
      refetchChats();
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
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
