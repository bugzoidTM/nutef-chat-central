
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkingHours {
  id: string;
  sector_id: string;
  is_enabled: boolean;
  start_time: string;
  end_time: string;
  working_days: number[];
  timezone: string;
  auto_response_enabled: boolean;
  auto_response_message: string;
  queue_enabled: boolean;
  queue_message: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateWorkingHoursData {
  is_enabled?: boolean;
  start_time?: string;
  end_time?: string;
  working_days?: number[];
  timezone?: string;
  auto_response_enabled?: boolean;
  auto_response_message?: string;
  queue_enabled?: boolean;
  queue_message?: string;
}

export const useWorkingHours = (sectorId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch working hours for sector
  const { data: workingHours, isLoading } = useQuery({
    queryKey: ['working-hours', sectorId],
    queryFn: async () => {
      if (!sectorId) return null;

      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('sector_id', sectorId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching working hours:', error);
        throw error;
      }

      return data as WorkingHours | null;
    },
    enabled: !!sectorId,
  });

  // Update working hours
  const updateWorkingHours = useMutation({
    mutationFn: async ({ sectorId, data }: { sectorId: string; data: UpdateWorkingHoursData }) => {
      // First try to update, if not found, insert
      const { data: existing } = await supabase
        .from('working_hours')
        .select('id')
        .eq('sector_id', sectorId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('working_hours')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('sector_id', sectorId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('working_hours')
          .insert({
            sector_id: sectorId,
            ...data
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-hours'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações de horário foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if sector is currently within working hours
  const isWithinWorkingHours = (sectorId: string): boolean => {
    if (!workingHours || !workingHours.is_enabled) return true;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Check if current day is a working day
    if (!workingHours.working_days.includes(currentDay)) {
      return false;
    }

    // Check if current time is within working hours
    if (currentTime < workingHours.start_time || currentTime > workingHours.end_time) {
      return false;
    }

    return true;
  };

  // Get auto response message with variables replaced
  const getAutoResponseMessage = (): string => {
    if (!workingHours || !workingHours.auto_response_enabled) return '';

    return workingHours.auto_response_message
      .replace('{start_time}', workingHours.start_time)
      .replace('{end_time}', workingHours.end_time);
  };

  return {
    workingHours,
    isLoading,
    updateWorkingHours,
    isUpdating: updateWorkingHours.isPending,
    isWithinWorkingHours,
    getAutoResponseMessage,
  };
};
