
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSectors } from '@/hooks/useSectors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Users, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface QueueConversation {
  id: string;
  client_name: string | null;
  client_phone: string;
  sector_id: string | null;
  status: string;
  created_at: string;
  last_message_at: string;
  waiting_time: number;
  sectors?: {
    name: string;
    color: string;
  };
}

export const QueueManagement = () => {
  const { profile } = useAuth();
  const { activeSectors } = useSectors();
  const queryClient = useQueryClient();
  const [selectedSector, setSelectedSector] = useState<string>('all');

  // Buscar conversas na fila (status = 'new')
  const { data: queueConversations = [], isLoading, refetch } = useQuery({
    queryKey: ['queue-conversations', selectedSector],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select(`
          id,
          client_name,
          client_phone,
          sector_id,
          status,
          created_at,
          last_message_at,
          sectors:sector_id (name, color)
        `)
        .eq('status', 'new')
        .order('created_at', { ascending: true });

      if (selectedSector !== 'all') {
        query = query.eq('sector_id', selectedSector);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(conv => ({
        ...conv,
        waiting_time: Math.floor((new Date().getTime() - new Date(conv.created_at).getTime()) / (1000 * 60))
      })) as QueueConversation[];
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
    enabled: profile?.role === 'admin',
  });

  // Buscar atendentes disponíveis
  const { data: availableAttendants = [] } = useQuery({
    queryKey: ['available-attendants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          sector_id,
          sectors:sector_id (name, color)
        `)
        .eq('role', 'attendant')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'admin',
  });

  // Atribuir conversa a um atendente
  const assignConversationMutation = useMutation({
    mutationFn: async ({ conversationId, attendantId }: { conversationId: string; attendantId: string }) => {
      const { error } = await supabase
        .from('conversations')
        .update({
          assigned_to: attendantId,
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue-conversations'] });
      toast.success('Conversa atribuída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atribuir conversa: ${error.message}`);
    },
  });

  const handleAssignConversation = (conversationId: string, attendantId: string) => {
    assignConversationMutation.mutate({ conversationId, attendantId });
  };

  const getWaitingTimeColor = (minutes: number) => {
    if (minutes < 5) return 'text-green-600';
    if (minutes < 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stats = {
    totalInQueue: queueConversations.length,
    avgWaitingTime: queueConversations.length > 0 
      ? Math.round(queueConversations.reduce((sum, conv) => sum + conv.waiting_time, 0) / queueConversations.length)
      : 0,
    longestWaiting: queueConversations.length > 0 
      ? Math.max(...queueConversations.map(conv => conv.waiting_time))
      : 0,
    availableAttendants: availableAttendants.length,
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fila de Atendimento</h2>
          <p className="text-gray-600">Gerencie as conversas aguardando atendimento</p>
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
          
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Na Fila</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInQueue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgWaitingTime}min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Maior Espera</p>
                <p className="text-2xl font-bold text-gray-900">{stats.longestWaiting}min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Atendentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.availableAttendants}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela da Fila */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas na Fila</CardTitle>
          <CardDescription>
            {queueConversations.length} conversa{queueConversations.length !== 1 ? 's' : ''} aguardando atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queueConversations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Tempo de Espera</TableHead>
                  <TableHead>Iniciado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueConversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {conversation.client_name || 'Cliente não identificado'}
                        </div>
                        <div className="text-sm text-gray-500">{conversation.client_phone}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {conversation.sectors ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: conversation.sectors.color }}
                          />
                          <span className="text-sm">{conversation.sectors.name}</span>
                        </div>
                      ) : (
                        <Badge variant="outline">Sem setor</Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <span className={`font-medium ${getWaitingTimeColor(conversation.waiting_time)}`}>
                        {conversation.waiting_time} min
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(conversation.created_at).toLocaleString('pt-BR')}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <Select onValueChange={(attendantId) => handleAssignConversation(conversation.id, attendantId)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Atribuir para..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAttendants
                            .filter(att => !conversation.sector_id || att.sector_id === conversation.sector_id)
                            .map((attendant) => (
                            <SelectItem key={attendant.id} value={attendant.id}>
                              <div className="flex items-center gap-2">
                                {attendant.sectors && (
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: attendant.sectors.color }}
                                  />
                                )}
                                {attendant.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conversa na fila</h3>
              <p className="text-gray-600">Todas as conversas estão sendo atendidas ou foram finalizadas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueManagement;
