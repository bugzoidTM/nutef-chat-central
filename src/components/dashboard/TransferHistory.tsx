
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRightLeft, Search, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

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
  // Dados relacionados
  conversations?: {
    client_name: string | null;
    client_phone: string;
  };
  from_attendant?: {
    name: string;
  };
  to_attendant?: {
    name: string;
  };
  from_sector?: {
    name: string;
    color: string;
  };
  to_sector?: {
    name: string;
    color: string;
  };
  transferred_by_profile?: {
    name: string;
  };
}

export const TransferHistory = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7'); // dias

  // Buscar histórico de transferências
  const { data: transfers = [], isLoading, refetch } = useQuery({
    queryKey: ['transfer-history', statusFilter, dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      let query = supabase
        .from('conversation_transfers')
        .select(`
          *,
          conversations:conversation_id (client_name, client_phone),
          from_attendant:from_attendant_id!inner (name),
          to_attendant:to_attendant_id!inner (name),
          from_sector:from_sector_id (name, color),
          to_sector:to_sector_id (name, color),
          transferred_by_profile:transferred_by!inner (name)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao buscar transferências:', error);
        throw error;
      }

      return data as TransferRecord[];
    },
    enabled: profile?.role === 'admin',
  });

  // Filtrar por termo de busca
  const filteredTransfers = transfers.filter(transfer =>
    transfer.conversations?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.conversations?.client_phone?.includes(searchTerm) ||
    transfer.from_attendant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.to_attendant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <h2 className="text-2xl font-bold text-gray-900">Histórico de Transferências</h2>
          <p className="text-gray-600">Acompanhe todas as transferências de conversas</p>
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
                          {transfer.conversations?.client_name || 'Cliente não identificado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transfer.conversations?.client_phone}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {transfer.from_attendant && (
                          <div className="text-sm font-medium">{transfer.from_attendant.name}</div>
                        )}
                        {transfer.from_sector && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: transfer.from_sector.color }}
                            />
                            <span className="text-xs text-gray-500">{transfer.from_sector.name}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {transfer.to_attendant && (
                          <div className="text-sm font-medium">{transfer.to_attendant.name}</div>
                        )}
                        {transfer.to_sector && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: transfer.to_sector.color }}
                            />
                            <span className="text-xs text-gray-500">{transfer.to_sector.name}</span>
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
                        {transfer.transferred_by_profile && (
                          <p className="text-xs text-gray-400">
                            por {transfer.transferred_by_profile.name}
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
