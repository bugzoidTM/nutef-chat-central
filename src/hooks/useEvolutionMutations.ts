
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as evolutionApi from '@/services/evolutionApi';

export const useEvolutionMutations = (instanceName: string, refetchChats: () => void) => {
  const { toast } = useToast();

  // Create instance mutation
  const createInstanceMutation = useMutation({
    mutationFn: async (options?: Partial<evolutionApi.CreateInstanceRequest>) => {
      console.log('Creating instance for phone:', instanceName);
      
      // Check if instance already exists
      const instanceExists = await evolutionApi.checkInstanceExists(instanceName);
      
      let response;
      if (!instanceExists) {
        // Create instance in Evolution API
        response = await evolutionApi.createInstance(instanceName, options);
        console.log('Evolution API response:', response);
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
    },
    onSuccess: (data) => {
      toast({
        title: "Instância configurada",
        description: `Instância ${instanceName} configurada com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error('Error creating instance:', error);
      toast({
        title: "Erro ao configurar instância",
        description: error.message,
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
      toast({
        title: "Erro ao gerar QR Code",
        description: error.message,
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
    createInstance: createInstanceMutation.mutate,
    getQRCode: getQRCodeMutation.mutate,
    sendMessage: sendMessageMutation.mutate,
    isCreatingInstance: createInstanceMutation.isPending,
    isGettingQRCode: getQRCodeMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
  };
};
