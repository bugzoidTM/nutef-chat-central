
import { useMemo } from 'react';
import { usePermissions } from './usePermissions';
import type { Conversation } from '@/types/dashboard';

export interface ConversationAccess {
  canView: boolean;
  canEdit: boolean;
  canAssign: boolean;
  canTransfer: boolean;
  canClose: boolean;
  canReopen: boolean;
  canViewHistory: boolean;
  canEscalate: boolean;
  reason?: string;
}

export const useConversationPermissions = (conversation?: Conversation | null) => {
  const { 
    hasPermission, 
    isAdmin, 
    isAttendant, 
    sectorId: userSectorId,
    userPermissions 
  } = usePermissions();

  const conversationAccess = useMemo((): ConversationAccess => {
    if (!conversation || !userPermissions?.isActive) {
      return {
        canView: false,
        canEdit: false,
        canAssign: false,
        canTransfer: false,
        canClose: false,
        canReopen: false,
        canViewHistory: false,
        canEscalate: false,
        reason: 'Usuário não ativo ou conversa não encontrada'
      };
    }

    const isAssignedToMe = conversation.assigned_to === userPermissions.managedBy;
    const isFromMySector = conversation.sector === userSectorId;
    const isFinished = conversation.status === 'finished';

    // Admin tem acesso total
    if (isAdmin) {
      return {
        canView: true,
        canEdit: true,
        canAssign: true,
        canTransfer: true,
        canClose: true,
        canReopen: true,
        canViewHistory: true,
        canEscalate: false, // Admins não precisam escalar
      };
    }

    // Atendente
    if (isAttendant) {
      const hasBasicAccess = isAssignedToMe || isFromMySector;

      if (!hasBasicAccess) {
        return {
          canView: false,
          canEdit: false,
          canAssign: false,
          canTransfer: false,
          canClose: false,
          canReopen: false,
          canViewHistory: false,
          canEscalate: false,
          reason: 'Conversa não pertence ao seu setor ou não está atribuída a você'
        };
      }

      return {
        canView: hasBasicAccess,
        canEdit: hasBasicAccess && !isFinished,
        canAssign: false, // Apenas admins podem atribuir
        canTransfer: hasBasicAccess && userPermissions.canTransfer && !isFinished,
        canClose: hasBasicAccess && !isFinished,
        canReopen: false, // Apenas admins podem reabrir
        canViewHistory: hasBasicAccess,
        canEscalate: hasBasicAccess && !isFinished,
      };
    }

    return {
      canView: false,
      canEdit: false,
      canAssign: false,
      canTransfer: false,
      canClose: false,
      canReopen: false,
      canViewHistory: false,
      canEscalate: false,
      reason: 'Tipo de usuário não reconhecido'
    };
  }, [conversation, userPermissions, isAdmin, isAttendant, userSectorId]);

  // Verificações específicas simplificadas
  const canViewConversation = conversationAccess.canView;
  const canEditConversation = conversationAccess.canEdit;
  const canTransferConversation = conversationAccess.canTransfer;
  const canAssignConversation = hasPermission('assign_conversations');
  const canCloseConversation = conversationAccess.canClose;
  const canReopenConversation = conversationAccess.canReopen;

  // Helpers para UI
  const getConversationActions = useMemo(() => {
    const actions = [];

    if (canTransferConversation) {
      actions.push({
        id: 'transfer',
        label: 'Transferir',
        icon: 'ArrowRightLeft',
        variant: 'outline' as const,
      });
    }

    if (canAssignConversation) {
      actions.push({
        id: 'assign',
        label: 'Atribuir',
        icon: 'UserPlus',
        variant: 'outline' as const,
      });
    }

    if (canCloseConversation) {
      actions.push({
        id: 'close',
        label: 'Finalizar',
        icon: 'CheckCircle',
        variant: 'default' as const,
      });
    }

    if (canReopenConversation) {
      actions.push({
        id: 'reopen',
        label: 'Reabrir',
        icon: 'RotateCcw',
        variant: 'outline' as const,
      });
    }

    if (conversationAccess.canEscalate) {
      actions.push({
        id: 'escalate',
        label: 'Escalar',
        icon: 'AlertTriangle',
        variant: 'outline' as const,
      });
    }

    return actions;
  }, [canTransferConversation, canAssignConversation, canCloseConversation, canReopenConversation, conversationAccess.canEscalate]);

  return {
    conversationAccess,
    canViewConversation,
    canEditConversation,
    canTransferConversation,
    canAssignConversation,
    canCloseConversation,
    canReopenConversation,
    getConversationActions,
    // Helpers para estados específicos
    isReadOnly: !canEditConversation,
    isFinished: conversation?.status === 'finished',
    isAssignedToMe: conversation?.assigned_to === userPermissions?.managedBy,
    isFromMySector: conversation?.sector === userSectorId,
  };
};
