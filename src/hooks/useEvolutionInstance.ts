
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEvolutionMutations } from './useEvolutionMutations';
import { useEvolutionQueries } from './useEvolutionQueries';

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

  // Use the separated queries and mutations
  const { connectionState, chats, connectionStateLoading, chatsLoading, refetchConnectionState, refetchChats } = 
    useEvolutionQueries(instanceName, phoneNumber);

  const { createInstance, getQRCode, sendMessage, isCreatingInstance, isGettingQRCode, isSendingMessage } = 
    useEvolutionMutations(instanceName, refetchChats);

  // Enhanced create instance with database integration
  const handleCreateInstance = async (options?: any) => {
    if (!user || !profile) {
      throw new Error('Usuário não autenticado ou perfil não encontrado');
    }

    try {
      console.log('Creating instance:', instanceName);
      
      // First, save instance in database
      const { error: instanceError } = await supabase
        .from('instances')
        .upsert({
          instance_name: instanceName,
          phone: phoneNumber,
          admin_id: profile.id,
          status: 'creating',
          webhook_url: 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook',
        }, {
          onConflict: 'instance_name',
        });

      if (instanceError) {
        console.error('Error saving instance to database:', instanceError);
        throw instanceError;
      }
      
      console.log('Instance saved to database, creating in Evolution API...');
      
      // Then create in Evolution API
      const response = await createInstance(options);
      
      // Update database status
      await supabase
        .from('instances')
        .update({ status: 'connecting' })
        .eq('instance_name', instanceName);
      
      if (response?.qrcode?.base64) {
        setQrCode(response.qrcode.base64);
      }
      
      console.log('Instance creation completed successfully');
      return response;
    } catch (error) {
      console.error('Error in handleCreateInstance:', error);
      
      // Update database status to error
      if (profile) {
        await supabase
          .from('instances')
          .update({ status: 'error' })
          .eq('instance_name', instanceName);
      }
      
      throw error;
    }
  };

  // Enhanced get QR code with state management
  const handleGetQRCode = async () => {
    try {
      const data = await getQRCode();
      setQrCode(data.base64);
      return data;
    } catch (error) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  };

  const clearQrCode = useCallback(() => {
    setQrCode(null);
  }, []);

  return {
    // State
    qrCode,
    connectionState,
    chats,
    instanceName,
    
    // Loading states
    connectionStateLoading,
    chatsLoading,
    
    // Actions
    createInstance: handleCreateInstance,
    getQRCode: handleGetQRCode,
    sendMessage,
    
    // Loading states for mutations
    isCreatingInstance,
    isGettingQRCode,
    isSendingMessage,
    
    // Utility actions
    refetchConnectionState,
    refetchChats,
    clearQrCode,
  };
};
