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

  // Buscar permissões detalhadas do usuário
  const { data: userPermissions } = useQuery({
    queryKey: ['user-permissions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role, sector_id, can_transfer, max_concurrent_chats, managed_by, is_active')
        .eq('id', profile.id)
        .single();
      
      if (error) throw error;
      return data as UserPermissions;
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

  // Verificar permissões específicas para uma conversa
  const hasConversationPermission = useMemo(() => {
    return (conversationId: string, permission: ConversationPermission, conversation?: {
      sector_id: string | null;
      assigned_to: string | null;
      status: string;
    }): boolean => {
      if (!userPermissions || !userPermissions.isActive) return false;

      const { role, sectorId } = userPermissions;

      // Admins têm todas as permissões
      if (role === 'admin') return true;

      if (role === 'attendant') {
        const isAssignedToMe = conversation?.assigned_to === profile?.id;
        const isFromMySector = conversation?.sector_id === sectorId;
        const hasAccess = isAssignedToMe || isFromMySector;

        switch (permission) {
          case 'read':
            return hasAccess;

          case 'write':
            return hasAccess;

          case 'transfer':
            return hasAccess && userPermissions.canTransfer;

          case 'assign':
            return false; // Apenas admins podem atribuir

          case 'close':
            return hasAccess;

          case 'reopen':
            return false; // Apenas admins podem reabrir

          default:
            return false;
        }
      }

      return false;
    };
  }, [userPermissions, profile?.id]);

  // Verificar se pode acessar setor específico
  const canAccessSector = useMemo(() => {
    return (sectorId: string | null): boolean => {
      if (!userPermissions || !userPermissions.isActive) return false;
      return userPermissions.role === 'admin' || userPermissions.sectorId === sectorId;
    };
  }, [userPermissions]);

  // Verificar se pode gerenciar um atendente específico
  const canManageAttendant = useMemo(() => {
    return (attendantId: string): boolean => {
      return userPermissions?.role === 'admin' && userPermissions.isActive;
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
        // Pode transferir dentro do próprio setor ou para outros setores se tiver permissão
        return true;
      }

      return false;
    };
  }, [userPermissions]);

  // Verificar limite de conversas simultâneas
  const canTakeNewConversation = useMemo(() => {
    return (currentConversationCount: number): boolean => {
      if (!userPermissions || !userPermissions.isActive) return false;

      // Admins não têm limite
      if (userPermissions.role === 'admin') return true;

      // Verificar limite para atendentes
      return currentConversationCount < userPermissions.maxConcurrentChats;
    };
  }, [userPermissions]);

  // Lista de permissões do usuário atual
  const permissions = useMemo(() => {
    if (!userPermissions) return [];

    const allPermissions: Permission[] = [
      'view_all_conversations',
      'view_sector_conversations', 
      'view_assigned_conversations',
      'transfer_conversations',
      'assign_conversations',
      'manage_attendants',
      'manage_sectors',
      'view_reports',
      'manage_settings',
      'escalate_conversations',
      'close_conversations',
      'reopen_conversations',
      'view_conversation_history',
      'export_data',
      'manage_instances'
    ];

    return allPermissions.filter(permission => hasPermission(permission));
  }, [hasPermission, userPermissions]);

  return {
    userPermissions,
    permissions,
    hasPermission,
    hasConversationPermission,
    canAccessSector,
    canManageAttendant,
    canTransferTo,
    canTakeNewConversation,
    isAdmin: userPermissions?.role === 'admin',
    isAttendant: userPermissions?.role === 'attendant',
    isActive: userPermissions?.isActive || false,
    sectorId: userPermissions?.sectorId,
    maxConcurrentChats: userPermissions?.maxConcurrentChats || 0,
  };
}; 