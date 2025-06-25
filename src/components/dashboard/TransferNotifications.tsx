
import React from 'react';
import { useConversationTransfers } from '@/hooks/useConversationTransfers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRightLeft, Clock, User, Phone } from 'lucide-react';
import { useState } from 'react';

export const TransferNotifications = () => {
  const { 
    pendingTransfers, 
    loadingPending, 
    acceptTransfer, 
    rejectTransfer,
    isAcceptingTransfer,
    isRejectingTransfer 
  } = useConversationTransfers();
  
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<string | null>(null);

  if (loadingPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transferências Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (pendingTransfers.length === 0) {
    return null; // Não exibir se não há transferências pendentes
  }

  const handleAccept = (transferId: string) => {
    acceptTransfer(transferId);
  };

  const handleReject = (transferId: string, reason?: string) => {
    rejectTransfer({ transferId, reason });
    setRejectReason('');
    setSelectedTransfer(null);
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <ArrowRightLeft className="h-5 w-5" />
          Transferências Pendentes
          <Badge variant="secondary" className="ml-2">
            {pendingTransfers.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Você tem {pendingTransfers.length} transferência{pendingTransfers.length !== 1 ? 's' : ''} aguardando sua resposta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingTransfers.map((transfer) => (
          <div key={transfer.id} className="bg-white p-4 rounded-lg border border-orange-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(transfer.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      {transfer.conversation?.client_name || 'Cliente não identificado'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {transfer.conversation?.client_phone}
                    </span>
                  </div>
                  
                  {transfer.from_attendant_name && (
                    <div className="text-sm text-gray-600">
                      <strong>De:</strong> {transfer.from_attendant_name}
                    </div>
                  )}
                  
                  {transfer.transferred_by_name && (
                    <div className="text-sm text-gray-600">
                      <strong>Solicitado por:</strong> {transfer.transferred_by_name}
                    </div>
                  )}
                  
                  {transfer.reason && (
                    <div className="text-sm text-gray-600">
                      <strong>Motivo:</strong> {transfer.reason}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAccept(transfer.id)}
                  disabled={isAcceptingTransfer}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isAcceptingTransfer ? 'Aceitando...' : 'Aceitar'}
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTransfer(transfer.id);
                        setRejectReason('');
                      }}
                      disabled={isRejectingTransfer}
                    >
                      Rejeitar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Rejeitar Transferência</DialogTitle>
                      <DialogDescription>
                        Tem certeza que deseja rejeitar esta transferência? 
                        Opcionalmente, você pode fornecer um motivo.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reject-reason">Motivo (opcional)</Label>
                        <Textarea
                          id="reject-reason"
                          placeholder="Digite o motivo da rejeição..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedTransfer(null);
                          setRejectReason('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (selectedTransfer) {
                            handleReject(selectedTransfer, rejectReason || undefined);
                          }
                        }}
                        disabled={isRejectingTransfer}
                      >
                        {isRejectingTransfer ? 'Rejeitando...' : 'Rejeitar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TransferNotifications;
