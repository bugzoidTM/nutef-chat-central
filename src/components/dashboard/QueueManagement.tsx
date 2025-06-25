
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Settings, Play, Pause } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSectors } from '@/hooks/useSectors';
import { useQueueSystem } from '@/hooks/useQueueSystem';
import QueueStats from './QueueStats';
import QueueItemCard from './QueueItemCard';
import { toast } from 'sonner';

export const QueueManagement = () => {
  const { profile } = useAuth();
  const { activeSectors } = useSectors();
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    queueItems,
    queueStats,
    loadingQueue,
    assignFromQueue,
    removeFromQueue,
    processTimeouts,
    refetchQueue,
    isAssigningFromQueue,
    isRemovingFromQueue,
    isProcessingTimeouts,
    canTakeFromQueue,
    getItemsByStatus,
  } = useQueueSystem(selectedSector === 'all' ? undefined : selectedSector);

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Acesso restrito a administradores.</p>
      </div>
    );
  }

  const handleAssignToMe = (queueId: string) => {
    if (!canTakeFromQueue()) {
      toast.warning('Você já atingiu o limite de conversas simultâneas');
      return;
    }
    assignFromQueue({ queueId });
  };

  const handleProcessTimeouts = () => {
    processTimeouts();
  };

  const waitingItems = getItemsByStatus('waiting');
  const assignedItems = getItemsByStatus('assigned');
  const timeoutItems = getItemsByStatus('timeout');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fila de Atendimento</h2>
          <p className="text-gray-600">Sistema avançado de gerenciamento de filas</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {activeSectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: sector.color }}
                    />
                    {sector.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button variant="outline" onClick={() => refetchQueue()} disabled={loadingQueue}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingQueue ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <QueueStats stats={queueStats} isLoading={loadingQueue} />

      {/* Controles de Administração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Controles do Sistema
          </CardTitle>
          <CardDescription>
            Ferramentas administrativas para gerenciar a fila
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={handleProcessTimeouts}
              disabled={isProcessingTimeouts}
              variant="outline"
            >
              {isProcessingTimeouts ? 'Processando...' : 'Processar Timeouts'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens da Fila */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Fila</CardTitle>
          <CardDescription>
            {queueItems.length} item{queueItems.length !== 1 ? 's' : ''} na fila
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="waiting" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="waiting">
                Aguardando ({waitingItems.length})
              </TabsTrigger>
              <TabsTrigger value="assigned">
                Atribuídas ({assignedItems.length})
              </TabsTrigger>
              <TabsTrigger value="timeout">
                Timeout ({timeoutItems.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                Todas ({queueItems.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="waiting" className="space-y-4">
              {waitingItems.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {waitingItems.map((item) => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onAssign={handleAssignToMe}
                      canAssign={true}
                      isAssigning={isAssigningFromQueue}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum item aguardando na fila
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="assigned" className="space-y-4">
              {assignedItems.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {assignedItems.map((item) => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onRemove={removeFromQueue}
                      canRemove={true}
                      isRemoving={isRemovingFromQueue}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum item atribuído
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="timeout" className="space-y-4">
              {timeoutItems.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {timeoutItems.map((item) => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onAssign={handleAssignToMe}
                      onRemove={removeFromQueue}
                      canAssign={true}
                      canRemove={true}
                      isAssigning={isAssigningFromQueue}
                      isRemoving={isRemovingFromQueue}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum item com timeout
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="space-y-4">
              {queueItems.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {queueItems.map((item) => (
                    <QueueItemCard
                      key={item.id}
                      item={item}
                      onAssign={item.status === 'waiting' ? handleAssignToMe : undefined}
                      onRemove={item.status !== 'completed' ? removeFromQueue : undefined}
                      canAssign={item.status === 'waiting'}
                      canRemove={item.status !== 'completed'}
                      isAssigning={isAssigningFromQueue}
                      isRemoving={isRemovingFromQueue}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum item na fila
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueManagement;
