import { useEffect } from 'react';
import { usePermissions } from './usePermissions';
import { useConversationTransfers } from './useConversationTransfers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePermissionNotifications = () => {
  const { isAdmin, isAttendant, hasPermission, sectorId } = usePermissions();
  const { pendingTransfers, pendingTransfersCount } = useConversationTransfers();

  // Simplified query to avoid deep type instantiation
  const { data: unassignedConversations = [] } = useQuery({
    queryKey: ['unassigned-conversations', sectorId],
    queryFn: async () => {
      if (!sectorId) return [];
      
      const { data, error } = await supabase
        .from('conversations')
        .select('id, client_name, client_phone, created_at')
        .eq('sector_id', sectorId)
        .is('assigned_to', null)
        .eq('status', 'new')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAttendant && !!sectorId,
    refetchInterval: 30000,
  });

  // Simplified query for escalation conversations
  const { data: conversationsNeedingEscalation = [] } = useQuery({
    queryKey: ['conversations-needing-escalation', sectorId],
    queryFn: async () => {
      if (!sectorId) return [];
      
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('conversations')
        .select('id, client_name, client_phone, last_message_at, assigned_to')
        .eq('sector_id', sectorId)
        .eq('status', 'in_progress')
        .not('assigned_to', 'is', null)
        .lt('last_message_at', twoHoursAgo)
        .order('last_message_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAttendant && hasPermission('escalate_conversations'),
    refetchInterval: 60000,
  });

  // Simplified query for high priority conversations (for admins)
  const { data: highPriorityConversations = [] } = useQuery({
    queryKey: ['high-priority-conversations'],
    queryFn: async () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('conversations')
        .select('id, client_name, client_phone, created_at, sector_id')
        .eq('status', 'new')
        .is('assigned_to', null)
        .lt('created_at', thirtyMinutesAgo)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin && hasPermission('view_all_conversations'),
    refetchInterval: 60000,
  });

  // Notificações para transferências pendentes
  useEffect(() => {
    if (pendingTransfersCount > 0) {
      const lastNotification = localStorage.getItem('last-transfer-notification');
      const now = Date.now();
      
      // Só notificar se passou mais de 5 minutos da última notificação
      if (!lastNotification || now - parseInt(lastNotification) > 5 * 60 * 1000) {
        toast.info(
          `Você tem ${pendingTransfersCount} transferência${pendingTransfersCount > 1 ? 's' : ''} pendente${pendingTransfersCount > 1 ? 's' : ''}`,
          {
            duration: 10000,
            action: {
              label: 'Ver',
              onClick: () => {
                // Aqui você pode implementar navegação para as transferências
                console.log('Navegar para transferências pendentes');
              },
            },
          }
        );
        localStorage.setItem('last-transfer-notification', now.toString());
      }
    }
  }, [pendingTransfersCount]);

  // Notificações para conversas não atribuídas (atendentes)
  useEffect(() => {
    if (isAttendant && unassignedConversations.length > 0) {
      const lastCount = parseInt(localStorage.getItem('last-unassigned-count') || '0');
      
      if (unassignedConversations.length > lastCount) {
        const newConversations = unassignedConversations.length - lastCount;
        toast.info(
          `${newConversations} nova${newConversations > 1 ? 's' : ''} conversa${newConversations > 1 ? 's' : ''} aguardando atendimento`,
          {
            duration: 8000,
            action: {
              label: 'Ver',
              onClick: () => {
                console.log('Navegar para conversas não atribuídas');
              },
            },
          }
        );
      }
      
      localStorage.setItem('last-unassigned-count', unassignedConversations.length.toString());
    }
  }, [isAttendant, unassignedConversations.length]);

  // Notificações para conversas que precisam de escalação
  useEffect(() => {
    if (conversationsNeedingEscalation.length > 0) {
      const lastEscalationNotification = localStorage.getItem('last-escalation-notification');
      const now = Date.now();
      
      // Notificar a cada 30 minutos
      if (!lastEscalationNotification || now - parseInt(lastEscalationNotification) > 30 * 60 * 1000) {
        toast.warning(
          `${conversationsNeedingEscalation.length} conversa${conversationsNeedingEscalation.length > 1 ? 's' : ''} pode${conversationsNeedingEscalation.length > 1 ? 'm' : ''} precisar de escalação`,
          {
            duration: 15000,
            action: {
              label: 'Revisar',
              onClick: () => {
                console.log('Navegar para conversas para escalação');
              },
            },
          }
        );
        localStorage.setItem('last-escalation-notification', now.toString());
      }
    }
  }, [conversationsNeedingEscalation.length]);

  // Notificações de alta prioridade para admins
  useEffect(() => {
    if (isAdmin && highPriorityConversations.length > 0) {
      const lastAdminNotification = localStorage.getItem('last-admin-priority-notification');
      const now = Date.now();
      
      // Notificar a cada 15 minutos
      if (!lastAdminNotification || now - parseInt(lastAdminNotification) > 15 * 60 * 1000) {
        toast.error(
          `ATENÇÃO: ${highPriorityConversations.length} conversa${highPriorityConversations.length > 1 ? 's' : ''} sem atendimento há mais de 30 minutos`,
          {
            duration: 20000,
            action: {
              label: 'Atribuir Agora',
              onClick: () => {
                console.log('Navegar para atribuição de conversas');
              },
            },
          }
        );
        localStorage.setItem('last-admin-priority-notification', now.toString());
      }
    }
  }, [isAdmin, highPriorityConversations.length]);

  useEffect(() => {
    if (isAdmin) {
      console.log('Admin notifications enabled');
    } else if (isAttendant) {
      console.log('Attendant notifications enabled');
    }
  }, [isAdmin, isAttendant]);

  // Função para limpar notificações antigas
  const clearOldNotifications = () => {
    const keys = [
      'last-transfer-notification',
      'last-unassigned-count', 
      'last-escalation-notification',
      'last-admin-priority-notification'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    toast.success('Notificações limpas');
  };

  return {
    // Dados
    pendingTransfersCount,
    unassignedConversationsCount: unassignedConversations.length,
    conversationsNeedingEscalationCount: conversationsNeedingEscalation.length,
    highPriorityConversationsCount: highPriorityConversations.length,
    
    // Listas completas
    unassignedConversations,
    conversationsNeedingEscalation,
    highPriorityConversations,
    
    // Ações
    clearOldNotifications,
    
    // Status
    hasNotifications: (
      pendingTransfersCount > 0 ||
      unassignedConversations.length > 0 ||
      conversationsNeedingEscalation.length > 0 ||
      highPriorityConversations.length > 0
    ),
    
    // Contadores por tipo de notificação
    notificationCounts: {
      transfers: pendingTransfersCount,
      unassigned: unassignedConversations.length,
      escalation: conversationsNeedingEscalation.length,
      highPriority: highPriorityConversations.length,
    },
  };
};
