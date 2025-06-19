
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { QrCode, Smartphone, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useEvolutionInstance } from '@/hooks/useEvolutionInstance';

interface EvolutionInstanceManagerProps {
  defaultInstanceName?: string;
}

const EvolutionInstanceManager = ({ defaultInstanceName = 'default' }: EvolutionInstanceManagerProps) => {
  const [instanceName, setInstanceName] = useState(defaultInstanceName);
  const {
    qrCode,
    connectionState,
    chats,
    connectionStateLoading,
    chatsLoading,
    createInstance,
    getQRCode,
    isCreatingInstance,
    isGettingQRCode,
    refetchConnectionState,
    refetchChats,
    clearQrCode,
  } = useEvolutionInstance(instanceName);

  const getStatusColor = (state?: string) => {
    switch (state) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'close':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (state?: string) => {
    switch (state) {
      case 'open':
        return <Wifi className="h-4 w-4" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'close':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (state?: string) => {
    switch (state) {
      case 'open':
        return 'Conectado';
      case 'connecting':
        return 'Conectando';
      case 'close':
        return 'Desconectado';
      default:
        return 'Desconhecido';
    }
  };

  const handleCreateInstance = () => {
    createInstance({});
  };

  const handleGetQRCode = () => {
    getQRCode();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Gerenciar Instância WhatsApp</span>
          </CardTitle>
          <CardDescription>
            Configure e gerencie sua instância da Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Nome da instância"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleCreateInstance}
              disabled={isCreatingInstance || !instanceName}
            >
              {isCreatingInstance ? 'Criando...' : 'Criar Instância'}
            </Button>
          </div>

          {connectionState && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(connectionState.state)}
                  <span className="font-medium">Status:</span>
                </div>
                <Badge className={getStatusColor(connectionState.state)}>
                  {getStatusLabel(connectionState.state)}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchConnectionState()}
                disabled={connectionStateLoading}
              >
                <RefreshCw className={`h-4 w-4 ${connectionStateLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}

          {connectionState?.state !== 'open' && (
            <div className="space-y-3">
              <Button
                onClick={handleGetQRCode}
                disabled={isGettingQRCode}
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {isGettingQRCode ? 'Gerando QR Code...' : 'Gerar QR Code'}
              </Button>

              {qrCode && (
                <div className="text-center space-y-3">
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Escaneie este QR Code com seu WhatsApp para conectar
                  </p>
                  <Button variant="outline" onClick={clearQrCode}>
                    Limpar QR Code
                  </Button>
                </div>
              )}
            </div>
          )}

          {connectionState?.state === 'open' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Conversas ({chats.length})</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchChats()}
                  disabled={chatsLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${chatsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {chats.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <span className="font-medium">{chat.name || chat.id}</span>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma conversa encontrada
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvolutionInstanceManager;
