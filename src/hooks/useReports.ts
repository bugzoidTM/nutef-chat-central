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
      const { data, error } = await supabase.rpc('get_attendant_stats', {
        start_date: dateRange.start,
        end_date: dateRange.end,
      });
      
      if (error) {
        console.warn('RPC get_attendant_stats não encontrada, usando query manual');
        // Fallback para query manual se a função RPC não existir
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            id,
            name,
            sector:sectors(id, name, color),
            conversations:conversations!assigned_to(
              id,
              status,
              created_at,
              messages:messages(id, direction, created_at)
            )
          `)
          .eq('role', 'attendant')
          .eq('is_active', true);
        
        if (fallbackError) throw fallbackError;
        
        return fallbackData?.map(attendant => ({
          attendant_id: attendant.id,
          attendant_name: attendant.name,
          sector_name: attendant.sector?.name || 'Sem setor',
          sector_color: attendant.sector?.color || '#6B7280',
          total_conversations: attendant.conversations?.length || 0,
          new_conversations: attendant.conversations?.filter((c: any) => c.status === 'new').length || 0,
          in_progress_conversations: attendant.conversations?.filter((c: any) => c.status === 'in_progress').length || 0,
          finished_conversations: attendant.conversations?.filter((c: any) => c.status === 'finished').length || 0,
          total_messages_sent: attendant.conversations?.reduce((total: number, conv: any) => 
            total + (conv.messages?.filter((m: any) => m.direction === 'outgoing').length || 0), 0) || 0,
        })) || [];
      }
      
      return data as AttendantStats[];
    },
    enabled: profile?.role === 'admin',
  });

  // Estatísticas por setor
  const { data: sectorStats = [], isLoading: loadingSectorStats } = useQuery({
    queryKey: ['reports', 'sectors', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sector_stats', {
        start_date: dateRange.start,
        end_date: dateRange.end,
      });
      
      if (error) {
        console.warn('RPC get_sector_stats não encontrada, usando query manual');
        // Fallback para query manual
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('sectors')
          .select(`
            id,
            name,
            color,
            profiles:profiles!sector_id(id, role, is_active),
            conversations:conversations!sector_id(id, status, created_at)
          `)
          .eq('is_active', true);
        
        if (fallbackError) throw fallbackError;
        
        return fallbackData?.map(sector => ({
          sector_id: sector.id,
          sector_name: sector.name,
          sector_color: sector.color,
          total_conversations: sector.conversations?.length || 0,
          active_attendants: sector.profiles?.filter((p: any) => p.role === 'attendant' && p.is_active).length || 0,
          new_conversations: sector.conversations?.filter((c: any) => c.status === 'new').length || 0,
          in_progress_conversations: sector.conversations?.filter((c: any) => c.status === 'in_progress').length || 0,
          finished_conversations: sector.conversations?.filter((c: any) => c.status === 'finished').length || 0,
          total_messages: 0, // Seria necessária uma query mais complexa
        })) || [];
      }
      
      return data as SectorStats[];
    },
    enabled: profile?.role === 'admin',
  });

  // Estatísticas diárias
  const { data: dailyStats = [], isLoading: loadingDailyStats } = useQuery({
    queryKey: ['reports', 'daily', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_daily_stats', {
        start_date: dateRange.start,
        end_date: dateRange.end,
      });
      
      if (error) {
        console.warn('RPC get_daily_stats não encontrada, usando query manual');
        // Fallback simplificado
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('conversations')
          .select('created_at, status')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
        
        if (fallbackError) throw fallbackError;
        
        // Agrupar por data
        const groupedByDate = fallbackData?.reduce((acc: any, conv) => {
          const date = new Date(conv.created_at).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = {
              date,
              total_conversations: 0,
              new_conversations: 0,
              finished_conversations: 0,
              total_messages: 0,
            };
          }
          acc[date].total_conversations++;
          if (conv.status === 'new') acc[date].new_conversations++;
          if (conv.status === 'finished') acc[date].finished_conversations++;
          return acc;
        }, {});
        
        return Object.values(groupedByDate || {}) as DailyStats[];
      }
      
      return data as DailyStats[];
    },
    enabled: profile?.role === 'admin',
  });

  // Resumo geral
  const overallStats = {
    totalAttendants: attendantStats.length,
    totalSectors: sectorStats.length,
    totalConversations: attendantStats.reduce((sum, stat) => sum + stat.total_conversations, 0),
    totalMessagesSupport: attendantStats.reduce((sum, stat) => sum + stat.total_messages_sent, 0),
    averageConversationsPerAttendant: attendantStats.length > 0 
      ? Math.round(attendantStats.reduce((sum, stat) => sum + stat.total_conversations, 0) / attendantStats.length)
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