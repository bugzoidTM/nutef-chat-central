
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SectorType, StatusType } from '@/types/dashboard';

export const useConversationsQuery = (selectedSector: SectorType, selectedStatus: StatusType) => {
  console.log('🔍 useConversationsQuery - Initialized with:', { selectedSector, selectedStatus });

  return useQuery({
    queryKey: ['conversations', selectedSector, selectedStatus],
    queryFn: async () => {
      console.log('📊 useConversationsQuery - Fetching conversations from Supabase...');
      
      // Simplified query to avoid deep type instantiation
      let query = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      // Filter by sector if not 'all'
      if (selectedSector !== 'all') {
        // Get sector data separately to avoid complex joins
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

      const { data: conversations, error } = await query;
      
      if (error) {
        console.error('❌ useConversationsQuery - Error fetching conversations:', error);
        throw error;
      }

      // Fetch related data separately to avoid complex type intersections
      const conversationsWithRelations = await Promise.all(
        (conversations || []).map(async (conv: any) => {
          // Get instance data
          const { data: instance } = await supabase
            .from('instances')
            .select('instance_name, phone')
            .eq('id', conv.instance_id)
            .single();

          // Get sector data
          const { data: sector } = await supabase
            .from('sectors')
            .select('id, name, color')
            .eq('id', conv.sector_id)
            .single();

          return {
            ...conv,
            instances: instance,
            sectors: sector,
          };
        })
      );
      
      console.log('📊 useConversationsQuery - Result:', { 
        data: conversationsWithRelations ? `${conversationsWithRelations.length} conversations` : 'null',
        rawData: conversationsWithRelations
      });
      
      return conversationsWithRelations || [];
    },
    refetchInterval: 3000,
    retry: (failureCount, error: any) => {
      console.log(`🔄 useConversationsQuery - Retry attempt ${failureCount}:`, error?.message);
      return failureCount < 2;
    },
  });
};

// Helper function to convert sector types
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
