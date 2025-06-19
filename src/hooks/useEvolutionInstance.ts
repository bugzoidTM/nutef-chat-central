
import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as evolutionApi from '@/services/evolutionApi';

export const useEvolutionInstance = (instanceName: string) => {
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string | null>(null);

  // Create instance mutation
  const createInstanceMutation = useMutation({
    mutationFn: (options?: Partial<evolutionApi.CreateInstanceRequest>) =>
      evolutionApi.createInstance(instanceName, options),
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
    queryFn: () => evolutionApi.getConnectionState(instanceName),
    refetchInterval: 5000, // Check every 5 seconds
    retry: false,
  });

  // Find chats query
  const {
    data: chats,
    isLoading: chatsLoading,
    refetch: refetchChats,
  } = useQuery({
    queryKey: ['chats', instanceName],
    queryFn: () => evolutionApi.findChats(instanceName),
    enabled: connectionState?.instance.state === 'open',
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
