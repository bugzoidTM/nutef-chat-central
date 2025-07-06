
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueueSystem } from '@/hooks/useQueueSystem';
import { QueueStats } from './QueueStats';
import { Clock, User, ArrowRight, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const QueueManagement = () => {
  const { 
    queueItems, 
    isLoading, 
    assignToMe, 
    completeItem,
    stats 
  } = useQueueSystem();

  const waitingItems = queueItems?.filter(item => item.status === 'waiting') || [];
  const assignedItems = queueItems?.filter(item => item.status === 'assigned') || [];
  const completedItems = queueItems?.filter(item => item.status === 'completed') || [];

  const QueueItem = ({ item, showActions = true }: { item: any, showActions?: boolean }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Cliente e setor */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm truncate">
                  Cliente: +{item.conversations?.client_phone}
                </span>
              </div>
              {item.sectors && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: item.sectors.color,
                    color: item.sectors.color 
                  }}
                >
                  {item.sectors.name}
                </Badge>
              )}
            </div>

            {/* Informações de tempo */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Criado: {format(new Date(item.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                </span>
              </div>
              {item.assigned_at && (
                <div className="flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  <span>
                    Atribuído: {format(new Date(item.assigned_at), 'dd/MM HH:mm', { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>

            {/* Status e prioridade */}
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  item.status === 'waiting' ? 'destructive' : 
                  item.status === 'assigned' ? 'default' : 'secondary'
                }
                className="text-xs"
              >
                {item.status === 'waiting' ? 'Aguardando' : 
                 item.status === 'assigned' ? 'Atribuído' : 'Concluído'}
              </Badge>
              
              <Badge variant="outline" className="text-xs">
                Prioridade: {item.priority}
              </Badge>

              {item.assigned_to_profile && (
                <Badge variant="outline" className="text-xs">
                  {item.assigned_to_profile.nickname || item.assigned_to_profile.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Ações */}
          {showActions && (
            <div className="flex flex-col gap-2 ml-4">
              {item.status === 'waiting' && (
                <Button
                  size="sm"
                  onClick={() => assignToMe(item.id)}
                  className="h-8 px-3 text-xs"
                >
                  Assumir
                </Button>
              )}
              {item.status === 'assigned' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => completeItem(item.id)}
                  className="h-8 px-3 text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Concluir
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gerenciamento de Fila</h1>
        <p className="text-gray-600">Gerencie e monitore o atendimento de conversas</p>
      </div>

      {/* Estatísticas */}
      <div className="mb-6">
        <QueueStats stats={stats} />
      </div>

      {/* Abas da fila */}
      <Tabs defaultValue="waiting" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger value="waiting" className="text-sm">
            Aguardando ({waitingItems.length})
          </TabsTrigger>
          <TabsTrigger value="assigned" className="text-sm">
            Atribuídas ({assignedItems.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-sm">
            Concluídas ({completedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversas Aguardando Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {waitingItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma conversa aguardando atendimento</p>
                </div>
              ) : (
                waitingItems.map((item) => (
                  <QueueItem key={item.id} item={item} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversas Atribuídas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {assignedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma conversa atribuída</p>
                </div>
              ) : (
                assignedItems.map((item) => (
                  <QueueItem key={item.id} item={item} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conversas Concluídas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {completedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma conversa concluída hoje</p>
                </div>
              ) : (
                completedItems.map((item) => (
                  <QueueItem key={item.id} item={item} showActions={false} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QueueManagement;
