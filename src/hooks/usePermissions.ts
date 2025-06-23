
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Permission = 
  | 'view_all_conversations'
  | 'view_sector_conversations'
  | 'view_assigned_conversations'
  | 'transfer_conversations'
  | 'assign_conversations'
  | 'manage_attendants'
  | 'manage_sectors'
  | 'view_reports'
  | 'manage_settings'
  | 'escalate_conversations'
  | 'close_conversations'
  | 'reopen_conversations'
  | 'view_conversation_history'
  | 'export_data'
  | 'manage_instances';

export type ConversationPermission = 
  | 'read'
  | 'write' 
  | 'transfer'
  | 'assign'
  | 'close'
  | 'reopen';

interface UserPermissions {
  role: 'admin' | 'attendant';
  sectorId: string | null;
  canTransfer: boolean;
  maxConcurrentChats: number;
  managedBy: string | null;
  isActive: boolean;
}

export const usePermissions = () => {
  const { profile } = useAuth();

  // Buscar permissões detalhadas do usuário usando os novos campos
  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role, sector_id, managed_by, is_active, can_transfer, max_concurrent_chats')
        .eq('id', profile.id)
        .single();
      
      if (error) throw error;
      return {
        role: data.role,
        sectorId: data.sector_id,
        canTransfer: data.can_transfer || true,
        maxConcurrentChats: data.max_concurrent_chats || 10,
        managedBy: data.managed_by,
        isActive: data.is_active,
      } as UserPermissions;
    },
    enabled: !!profile?.id,
  });

  // Verificar se o usuário tem uma permissão específica
  const hasPermission = useMemo(() => {
    return (permission: Permission): boolean => {
      if (!userPermissions || !userPermissions.isActive) return false;

      const { role, canTransfer } = userPermissions;

      switch (permission) {
        // Permissões exclusivas de admin
        case 'view_all_conversations':
        case 'manage_attendants':
        case 'manage_sectors':
        case 'view_reports':
        case 'manage_settings':
        case 'manage_instances':
        case 'export_data':
          return role === 'admin';

        // Permissões que dependem de configuração
        case 'transfer_conversations':
          return role === 'admin' || (role === 'attendant' && canTransfer);

        case 'assign_conversations':
          return role === 'admin';

        // Permissões básicas para atendentes ativos
        case 'view_sector_conversations':
        case 'view_assigned_conversations':
        case 'close_conversations':
        case 'view_conversation_history':
          return (role === 'admin') || (role === 'attendant' && userPermissions.isActive);

        case 'escalate_conversations':
          return role === 'attendant' && userPermissions.isActive;

        case 'reopen_conversations':
          return role === 'admin';

        default:
          return false;
      }
    };
  }, [userPermissions]);

  // Verificar se pode transferir para um atendente/setor específico
  const canTransferTo = useMemo(() => {
    return (targetSectorId: string | null, targetAttendantId?: string): boolean => {
      if (!userPermissions || !userPermissions.isActive) return false;
      
      const { role, canTransfer } = userPermissions;

      // Admins podem transferir para qualquer lugar
      if (role === 'admin') return true;

      // Atendentes precisam ter permissão de transferência
      if (role === 'attendant' && canTransfer) {
        return true;
      }

      return false;
    };
  }, [userPermissions]);

  return {
    userPermissions,
    hasPermission,
    canTransferTo,
    isAdmin: userPermissions?.role === 'admin',
    isAttendant: userPermissions?.role === 'attendant',
    isActive: userPermissions?.isActive || false,
    sectorId: userPermissions?.sectorId,
    maxConcurrentChats: userPermissions?.maxConcurrentChats || 0,
  };
};
