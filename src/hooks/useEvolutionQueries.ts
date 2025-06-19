
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import * as evolutionApi from '@/services/evolutionApi';

export const useEvolutionQueries = (instanceName: string, phoneNumber: string) => {
  const { profile } = useAuth();

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
          .eq('admin_id', profile.id);
      }
      
      return response;
    },
    refetchInterval: 5000, // Check every 5 seconds
    retry: false,
    enabled: !!instanceName && !!profile && phoneNumber.length > 0,
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

  return {
    connectionState: connectionState?.instance,
    chats: chats?.chats || [],
    connectionStateLoading,
    chatsLoading,
    refetchConnectionState,
    refetchChats,
  };
};
