
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SectorType, StatusType } from '@/types/dashboard';

export const useConversationsQuery = (selectedSector: SectorType, selectedStatus: StatusType) => {
  console.log('🔍 useConversationsQuery - Initialized with:', { selectedSector, selectedStatus });

  return useQuery({
    queryKey: ['conversations', selectedSector, selectedStatus],
    queryFn: async () => {
      console.log('📊 useConversationsQuery - Fetching conversations from Supabase...');
      
      // Build base query without complex joins to avoid type issues
      let query = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      // Filter by sector if not 'all'
      if (selectedSector !== 'all') {
        // Get sector data separately to avoid complex joins
        const sectorName = getSectorNameFromType(selectedSector);
        const { data: sectorData } = await supabase
          .from('sectors')
          .select('id')
          .eq('name', sectorName)
          .maybeSingle();
        
        if (sectorData?.id) {
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

      if (!conversations) {
        console.log('📊 useConversationsQuery - No conversations found');
        return [];
      }

      // Fetch related data in separate queries to avoid type complexity
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv: any) => {
          try {
            // Get instance data
            const { data: instance } = await supabase
              .from('instances')
              .select('instance_name, phone')
              .eq('id', conv.instance_id)
              .maybeSingle();

            // Get sector data
            const { data: sector } = await supabase
              .from('sectors')
              .select('id, name, color')
              .eq('id', conv.sector_id)
              .maybeSingle();

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
              instances: instance || null,
              sectors: sector || null,
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
