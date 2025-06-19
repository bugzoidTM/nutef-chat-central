
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import * as evolutionApi from '@/services/evolutionApi';

export const useEvolutionQueries = (instanceName: string, phoneNumber: string) => {
  const { profile } = useAuth();

  // Connection state query with better error handling
  const {
    data: connectionState,
    isLoading: connectionStateLoading,
    refetch: refetchConnectionState,
  } = useQuery({
    queryKey: ['connectionState', instanceName],
    queryFn: async () => {
      try {
        const response = await evolutionApi.getConnectionState(instanceName);
        
        // Update instance status in database when connection state changes
        if (profile && instanceName && response.instance) {
          const status = response.instance.state === 'open' ? 'connected' : 
                        response.instance.state === 'connecting' ? 'connecting' : 'disconnected';
          
          await supabase
            .from('instances')
            .update({ status })
            .eq('instance_name', instanceName)
            .eq('admin_id', profile.id);
        }
        
        return response;
      } catch (error: any) {
        // If instance doesn't exist, return null instead of throwing
        if (error.message.includes('404') || error.message.includes('does not exist')) {
          console.log('Instance does not exist yet:', instanceName);
          return null;
        }
        throw error;
      }
    },
    refetchInterval: (data) => {
      // Only refetch if we have data and instance is connecting
      if (data?.instance?.state === 'connecting') {
        return 5000; // Check every 5 seconds when connecting
      }
      return false; // Don't refetch if no data or if connected/disconnected
    },
    retry: (failureCount, error: any) => {
      // Don't retry 404 errors
      if (error?.message?.includes('404') || error?.message?.includes('does not exist')) {
        return false;
      }
      return failureCount < 2; // Retry other errors max 2 times
    },
    enabled: !!instanceName && !!profile && phoneNumber.length >= 10, // Only enable for valid phone numbers
  });

  // Find chats query - only run when instance is connected
  const {
    data: chats,
    isLoading: chatsLoading,
    refetch: refetchChats,
  } = useQuery({
    queryKey: ['chats', instanceName],
    queryFn: () => evolutionApi.findChats(instanceName),
    enabled: connectionState?.instance?.state === 'open' && !!instanceName,
    retry: false, // Don't retry chat queries
  });

  return {
    connectionState: connectionState?.instance || null,
    chats: chats?.chats || [],
    connectionStateLoading,
    chatsLoading,
    refetchConnectionState,
    refetchChats,
  };
};
