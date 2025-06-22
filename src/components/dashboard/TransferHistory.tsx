import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConversationTransfers } from '@/hooks/useConversationTransfers';
import { usePermissions } from '@/hooks/usePermissions';
import { useSectors } from '@/hooks/useSectors';
import { useAttendants } from '@/hooks/useAttendants';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Clock, User, Check, X, AlertTriangle, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface TransferHistoryItem {
  id: string;
  conversation_id: string;
  from_attendant_id: string | null;
  to_attendant_id: string | null;
  from_sector_id: string | null;
  to_sector_id: string | null;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  transferred_by: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string;
  // Dados relacionados
  conversation?: {
    id: string;
    client_name: string | null;
    client_phone: string;
  };
  from_attendant?: {
    id: string;
    name: string;
  };
  to_attendant?: {
    id: string;
    name: string;
  };
  from_sector?: {
    id: string;
    name: string;
    color: string;
  };
  to_sector?: {
    id: string;
    name: string;
    color: string;
  };
  transferred_by_user?: {
    id: string;
    name: string;
  };
}

export const TransferHistory = () => {
  const { isAdmin, profile } = usePermissions();
  const { sectors } = useSectors();
  const { attendants } = useAttendants();
  const { acceptTransfer, rejectTransfer } = useConversationTransfers();
  
  const [filters, setFilters] = useState({
    status: '',
    sectorId: '',
    attendantId: '',
    dateFrom: '',
    dateTo: '',
  });

  // Buscar histórico completo de transferências
  const { data: transferHistory = [], isLoading, refetch } = useQuery({
    queryKey: ['transfer-history', filters],
    queryFn: async () => {
      let query = supabase
        .from('conversation_transfers')
        .select(`
          *,
          conversation:conversations(id, client_name, client_phone),
          from_attendant:profiles!from_attendant_id(id, name),
          to_attendant:profiles!to_attendant_id(id, name),
          from_sector:sectors!from_sector_id(id, name, color),
          to_sector:sectors!to_sector_id(id, name, color),
          transferred_by_user:profiles!transferred_by(id, name)
        `);

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.sectorId) {
        query = query.or(`from_sector_id.eq.${filters.sectorId},to_sector_id.eq.${filters.sectorId}`);
      }
      
      if (filters.attendantId) {
        query = query.or(`from_attendant_id.eq.${filters.attendantId},to_attendant_id.eq.${filters.attendantId}`);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Se não for admin, mostrar apenas transferências relacionadas ao usuário
      if (!isAdmin && profile?.id) {
        query = query.or(`from_attendant_id.eq.${profile.id},to_attendant_id.eq.${profile.id},transferred_by.eq.${profile.id}`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as TransferHistoryItem[];
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Transferências pendentes para o usuário atual
  const pendingTransfers = transferHistory.filter(
    transfer => transfer.status === 'pending' && transfer.to_attendant_id === profile?.id
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceita';
      case 'completed': return 'Concluída';
      case 'rejected': return 'Rejeitada';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <Check className="h-4 w-4" />;
      case 'completed': return <Check className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleAcceptTransfer = async (transferId: string) => {
    try {
      await acceptTransfer(transferId);
      toast.success('Transferência aceita com sucesso!');
      refetch();
    } catch (error) {
      toast.error('Erro ao aceitar transferência');
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
    try {
      await rejectTransfer(transferId);
      toast.success('Transferência rejeitada');
      refetch();
    } catch (error) {
      toast.error('Erro ao rejeitar transferência');
    }
  };

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const TransferCard = ({ transfer }: { transfer: TransferHistoryItem }) => {
    const isPending = transfer.status === 'pending';
    const canRespond = isPending && transfer.to_attendant_id === profile?.id;
    
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={`${getStatusColor(transfer.status)} text-white`}>
                  {getStatusIcon(transfer.status)}
                  <span className="ml-1">{getStatusLabel(transfer.status)}</span>
                </Badge>
                
                {transfer.status === 'pending' && (
                  <Badge variant="outline">
                    Aguardando resposta
                  </Badge>
                )}
              </div>

              {/* Informações da conversa */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {transfer.conversation?.client_name || 'Cliente sem nome'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatPhoneNumber(transfer.conversation?.client_phone || '')}
                  </span>
                </div>
              </div>

              {/* Fluxo da transferência */}
              <div className="flex items-center gap-3 mb-3">
                {/* De */}
                <div className="flex items-center gap-2">
                  {transfer.from_sector && (
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: transfer.from_sector.color }}
                      />
                      <span className="text-sm">{transfer.from_sector.name}</span>
                    </div>
                  )}
                  
                  {transfer.from_attendant && (
                    <div className="flex items-center gap-1">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {transfer.from_attendant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{transfer.from_attendant.name}</span>
                    </div>
                  )}
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground" />

                {/* Para */}
                <div className="flex items-center gap-2">
                  {transfer.to_sector && (
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: transfer.to_sector.color }}
                      />
                      <span className="text-sm">{transfer.to_sector.name}</span>
                    </div>
                  )}
                  
                  {transfer.to_attendant && (
                    <div className="flex items-center gap-1">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {transfer.to_attendant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{transfer.to_attendant.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo */}
              <div className="mb-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Motivo:</span> {transfer.reason}
                </p>
              </div>

              {/* Informações de tempo */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Criada {formatDistanceToNow(new Date(transfer.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
                
                {transfer.accepted_at && (
                  <span>
                    Aceita {formatDistanceToNow(new Date(transfer.accepted_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                )}
                
                {transfer.completed_at && (
                  <span>
                    Concluída {formatDistanceToNow(new Date(transfer.completed_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                )}

                {transfer.transferred_by_user && (
                  <span>
                    por {transfer.transferred_by_user.name}
                  </span>
                )}
              </div>
            </div>

            {/* Ações */}
            {canRespond && (
              <div className="flex flex-col gap-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => handleAcceptTransfer(transfer.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectTransfer(transfer.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transferências pendentes em destaque */}
      {pendingTransfers.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              Transferências Pendentes ({pendingTransfers.length})
            </CardTitle>
            <CardDescription>
              Você tem transferências aguardando sua resposta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTransfers.map(transfer => (
                <TransferCard key={transfer.id} transfer={transfer} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="accepted">Aceita</option>
                <option value="completed">Concluída</option>
                <option value="rejected">Rejeitada</option>
              </select>
            </div>

            <div>
              <Label htmlFor="sector">Setor</Label>
              <select
                id="sector"
                value={filters.sectorId}
                onChange={(e) => setFilters(prev => ({ ...prev, sectorId: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Todos os setores</option>
                {sectors.map(sector => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="attendant">Atendente</Label>
              <select
                id="attendant"
                value={filters.attendantId}
                onChange={(e) => setFilters(prev => ({ ...prev, attendantId: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Todos os atendentes</option>
                {attendants.map(attendant => (
                  <option key={attendant.id} value={attendant.id}>
                    {attendant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Data inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Data final</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transferências</CardTitle>
          <CardDescription>
            {isAdmin 
              ? 'Todas as transferências do sistema' 
              : 'Transferências relacionadas a você'
            } ({transferHistory.length} registros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transferHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transferência encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transferHistory.map(transfer => (
                <TransferCard key={transfer.id} transfer={transfer} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 