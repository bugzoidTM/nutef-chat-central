
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { toast } from 'sonner';

export interface SatisfactionSurvey {
  id: string;
  conversation_id: string;
  client_phone: string;
  rating: number;
  comment: string | null;
  submitted_at: string;
  created_at: string;
  attendant_id: string | null;
  sector_id: string | null;
  // Dados relacionados
  conversation?: {
    id: string;
    client_name: string | null;
    client_phone: string;
  };
  attendant?: {
    id: string;
    name: string;
  };
  sector?: {
    id: string;
    name: string;
    color: string;
  };
}

export interface SatisfactionStats {
  totalSurveys: number;
  averageRating: number;
  ratingDistribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  responseRate: number;
}

export interface SurveyFilters {
  startDate?: string;
  endDate?: string;
  sectorId?: string;
  attendantId?: string;
}

export const useSatisfactionSurveys = (filters: SurveyFilters = {}) => {
  const { profile } = useAuth();
  const { isAdmin, isAttendant, sectorId: userSectorId } = usePermissions();
  const queryClient = useQueryClient();

  // Buscar pesquisas de satisfação
  const { data: surveys = [], isLoading: loadingSurveys } = useQuery({
    queryKey: ['satisfaction-surveys', filters],
    queryFn: async () => {
      let query = supabase
        .from('satisfaction_surveys')
        .select(`
          *,
          conversation:conversation_id (
            id,
            client_name,
            client_phone
          ),
          attendant:attendant_id (
            id,
            name
          ),
          sector:sector_id (
            id,
            name,
            color
          )
        `);

      // Aplicar filtros
      if (filters.startDate) {
        query = query.gte('submitted_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('submitted_at', filters.endDate);
      }
      if (filters.sectorId) {
        query = query.eq('sector_id', filters.sectorId);
      }
      if (filters.attendantId) {
        query = query.eq('attendant_id', filters.attendantId);
      }

      // Se não é admin, filtrar por setor
      if (!isAdmin && userSectorId) {
        query = query.eq('sector_id', userSectorId);
      }

      query = query.order('submitted_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return data as SatisfactionSurvey[];
    },
    enabled: !!(profile && (isAdmin || isAttendant)),
    refetchInterval: 30000,
  });

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['satisfaction-stats', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_satisfaction_stats', {
        p_start_date: filters.startDate || null,
        p_end_date: filters.endDate || null,
        p_sector_id: filters.sectorId || null,
        p_attendant_id: filters.attendantId || null,
      });

      if (error) throw error;
      
      const statsData = data as unknown;
      
      if (statsData && typeof statsData === 'object' && statsData !== null) {
        const statsObj = statsData as Record<string, unknown>;
        return {
          totalSurveys: Number(statsObj.totalSurveys) || 0,
          averageRating: Number(statsObj.averageRating) || 0,
          ratingDistribution: statsObj.ratingDistribution as SatisfactionStats['ratingDistribution'] || {
            '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
          },
          responseRate: Number(statsObj.responseRate) || 0,
        } as SatisfactionStats;
      }
      
      return {
        totalSurveys: 0,
        averageRating: 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        responseRate: 0,
      } as SatisfactionStats;
    },
    enabled: !!(profile && (isAdmin || isAttendant)),
    refetchInterval: 60000,
  });

  // Enviar pesquisa manualmente
  const sendSurveyMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase.functions.invoke('send-satisfaction-survey', {
        body: { conversationId }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['satisfaction-surveys'] });
      toast.success('Pesquisa de satisfação enviada');
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar pesquisa: ${error.message}`);
    },
  });

  return {
    // Dados
    surveys,
    stats: stats || {
      totalSurveys: 0,
      averageRating: 0,
      ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      responseRate: 0,
    },
    
    // Estados
    loadingSurveys,
    
    // Ações
    sendSurvey: sendSurveyMutation.mutate,
    isSendingSurvey: sendSurveyMutation.isPending,
    
    // Helpers
    getRatingLabel: (rating: number) => {
      const labels = {
        1: 'Muito Insatisfeito',
        2: 'Insatisfeito',
        3: 'Neutro',
        4: 'Satisfeito',
        5: 'Muito Satisfeito'
      };
      return labels[rating as keyof typeof labels] || 'N/A';
    },
    
    getRatingColor: (rating: number) => {
      if (rating <= 2) return 'text-red-600';
      if (rating === 3) return 'text-yellow-600';
      return 'text-green-600';
    },
    
    getOverallSatisfaction: () => {
      if (!stats) return 'N/A';
      if (stats.averageRating >= 4.5) return 'Excelente';
      if (stats.averageRating >= 4) return 'Muito Bom';
      if (stats.averageRating >= 3) return 'Bom';
      if (stats.averageRating >= 2) return 'Regular';
      return 'Ruim';
    }
  };
};
