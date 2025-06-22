import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQueueSystem } from '@/hooks/useQueueSystem';
import { usePermissions } from '@/hooks/usePermissions';
import { useSectors } from '@/hooks/useSectors';
import { Clock, Users, AlertTriangle, CheckCircle, ArrowRight, Phone, User } from 'lucide-react';

export const QueueManagement = () => {
  const { isAdmin, sectorId } = usePermissions();
  const { sectors } = useSectors();
  const [selectedSectorId, setSelectedSectorId] = useState<string | undefined>(sectorId || undefined);
  
  const {
    queueItems,
    queueStats,
    loadingQueue,
    assignFromQueue,
    removeFromQueue,
    isAssigningFromQueue,
    autoAssignEnabled,
    setAutoAssignEnabled,
    getQueuePosition,
    getWaitTime,
    canTakeFromQueue,
  } = useQueueSystem(selectedSectorId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500';
      case 'assigned': return 'bg-blue-500';
      case 'timeout': return 'bg-red-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return 'Aguardando';
      case 'assigned': return 'Atribuída';
      case 'timeout': return 'Timeout';
      case 'completed': return 'Concluída';
      default: return status;
    }
  };

  const QueueStatsCards = () => (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Aguardando
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{queueStats?.waiting || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Em Atendimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{queueStats?.assigned || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Timeout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{queueStats?.timeout || 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Processadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{queueStats?.totalProcessed || 0}</div>
        </CardContent>
      </Card>
    </div>
  );

  const QueueItemCard = ({ item }: { item: any }) => {
    const waitTime = getWaitTime(item);
    const position = getQueuePosition(item.conversation_id);
    
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
                {item.status === 'waiting' && position > 0 && (
                  <Badge variant="secondary">#{position} na fila</Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {item.conversation?.client_name || 'Cliente sem nome'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {item.conversation?.client_phone || ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.sector?.color || '#666' }}
                  />
                  <span className="text-sm">{item.sector?.name}</span>
                </div>

                <div className="text-xs text-muted-foreground">
                  Aguardando há {waitTime} minutos
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 ml-4">
              {item.status === 'waiting' && canTakeFromQueue() && (
                <Button
                  size="sm"
                  onClick={() => assignFromQueue({ queueId: item.id })}
                  disabled={isAssigningFromQueue}
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Atender
                </Button>
              )}

              {item.status === 'assigned' && isAdmin && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => removeFromQueue(item.id)}
                >
                  Finalizar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const QueueList = ({ status }: { status: string }) => {
    const filteredItems = queueItems.filter(item => item.status === status);
    
    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma conversa {getStatusLabel(status).toLowerCase()}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredItems.map(item => (
          <QueueItemCard key={item.id} item={item} />
        ))}
      </div>
    );
  };

  if (loadingQueue) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fila de Atendimento</h2>
          <p className="text-muted-foreground">
            Gerencie a fila de conversas
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-4">
            <select
              value={selectedSectorId || ''}
              onChange={(e) => setSelectedSectorId(e.target.value || undefined)}
              className="border rounded px-3 py-2"
            >
              <option value="">Todos os setores</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-assign"
                checked={autoAssignEnabled}
                onCheckedChange={setAutoAssignEnabled}
              />
              <Label htmlFor="auto-assign">Auto-reatribuição</Label>
            </div>
          </div>
        )}
      </div>

      <QueueStatsCards />

      <Tabs defaultValue="waiting" className="space-y-4">
        <TabsList>
          <TabsTrigger value="waiting">
            Aguardando ({queueItems.filter(i => i.status === 'waiting').length})
          </TabsTrigger>
          <TabsTrigger value="assigned">
            Em Atendimento ({queueItems.filter(i => i.status === 'assigned').length})
          </TabsTrigger>
          <TabsTrigger value="timeout">
            Timeout ({queueItems.filter(i => i.status === 'timeout').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting">
          <QueueList status="waiting" />
        </TabsContent>

        <TabsContent value="assigned">
          <QueueList status="assigned" />
        </TabsContent>

        <TabsContent value="timeout">
          <QueueList status="timeout" />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 