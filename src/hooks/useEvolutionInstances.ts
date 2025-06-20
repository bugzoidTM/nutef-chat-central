import { useQuery } from '@tanstack/react-query';
import { getAllInstancesWithDetails, getInstanceDetails } from '@/services/evolution/instanceApi';
import type { InstanceInfo } from '@/services/evolution/types';

export const useEvolutionInstances = () => {
  const { 
    data: instances = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['evolution-instances'],
    queryFn: async () => {
      console.log('🔍 useEvolutionInstances - Fetching instances...');
      
      const instancesWithDetails = await getAllInstancesWithDetails();
      
      // Filtrar apenas instâncias conectadas
      const connectedInstances = instancesWithDetails.filter(
        instance => instance.connectionState === 'open' && instance.phoneNumber
      );
      
      console.log('✅ useEvolutionInstances - Connected instances:', connectedInstances.length);
      return connectedInstances;
    },
    refetchInterval: 30000, // Refresh a cada 30 segundos
    retry: 2,
    staleTime: 10000, // Considerar dados frescos por 10 segundos
  });

  // Pegar a primeira instância conectada como padrão
  const defaultInstance = instances.find(instance => 
    instance.connectionState === 'open' && instance.phoneNumber
  ) || instances[0];

  // Estatísticas das instâncias
  const stats = {
    total: instances.length,
    connected: instances.filter(i => i.connectionState === 'open').length,
    disconnected: instances.filter(i => i.connectionState !== 'open').length,
  };

  return {
    instances,
    defaultInstance,
    isLoading,
    error,
    refetch,
    stats,
    hasInstances: instances.length > 0,
    hasConnectedInstances: stats.connected > 0,
  };
};

// Hook para buscar detalhes de uma instância específica
export const useInstanceDetails = (instanceName: string | null) => {
  return useQuery({
    queryKey: ['evolution-instance-details', instanceName],
    queryFn: async () => {
      if (!instanceName) return null;
      
      console.log('🔍 useInstanceDetails - Fetching details for:', instanceName);
      const details = await getInstanceDetails(instanceName);
      console.log('✅ useInstanceDetails - Details fetched for:', instanceName, details?.phoneNumber);
      return details;
    },
    enabled: !!instanceName,
    staleTime: 60000, // Cache por 1 minuto
  });
}; 