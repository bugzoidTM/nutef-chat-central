
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-base font-semibold mb-2">Fila de Atendimento</h3>
          <p className="text-sm text-gray-500">Acesso restrito a administradores.</p>
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
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">Fila</h2>
            <p className="text-sm text-gray-600 truncate">Gerenciamento</p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchQueue()} 
            disabled={loadingQueue}
            className="shrink-0 ml-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingQueue ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="w-full">
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {activeSectors.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: sector.color }}
                    />
                    <span className="truncate">{sector.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <QueueStats stats={queueStats} isLoading={loadingQueue} />
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <Button
          onClick={handleProcessTimeouts}
          disabled={isProcessingTimeouts}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Settings className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate min-w-0">
            {isProcessingTimeouts ? 'Processando...' : 'Processar Timeouts'}
          </span>
        </Button>
      </div>

      {/* Queue Items */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <Tabs defaultValue="waiting" className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3 gap-1">
              <TabsTrigger value="waiting" className="text-xs px-1 py-1 min-w-0">
                <div className="flex flex-col items-center min-w-0">
                  <span className="truncate w-full text-center">Aguardando</span>
                  <span className="text-xs opacity-75">({waitingItems.length})</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="assigned" className="text-xs px-1 py-1 min-w-0">
                <div className="flex flex-col items-center min-w-0">
                  <span className="truncate w-full text-center">Atribuídas</span>
                  <span className="text-xs opacity-75">({assignedItems.length})</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="timeout" className="text-xs px-1 py-1 min-w-0">
                <div className="flex flex-col items-center min-w-0">
                  <span className="truncate w-full text-center">Timeout</span>
                  <span className="text-xs opacity-75">({timeoutItems.length})</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="waiting" className="h-full mt-0">
              <ScrollArea className="h-full">
                {waitingItems.length > 0 ? (
                  <div className="p-4 space-y-3">
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
                  <div className="h-full flex items-center justify-center text-gray-500 p-4">
                    <div className="text-center">
                      <Clock className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Nenhum item aguardando</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="assigned" className="h-full mt-0">
              <ScrollArea className="h-full">
                {assignedItems.length > 0 ? (
                  <div className="p-4 space-y-3">
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
                  <div className="h-full flex items-center justify-center text-gray-500 p-4">
                    <div className="text-center">
                      <Clock className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Nenhum item atribuído</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="timeout" className="h-full mt-0">
              <ScrollArea className="h-full">
                {timeoutItems.length > 0 ? (
                  <div className="p-4 space-y-3">
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
                  <div className="h-full flex items-center justify-center text-gray-500 p-4">
                    <div className="text-center">
                      <Clock className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Nenhum item com timeout</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default QueueManagement;
