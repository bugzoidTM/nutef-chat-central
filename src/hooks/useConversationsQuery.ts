
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SectorType, StatusType } from '@/types/dashboard';

export const useConversationsQuery = (selectedSector: SectorType, selectedStatus: StatusType) => {
  console.log('🔍 useConversationsQuery - Initialized with:', { selectedSector, selectedStatus });

  return useQuery({
    queryKey: ['conversations', selectedSector, selectedStatus],
    queryFn: async () => {
      console.log('📊 useConversationsQuery - Fetching conversations from Supabase...');
      
      let query = supabase
        .from('conversations')
        .select(`
          *,
          instances (
            instance_name,
            phone
          ),
          sectors (
            id,
            name,
            color
          )
        `)
        .order('last_message_at', { ascending: false });

      // Filtrar por setor usando sector_id se não for 'all'
      if (selectedSector !== 'all') {
        // Buscar o ID do setor baseado no nome
        const { data: sectorData } = await supabase
          .from('sectors')
          .select('id')
          .eq('name', getSectorNameFromType(selectedSector))
          .single();
        
        if (sectorData) {
          query = query.eq('sector_id', sectorData.id);
          console.log('🔽 Filtering by sector_id:', sectorData.id);
        }
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
        console.log('🔽 Filtering by status:', selectedStatus);
      }

      const { data, error } = await query;
      
      console.log('📊 useConversationsQuery - Supabase query result:', { 
        data: data ? `${data.length} conversations` : 'null', 
        error: error?.message || 'none',
        rawData: data
      });
      
      if (error) {
        console.error('❌ useConversationsQuery - Error fetching conversations:', error);
        throw error;
      }
      
      return data || [];
    },
    refetchInterval: 3000,
    retry: (failureCount, error: any) => {
      console.log(`🔄 useConversationsQuery - Retry attempt ${failureCount}:`, error?.message);
      return failureCount < 2;
    },
  });
};

// Helper function para converter tipos de setor
function getSectorNameFromType(sectorType: SectorType): string {
  switch (sectorType) {
    case 'support':
      return 'Suporte';
    case 'financial':
      return 'Financeiro';
    case 'sales':
      return 'Vendas';
    default:
      return 'Suporte';
  }
}
