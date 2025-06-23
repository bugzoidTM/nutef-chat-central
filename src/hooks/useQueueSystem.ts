import { useState } from 'react';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

export interface QueueItem {
  id: string;
  conversation_id: string;
  sector_id: string;
  priority: number;
  created_at: string;
  assigned_at: string | null;
  assigned_to: string | null;
  timeout_at: string | null;
  status: 'waiting' | 'assigned' | 'timeout' | 'completed';
  // Dados relacionados
  conversation?: {
    id: string;
    client_name: string | null;
    client_phone: string;
    last_message_at: string;
  };
  sector?: {
    id: string;
    name: string;
    color: string;
  };
  attendant?: {
    id: string;
    name: string;
  };
}

export interface QueueStats {
  waiting: number;
  assigned: number;
  timeout: number;
  averageWaitTime: number;
  totalProcessed: number;
}

export const useQueueSystem = (sectorId?: string) => {
  const { profile } = useAuth();
  const { isAdmin, isAttendant, sectorId: userSectorId, maxConcurrentChats } = usePermissions();
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);

  // Placeholder data until queue system is implemented
  const queueItems: QueueItem[] = [];
  const queueStats: QueueStats = {
    waiting: 0,
    assigned: 0,
    timeout: 0,
    averageWaitTime: 0,
    totalProcessed: 0
  };
  const pendingConversations: any[] = [];

  const addToQueue = (conversationId: string) => {
    console.log('Add to queue placeholder:', conversationId);
  };

  const assignFromQueue = ({ queueId, attendantId }: { queueId: string; attendantId?: string }) => {
    console.log('Assign from queue placeholder:', { queueId, attendantId });
  };

  const removeFromQueue = (queueId: string) => {
    console.log('Remove from queue placeholder:', queueId);
  };

  return {
    // Dados
    queueItems,
    queueStats,
    pendingConversations,
    
    // Estados de loading
    loadingQueue: false,
    
    // Ações
    addToQueue,
    assignFromQueue,
    removeFromQueue,
    
    // Estados das mutações
    isAddingToQueue: false,
    isAssigningFromQueue: false,
    isRemovingFromQueue: false,
    
    // Configurações
    autoAssignEnabled,
    setAutoAssignEnabled,
    
    // Helpers
    getQueuePosition: (conversationId: string) => {
      const waitingItems = queueItems.filter(item => item.status === 'waiting');
      return waitingItems.findIndex(item => item.conversation_id === conversationId) + 1;
    },
    
    getWaitTime: (queueItem: QueueItem) => {
      const now = new Date();
      const created = new Date(queueItem.created_at);
      return Math.floor((now.getTime() - created.getTime()) / 1000 / 60); // minutos
    },
    
    canTakeFromQueue: () => {
      if (isAdmin) return true;
      if (!isAttendant) return false;
      
      // Verificar se tem espaço para mais conversas
      const currentAssigned = queueItems.filter(item => 
        item.assigned_to === profile?.id && item.status === 'assigned'
      ).length;
      
      return currentAssigned < maxConcurrentChats;
    },
  };
};
