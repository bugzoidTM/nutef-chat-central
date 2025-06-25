
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRightLeft, Search, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TransferRecord {
  id: string;
  conversation_id: string;
  from_attendant_id: string | null;
  to_attendant_id: string | null;
  from_sector_id: string | null;
  to_sector_id: string | null;
  transferred_by: string | null;
  status: string;
  reason: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  conversation?: {
    client_name: string | null;
    client_phone: string;
  } | null;
  from_attendant_name?: string | null;
  to_attendant_name?: string | null;
  from_sector_name?: string | null;
  from_sector_color?: string | null;
  to_sector_name?: string | null;
  to_sector_color?: string | null;
  transferred_by_name?: string | null;
}

export const TransferHistory = () => {
  const { profile } = useAuth();
  const { hasPermission, isAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7');

  const { data: transfers = [], isLoading, refetch } = useQuery({
    queryKey: ['transfer-history', statusFilter, dateRange, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      let query = supabase
        .from('conversation_transfers')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Se não for admin, filtrar apenas transferências relacionadas ao usuário
      if (!isAdmin) {
        query = query.or(`from_attendant_id.eq.${profile.id},to_attendant_id.eq.${profile.id},transferred_by.eq.${profile.id}`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: transfersData, error } = await query;
      if (error) {
        console.error('Erro ao buscar transferências:', error);
        throw error;
      }

      if (!transfersData || transfersData.length === 0) {
        return [];
      }

      // Buscar dados relacionados separadamente
      const conversationIds = transfersData.map(t => t.conversation_id).filter(Boolean);
      const attendantIds = [
        ...transfersData.map(t => t.from_attendant_id),
        ...transfersData.map(t => t.to_attendant_id),
        ...transfersData.map(t => t.transferred_by)
      ].filter(Boolean);
      const sectorIds = [
        ...transfersData.map(t => t.from_sector_id),
        ...transfersData.map(t => t.to_sector_id)
      ].filter(Boolean);

      // Buscar conversas
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, client_name, client_phone')
        .in('id', conversationIds);

      // Buscar atendentes
      const { data: attendants } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', attendantIds);

      // Buscar setores
      const { data: sectors } = await supabase
        .from('sectors')
        .select('id, name, color')
        .in('id', sectorIds);

      // Mapear dados
      const enrichedTransfers: TransferRecord[] = transfersData.map(transfer => {
        const conversation = conversations?.find(c => c.id === transfer.conversation_id);
        const fromAttendant = attendants?.find(a => a.id === transfer.from_attendant_id);
        const toAttendant = attendants?.find(a => a.id === transfer.to_attendant_id);
        const transferredBy = attendants?.find(a => a.id === transfer.transferred_by);
        const fromSector = sectors?.find(s => s.id === transfer.from_sector_id);
        const toSector = sectors?.find(s => s.id === transfer.to_sector_id);

        return {
          ...transfer,
          conversation: conversation ? {
            client_name: conversation.client_name,
            client_phone: conversation.client_phone
          } : null,
          from_attendant_name: fromAttendant?.name || null,
          to_attendant_name: toAttendant?.name || null,
          from_sector_name: fromSector?.name || null,
          from_sector_color: fromSector?.color || null,
          to_sector_name: toSector?.name || null,
          to_sector_color: toSector?.color || null,
          transferred_by_name: transferredBy?.name || null,
        };
      });

      return enrichedTransfers;
    },
    enabled: !!profile?.id && (hasPermission('view_reports') || hasPermission('transfer_conversations')),
  });

  // Filtrar por termo de busca
  const filteredTransfers = transfers.filter(transfer =>
    transfer.conversation?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.conversation?.client_phone?.includes(searchTerm) ||
    transfer.from_attendant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.to_attendant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'accepted':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Aceita</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Concluída</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Estatísticas
  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    completed: transfers.filter(t => t.status === 'completed').length,
    rejected: transfers.filter(t => t.status === 'rejected').length,
  };

  // Verificar permissões
  if (!hasPermission('view_reports') && !hasPermission('transfer_conversations')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Você não tem permissão para visualizar o histórico de transferências.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Histórico de Transferências</h2>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Acompanhe todas as transferências de conversas' 
              : 'Suas transferências de conversas'
            }
          </p>
        </div>
        
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ArrowRightLeft className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejeitadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente, atendente ou motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="accepted">Aceitas</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Último dia</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Transferências */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transferências</CardTitle>
          <CardDescription>
            {filteredTransfers.length} transferência{filteredTransfers.length !== 1 ? 's' : ''} encontrada{filteredTransfers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransfers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Para</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {transfer.conversation?.client_name || 'Cliente não identificado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transfer.conversation?.client_phone}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {transfer.from_attendant_name && (
                          <div className="text-sm font-medium">{transfer.from_attendant_name}</div>
                        )}
                        {transfer.from_sector_name && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: transfer.from_sector_color || '#gray' }}
                            />
                            <span className="text-xs text-gray-500">{transfer.from_sector_name}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {transfer.to_attendant_name && (
                          <div className="text-sm font-medium">{transfer.to_attendant_name}</div>
                        )}
                        {transfer.to_sector_name && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: transfer.to_sector_color || '#gray' }}
                            />
                            <span className="text-xs text-gray-500">{transfer.to_sector_name}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(transfer.status)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-600 truncate" title={transfer.reason || ''}>
                          {transfer.reason || 'Sem motivo especificado'}
                        </p>
                        {transfer.transferred_by_name && (
                          <p className="text-xs text-gray-400">
                            por {transfer.transferred_by_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(transfer.created_at).toLocaleDateString('pt-BR')}</div>
                        <div className="text-gray-500">
                          {new Date(transfer.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transferência encontrada</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Ainda não há transferências no período selecionado.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransferHistory;
