
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Phone, AlertTriangle } from 'lucide-react';
import { QueueItem } from '@/hooks/useQueueSystem';

interface QueueItemCardProps {
  item: QueueItem;
  onAssign?: (queueId: string) => void;
  onRemove?: (queueId: string) => void;
  canAssign?: boolean;
  canRemove?: boolean;
  isAssigning?: boolean;
  isRemoving?: boolean;
}

export const QueueItemCard: React.FC<QueueItemCardProps> = ({
  item,
  onAssign,
  onRemove,
  canAssign = false,
  canRemove = false,
  isAssigning = false,
  isRemoving = false,
}) => {
  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) {
      return <Badge variant="destructive">Alta</Badge>;
    }
    if (priority >= 2) {
      return <Badge variant="secondary">Média</Badge>;
    }
    return <Badge variant="outline">Normal</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      waiting: { label: 'Aguardando', variant: 'secondary' as const },
      assigned: { label: 'Atribuída', variant: 'default' as const },
      timeout: { label: 'Timeout', variant: 'destructive' as const },
      completed: { label: 'Finalizada', variant: 'outline' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.waiting;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getWaitTime = () => {
    const now = new Date();
    const created = new Date(item.created_at);
    const minutes = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
    
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const isTimeout = item.status === 'timeout' || 
    (item.timeout_at && new Date(item.timeout_at) < new Date());

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isTimeout ? 'border-red-200 bg-red-50' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header com prioridade e status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getPriorityBadge(item.priority)}
              {getStatusBadge(item.status)}
            </div>
            {isTimeout && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>

          {/* Informações do cliente */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">
                {item.conversation?.client_name || 'Cliente não identificado'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {item.conversation?.client_phone}
              </span>
            </div>
          </div>

          {/* Setor */}
          {item.sector && (
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.sector.color }}
              />
              <span className="text-sm text-gray-600">{item.sector.name}</span>
            </div>
          )}

          {/* Tempo de espera */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className={`text-sm ${isTimeout ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              Aguardando há {getWaitTime()}
            </span>
          </div>

          {/* Atendente atribuído */}
          {item.attendant && (
            <div className="text-sm text-gray-600">
              Atribuído para: <span className="font-medium">{item.attendant.name}</span>
            </div>
          )}

          {/* Timeout */}
          {item.timeout_at && item.status === 'assigned' && (
            <div className="text-sm text-orange-600">
              Timeout em: {new Date(item.timeout_at).toLocaleTimeString('pt-BR')}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            {canAssign && item.status === 'waiting' && (
              <Button
                size="sm"
                onClick={() => onAssign?.(item.id)}
                disabled={isAssigning}
                className="flex-1"
              >
                {isAssigning ? 'Atribuindo...' : 'Atender'}
              </Button>
            )}
            
            {canRemove && item.status !== 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemove?.(item.id)}
                disabled={isRemoving}
              >
                {isRemoving ? 'Removendo...' : 'Remover'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QueueItemCard;
