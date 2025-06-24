
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AttendantStats {
  attendant_id: string;
  attendant_name: string;
  sector_name: string;
  sector_color: string;
  total_conversations: number;
  new_conversations: number;
  in_progress_conversations: number;
  finished_conversations: number;
  total_messages_sent: number;
  avg_response_time?: number;
  last_activity?: string;
  is_active: boolean;
}

export interface SectorStats {
  sector_id: string;
  sector_name: string;
  sector_color: string;
  total_conversations: number;
  active_attendants: number;
  new_conversations: number;
  in_progress_conversations: number;
  finished_conversations: number;
  total_messages: number;
}

export interface DailyStats {
  date: string;
  total_conversations: number;
  new_conversations: number;
  finished_conversations: number;
  total_messages: number;
}

export const useReports = (dateRange: { start: string; end: string }) => {
  const { profile } = useAuth();

  // Estatísticas por atendente
  const { data: attendantStats = [], isLoading: loadingAttendantStats } = useQuery({
    queryKey: ['reports', 'attendants', dateRange],
    queryFn: async () => {
      // Buscar atendentes com suas estatísticas
      const { data: attendants, error: attendantsError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          is_active,
          sector_id,
          sectors:sector_id(id, name, color)
        `)
        .eq('role', 'attendant');
      
      if (attendantsError) throw attendantsError;

      // Para cada atendente, buscar estatísticas de conversas
      const statsPromises = attendants.map(async (attendant) => {
        // Conversas atribuídas ao atendente no período
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select('id, status, created_at')
          .eq('assigned_to', attendant.id)
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        if (conversationsError) throw conversationsError;

        // Mensagens enviadas pelo atendente no período
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id, created_at')
          .eq('direction', 'outgoing')
          .in('conversation_id', conversations?.map(c => c.id) || [])
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        if (messagesError) throw messagesError;

        return {
          attendant_id: attendant.id,
          attendant_name: attendant.name,
          sector_name: attendant.sectors?.name || 'Sem setor',
          sector_color: attendant.sectors?.color || '#6B7280',
          total_conversations: conversations?.length || 0,
          new_conversations: conversations?.filter(c => c.status === 'new').length || 0,
          in_progress_conversations: conversations?.filter(c => c.status === 'in_progress').length || 0,
          finished_conversations: conversations?.filter(c => c.status === 'finished').length || 0,
          total_messages_sent: messages?.length || 0,
          is_active: attendant.is_active,
          last_activity: messages?.length > 0 
            ? messages[messages.length - 1]?.created_at 
            : undefined,
        } as AttendantStats;
      });

      return await Promise.all(statsPromises);
    },
    enabled: profile?.role === 'admin',
  });

  // Estatísticas por setor
  const { data: sectorStats = [], isLoading: loadingSectorStats } = useQuery({
    queryKey: ['reports', 'sectors', dateRange],
    queryFn: async () => {
      // Buscar setores ativos
      const { data: sectors, error: sectorsError } = await supabase
        .from('sectors')
        .select('id, name, color')
        .eq('is_active', true);
      
      if (sectorsError) throw sectorsError;

      // Para cada setor, buscar estatísticas
      const statsPromises = sectors.map(async (sector) => {
        // Atendentes ativos do setor
        const { data: attendants, error: attendantsError } = await supabase
          .from('profiles')
          .select('id')
          .eq('sector_id', sector.id)
          .eq('role', 'attendant')
          .eq('is_active', true);

        if (attendantsError) throw attendantsError;

        // Conversas do setor no período
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select('id, status, created_at')
          .eq('sector_id', sector.id)
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        if (conversationsError) throw conversationsError;

        // Mensagens das conversas do setor
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id')
          .in('conversation_id', conversations?.map(c => c.id) || [])
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        if (messagesError) throw messagesError;

        return {
          sector_id: sector.id,
          sector_name: sector.name,
          sector_color: sector.color,
          total_conversations: conversations?.length || 0,
          active_attendants: attendants?.length || 0,
          new_conversations: conversations?.filter(c => c.status === 'new').length || 0,
          in_progress_conversations: conversations?.filter(c => c.status === 'in_progress').length || 0,
          finished_conversations: conversations?.filter(c => c.status === 'finished').length || 0,
          total_messages: messages?.length || 0,
        } as SectorStats;
      });

      return await Promise.all(statsPromises);
    },
    enabled: profile?.role === 'admin',
  });

  // Estatísticas diárias
  const { data: dailyStats = [], isLoading: loadingDailyStats } = useQuery({
    queryKey: ['reports', 'daily', dateRange],
    queryFn: async () => {
      // Buscar conversas no período
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('created_at, status')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
      
      if (conversationsError) throw conversationsError;

      // Buscar mensagens no período
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
      
      if (messagesError) throw messagesError;

      // Agrupar por data
      const dailyData: { [key: string]: DailyStats } = {};
      
      // Processar conversas
      conversations?.forEach(conv => {
        const date = new Date(conv.created_at).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            total_conversations: 0,
            new_conversations: 0,
            finished_conversations: 0,
            total_messages: 0,
          };
        }
        dailyData[date].total_conversations++;
        if (conv.status === 'new') dailyData[date].new_conversations++;
        if (conv.status === 'finished') dailyData[date].finished_conversations++;
      });

      // Processar mensagens
      messages?.forEach(msg => {
        const date = new Date(msg.created_at).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            total_conversations: 0,
            new_conversations: 0,
            finished_conversations: 0,
            total_messages: 0,
          };
        }
        dailyData[date].total_messages++;
      });

      return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: profile?.role === 'admin',
  });

  // Resumo geral
  const overallStats = {
    totalAttendants: attendantStats.length,
    activeAttendants: attendantStats.filter(a => a.is_active).length,
    totalSectors: sectorStats.length,
    totalConversations: attendantStats.reduce((sum, stat) => sum + stat.total_conversations, 0),
    totalMessagesSupport: attendantStats.reduce((sum, stat) => sum + stat.total_messages_sent, 0),
    averageConversationsPerAttendant: attendantStats.length > 0 
      ? Math.round(attendantStats.reduce((sum, stat) => sum + stat.total_conversations, 0) / attendantStats.filter(a => a.is_active).length || 1)
      : 0,
  };

  return {
    attendantStats,
    sectorStats,
    dailyStats,
    overallStats,
    isLoading: loadingAttendantStats || loadingSectorStats || loadingDailyStats,
  };
};
