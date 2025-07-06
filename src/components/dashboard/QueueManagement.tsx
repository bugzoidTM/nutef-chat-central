
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueueSystem } from '@/hooks/useQueueSystem';
import { QueueStats } from './QueueStats';
import { Clock, User, ArrowRight, CheckCircle, Users, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QueueManagement = () => {
  const queueData = useQueueSystem();
  
  // Usar as propriedades corretas do hook
  const queueItems = queueData.queueItems || [];
  const queueStats = queueData.queueStats;
  const assignFromQueue = queueData.assignFromQueue;
  const removeFromQueue = queueData.removeFromQueue;
  const isLoading = queueData.loadingQueue || false;

  const waitingItems = queueItems.filter(item => item.status === 'waiting') || [];
  const assignedItems = queueItems.filter(item => item.status === 'assigned') || [];
  const completedItems = queueItems.filter(item => item.status === 'completed') || [];

  const QueueItem = ({ item, showActions = true }: { item: any, showActions?: boolean }) => (
    <div className="bg-white border border-gray-100 rounded-lg p-4 mb-3 hover:shadow-sm transition-shadow">
      {/* Header com cliente e setor */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-medium text-sm text-gray-900 truncate">
                +{item.conversation?.client_phone}
              </span>
            </div>
            {item.sector && (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-0.5 flex-shrink-0"
                style={{ 
                  borderColor: item.sector.color,
                  color: item.sector.color,
                  backgroundColor: `${item.sector.color}10`
                }}
              >
                {item.sector.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Informações de tempo */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>Criado: {format(new Date(item.created_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
        </div>
        {item.assigned_at && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <ArrowRight className="h-3 w-3 flex-shrink-0" />
            <span>Atribuído: {format(new Date(item.assigned_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
          </div>
        )}
      </div>

      {/* Footer com status, prioridade e atendente */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant={
              item.status === 'waiting' ? 'destructive' : 
              item.status === 'assigned' ? 'default' : 'secondary'
            }
            className="text-xs px-2 py-0.5"
          >
            {item.status === 'waiting' ? 'Aguardando' : 
             item.status === 'assigned' ? 'Atribuído' : 'Concluído'}
          </Badge>
          
          <Badge variant="outline" className="text-xs px-2 py-0.5 text-gray-600">
            P{item.priority}
          </Badge>

          {item.attendant && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 text-blue-600 border-blue-200 bg-blue-50">
              <Users className="h-3 w-3 mr-1" />
              {item.attendant.name}
            </Badge>
          )}
        </div>

        {/* Ações */}
        {showActions && (
          <div className="flex gap-1.5">
            {item.status === 'waiting' && assignFromQueue && (
              <Button
                size="sm"
                onClick={() => assignFromQueue({ queueId: item.id })}
                className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
              >
                Assumir
              </Button>
            )}
            {item.status === 'assigned' && removeFromQueue && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeFromQueue(item.id)}
                className="h-7 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Concluir
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Gerenciamento de Fila</h2>
          <p className="text-sm text-gray-500">Monitore e gerencie conversas</p>
        </div>

        {/* Estatísticas resumidas */}
        {queueStats && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-orange-600">{queueStats.waiting}</div>
              <div className="text-xs text-orange-500">Aguardando</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-blue-600">{queueStats.assigned}</div>
              <div className="text-xs text-blue-500">Atribuídas</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <div className="text-lg font-semibold text-green-600">{queueStats.totalProcessed}</div>
              <div className="text-xs text-green-500">Hoje</div>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo das abas */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="waiting" className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3 h-9 bg-gray-100">
              <TabsTrigger value="waiting" className="text-xs data-[state=active]:bg-white">
                <Timer className="h-3 w-3 mr-1" />
                Aguardando ({waitingItems.length})
              </TabsTrigger>
              <TabsTrigger value="assigned" className="text-xs data-[state=active]:bg-white">
                <Users className="h-3 w-3 mr-1" />
                Atribuídas ({assignedItems.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs data-[state=active]:bg-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Concluídas ({completedItems.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="waiting" className="h-full m-0 p-4 overflow-y-auto">
              {waitingItems.length === 0 ? (
                <div className="text-center py-12">
                  <Timer className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">Nenhuma conversa aguardando</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {waitingItems.map((item) => (
                    <QueueItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assigned" className="h-full m-0 p-4 overflow-y-auto">
              {assignedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">Nenhuma conversa atribuída</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedItems.map((item) => (
                    <QueueItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="h-full m-0 p-4 overflow-y-auto">
              {completedItems.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">Nenhuma conversa concluída hoje</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedItems.map((item) => (
                    <QueueItem key={item.id} item={item} showActions={false} />
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default QueueManagement;
