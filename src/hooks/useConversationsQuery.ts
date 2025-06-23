
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SectorType, StatusType } from '@/types/dashboard';

export const useConversationsQuery = (selectedSector: SectorType, selectedStatus: StatusType) => {
  console.log('🔍 useConversationsQuery - Initialized with:', { selectedSector, selectedStatus });

  return useQuery({
    queryKey: ['conversations', selectedSector, selectedStatus],
    queryFn: async () => {
      console.log('📊 useConversationsQuery - Fetching conversations from Supabase...');
      
      // Use simple queries with explicit typing to avoid deep type instantiation
      let baseQuery = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      // Filter by sector if not 'all'
      if (selectedSector !== 'all') {
        // Get sector ID separately with explicit typing
        const sectorName = getSectorNameFromType(selectedSector);
        
        try {
          const sectorResult = await supabase
            .from('sectors')
            .select('id')
            .eq('name', sectorName)
            .limit(1);
          
          if (sectorResult.data && sectorResult.data.length > 0) {
            const sectorId = sectorResult.data[0].id;
            baseQuery = baseQuery.eq('sector_id', sectorId);
            console.log('🔽 Filtering by sector_id:', sectorId);
          }
        } catch (error) {
          console.error('Error fetching sector:', error);
        }
      }

      if (selectedStatus !== 'all') {
        baseQuery = baseQuery.eq('status', selectedStatus);
        console.log('🔽 Filtering by status:', selectedStatus);
      }

      const conversationResult = await baseQuery;
      
      if (conversationResult.error) {
        console.error('❌ useConversationsQuery - Error fetching conversations:', conversationResult.error);
        throw conversationResult.error;
      }

      const conversations = conversationResult.data || [];

      if (conversations.length === 0) {
        console.log('📊 useConversationsQuery - No conversations found');
        return [];
      }

      // Fetch related data separately with explicit typing
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          try {
            // Get instance data with explicit typing
            const instanceResult = await supabase
              .from('instances')
              .select('instance_name, phone')
              .eq('id', conv.instance_id)
              .limit(1);

            const instance = instanceResult.data && instanceResult.data.length > 0 
              ? instanceResult.data[0] 
              : null;

            // Get sector data with explicit typing
            const sectorResult = await supabase
              .from('sectors')
              .select('id, name, color')
              .eq('id', conv.sector_id)
              .limit(1);

            const sector = sectorResult.data && sectorResult.data.length > 0 
              ? sectorResult.data[0] 
              : null;

            return {
              id: conv.id,
              client_name: conv.client_name,
              client_phone: conv.client_phone,
              status: conv.status,
              sector: conv.sector,
              sector_id: conv.sector_id,
              assigned_to: conv.assigned_to,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              last_message_at: conv.last_message_at,
              instance_id: conv.instance_id,
              instances: instance,
              sectors: sector,
            };
          } catch (error) {
            console.error('Error enriching conversation:', error);
            return {
              id: conv.id,
              client_name: conv.client_name,
              client_phone: conv.client_phone,
              status: conv.status,
              sector: conv.sector,
              sector_id: conv.sector_id,
              assigned_to: conv.assigned_to,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              last_message_at: conv.last_message_at,
              instance_id: conv.instance_id,
              instances: null,
              sectors: null,
            };
          }
        })
      );
      
      console.log('📊 useConversationsQuery - Result:', { 
        data: enrichedConversations ? `${enrichedConversations.length} conversations` : 'null',
        rawData: enrichedConversations
      });
      
      return enrichedConversations;
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
