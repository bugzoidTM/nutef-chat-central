
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SectorType, StatusType } from '@/types/dashboard';

export const useConversationsQuery = (selectedSector: SectorType, selectedStatus: StatusType) => {
  console.log('🔍 useConversationsQuery - Initialized with:', { selectedSector, selectedStatus });

  return useQuery({
    queryKey: ['conversations', selectedSector, selectedStatus],
    queryFn: async () => {
      console.log('📊 useConversationsQuery - Fetching conversations from Supabase...');
      
      // Buscar conversas com joins otimizados
      let query = supabase
        .from('conversations')
        .select(`
          id,
          client_name,
          client_phone,
          status,
          sector,
          sector_id,
          assigned_to,
          created_at,
          updated_at,
          last_message_at,
          instance_id,
          instances:instance_id (
            instance_name,
            phone
          ),
          sectors:sector_id (
            id,
            name,
            color
          )
        `)
        .order('last_message_at', { ascending: false });

      // Aplicar filtros
      if (selectedSector !== 'all') {
        // Usar o campo sector_id em vez do enum
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
      } else {
        // Arquivadas só aparecem quando o filtro 'archived' é selecionado
        query = query.neq('status', 'archived');
      }

      const result = await query;
      
      if (result.error) {
        console.error('❌ useConversationsQuery - Error fetching conversations:', result.error);
        throw result.error;
      }

      const conversations = result.data || [];

      if (conversations.length === 0) {
        console.log('📊 useConversationsQuery - No conversations found');
        return [];
      }

      // Transformar dados para o formato esperado
      const transformedConversations = conversations.map((conv) => ({
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
        instances: conv.instances,
        sectors: conv.sectors,
      }));
      
      console.log('📊 useConversationsQuery - Result:', { 
        data: transformedConversations ? `${transformedConversations.length} conversations` : 'null',
        rawData: transformedConversations
      });
      
      return transformedConversations;
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
