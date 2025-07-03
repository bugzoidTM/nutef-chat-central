
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Settings, Clock } from 'lucide-react';
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
      <div className="p-6">
        <div className="text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">Fila de Atendimento</h3>
          <p className="text-gray-500">Acesso restrito a administradores.</p>
        </div>
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Fila de Atendimento</h2>
            <p className="text-sm text-gray-600">Gerenciamento de filas</p>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => refetchQueue()} disabled={loadingQueue}>
            <RefreshCw className={`h-4 w-4 ${loadingQueue ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-full">
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
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <QueueStats stats={queueStats} isLoading={loadingQueue} />
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <Button
          onClick={handleProcessTimeouts}
          disabled={isProcessingTimeouts}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Settings className="h-4 w-4 mr-2" />
          {isProcessingTimeouts ? 'Processando...' : 'Processar Timeouts'}
        </Button>
      </div>

      {/* Queue Items */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <Tabs defaultValue="waiting" className="h-full">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="waiting" className="text-xs">
                Aguardando ({waitingItems.length})
              </TabsTrigger>
              <TabsTrigger value="assigned" className="text-xs">
                Atribuídas ({assignedItems.length})
              </TabsTrigger>
              <TabsTrigger value="timeout" className="text-xs">
                Timeout ({timeoutItems.length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-4">
            <TabsContent value="waiting" className="mt-0">
              {waitingItems.length > 0 ? (
                <div className="space-y-3">
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
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhum item aguardando na fila</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="assigned" className="mt-0">
              {assignedItems.length > 0 ? (
                <div className="space-y-3">
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
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhum item atribuído</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="timeout" className="mt-0">
              {timeoutItems.length > 0 ? (
                <div className="space-y-3">
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
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhum item com timeout</p>
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
