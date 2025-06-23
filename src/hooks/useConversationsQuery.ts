
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SectorType, StatusType } from '@/types/dashboard';

export const useConversationsQuery = (selectedSector: SectorType, selectedStatus: StatusType) => {
  console.log('🔍 useConversationsQuery - Initialized with:', { selectedSector, selectedStatus });

  return useQuery({
    queryKey: ['conversations', selectedSector, selectedStatus],
    queryFn: async () => {
      console.log('📊 useConversationsQuery - Fetching conversations from Supabase...');
      
      // Use simple base query to avoid type issues
      const baseQuery = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      // Apply filters directly without complex type inference
      let filteredQuery = baseQuery;

      // Filter by sector if not 'all' - use the sector field directly
      if (selectedSector !== 'all') {
        filteredQuery = filteredQuery.eq('sector', selectedSector);
        console.log('🔽 Filtering by sector:', selectedSector);
      }

      if (selectedStatus !== 'all') {
        filteredQuery = filteredQuery.eq('status', selectedStatus);
        console.log('🔽 Filtering by status:', selectedStatus);
      }

      // Execute query with explicit error handling
      const result = await filteredQuery;
      
      if (result.error) {
        console.error('❌ useConversationsQuery - Error fetching conversations:', result.error);
        throw result.error;
      }

      const conversations = result.data || [];

      if (conversations.length === 0) {
        console.log('📊 useConversationsQuery - No conversations found');
        return [];
      }

      // Fetch related data separately with simple queries
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          try {
            // Get instance data with simple query
            const instanceQuery = await supabase
              .from('instances')
              .select('instance_name, phone')
              .eq('id', conv.instance_id)
              .limit(1);

            const instance = instanceQuery.data?.[0] || null;

            // For sectors, we'll use the sector field to get additional data if needed
            // But since we already have the sector enum, we might not need to fetch from sectors table
            let sector = null;
            if (conv.sector) {
              const sectorQuery = await supabase
                .from('sectors')
                .select('id, name, color')
                .eq('name', getSectorNameFromType(conv.sector))
                .limit(1);

              sector = sectorQuery.data?.[0] || null;
            }

            return {
              id: conv.id,
              client_name: conv.client_name,
              client_phone: conv.client_phone,
              status: conv.status,
              sector: conv.sector,
              sector_id: sector?.id || null,
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
              sector_id: null,
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
