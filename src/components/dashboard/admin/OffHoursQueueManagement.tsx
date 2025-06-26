
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Clock, 
  Phone, 
  User, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Edit,
  Calendar
} from 'lucide-react';
import { useOffHoursQueue } from '@/hooks/useOffHoursQueue';
import { useSectors } from '@/hooks/useSectors';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const OffHoursQueueManagement = () => {
  const { sectors } = useSectors();
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');

  const {
    queueItems,
    isLoading,
    markAsContacted,
    markAsResolved,
    updateNotes,
    getQueueStats,
    isMarkingContacted,
    isMarkingResolved,
    isUpdatingNotes
  } = useOffHoursQueue(selectedSector === 'all' ? undefined : selectedSector);

  const stats = getQueueStats();

  const handleEditNotes = (item: any) => {
    setEditingNotes(item.id);
    setNotesText(item.notes || '');
  };

  const handleSaveNotes = () => {
    if (editingNotes) {
      updateNotes.mutate({ queueId: editingNotes, notes: notesText });
      setEditingNotes(null);
      setNotesText('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-500';
      case 'contacted': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'Aguardando';
      case 'contacted': return 'Contatado';
      case 'resolved': return 'Resolvido';
      default: return status;
    }
  };

  const filteredItems = selectedSector === 'all' 
    ? queueItems 
    : queueItems.filter(item => item.sector_id === selectedSector);

  const waitingItems = filteredItems.filter(item => item.status === 'waiting');
  const contactedItems = filteredItems.filter(item => item.status === 'contacted');
  const resolvedItems = filteredItems.filter(item => item.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fila Fora do Horário</h2>
          <p className="text-muted-foreground">
            Gerenciar contatos recebidos fora do horário de atendimento
          </p>
        </div>
        
        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {sectors.map((sector) => (
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatados</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.contacted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Antigo</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats.oldestWaiting ? 
                formatDistanceToNow(new Date(stats.oldestWaiting.received_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })
                : 'N/A'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Items */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Fila</CardTitle>
          <CardDescription>
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="waiting" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="waiting">
                Aguardando ({waitingItems.length})
              </TabsTrigger>
              <TabsTrigger value="contacted">
                Contatados ({contactedItems.length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolvidos ({resolvedItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="waiting" className="space-y-4">
              {waitingItems.length > 0 ? (
                <div className="space-y-4">
                  {waitingItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(item.status)} text-white`}
                              >
                                {getStatusText(item.status)}
                              </Badge>
                              {item.sector && (
                                <Badge variant="secondary">
                                  <div 
                                    className="w-2 h-2 rounded-full mr-1" 
                                    style={{ backgroundColor: item.sector.color }}
                                  />
                                  {item.sector.name}
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {item.client_name || 'Cliente não identificado'}
                                </span>
                                <span className="text-muted-foreground">
                                  ({item.client_phone})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  Recebido {formatDistanceToNow(new Date(item.received_at), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </span>
                              </div>

                              {item.notes && (
                                <div className="text-sm text-muted-foreground mt-2 p-2 bg-gray-50 rounded">
                                  {item.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Editar Observações</DialogTitle>
                                  <DialogDescription>
                                    Adicionar observações sobre este contato
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    placeholder="Digite suas observações..."
                                    value={editingNotes === item.id ? notesText : item.notes || ''}
                                    onChange={(e) => {
                                      setEditingNotes(item.id);
                                      setNotesText(e.target.value);
                                    }}
                                    rows={4}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      onClick={handleSaveNotes}
                                      disabled={isUpdatingNotes}
                                    >
                                      Salvar
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              onClick={() => markAsContacted.mutate(item.id)}
                              disabled={isMarkingContacted}
                              size="sm"
                            >
                              Marcar como Contatado
                            </Button>

                            <Button
                              onClick={() => markAsResolved.mutate(item.id)}
                              disabled={isMarkingResolved}
                              variant="outline"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum item aguardando contato
                </div>
              )}
            </TabsContent>

            <TabsContent value="contacted" className="space-y-4">
              {contactedItems.length > 0 ? (
                <div className="space-y-4">
                  {contactedItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(item.status)} text-white`}
                              >
                                {getStatusText(item.status)}
                              </Badge>
                              {item.sector && (
                                <Badge variant="secondary">
                                  <div 
                                    className="w-2 h-2 rounded-full mr-1" 
                                    style={{ backgroundColor: item.sector.color }}
                                  />
                                  {item.sector.name}
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {item.client_name || 'Cliente não identificado'}
                                </span>
                                <span className="text-muted-foreground">
                                  ({item.client_phone})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  Contatado {item.contacted_at && formatDistanceToNow(new Date(item.contacted_at), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </span>
                                {item.attendant && (
                                  <span className="text-sm text-muted-foreground">
                                    por {item.attendant.name}
                                  </span>
                                )}
                              </div>

                              {item.notes && (
                                <div className="text-sm text-muted-foreground mt-2 p-2 bg-gray-50 rounded">
                                  {item.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => markAsResolved.mutate(item.id)}
                              disabled={isMarkingResolved}
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolver
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum item contatado
                </div>
              )}
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              {resolvedItems.length > 0 ? (
                <div className="space-y-4">
                  {resolvedItems.map((item) => (
                    <Card key={item.id} className="opacity-75">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(item.status)} text-white`}
                              >
                                {getStatusText(item.status)}
                              </Badge>
                              {item.sector && (
                                <Badge variant="secondary">
                                  <div 
                                    className="w-2 h-2 rounded-full mr-1" 
                                    style={{ backgroundColor: item.sector.color }}
                                  />
                                  {item.sector.name}
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {item.client_name || 'Cliente não identificado'}
                                </span>
                                <span className="text-muted-foreground">
                                  ({item.client_phone})
                                </span>
                              </div>

                              {item.notes && (
                                <div className="text-sm text-muted-foreground mt-2 p-2 bg-gray-50 rounded">
                                  {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum item resolvido
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
