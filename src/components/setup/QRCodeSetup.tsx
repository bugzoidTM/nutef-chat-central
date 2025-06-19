
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Smartphone, Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useEvolutionInstance } from '@/hooks/useEvolutionInstance';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const QRCodeSetup = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const instanceName = profile?.instance_name || 'default';
  
  const {
    qrCode,
    connectionState,
    connectionStateLoading,
    createInstance,
    getQRCode,
    isCreatingInstance,
    isGettingQRCode,
    refetchConnectionState,
    clearQrCode,
  } = useEvolutionInstance(instanceName);

  useEffect(() => {
    // Verificar se já existe uma instância criada
    if (!connectionState && !connectionStateLoading) {
      createInstance({});
    }
  }, [connectionState, connectionStateLoading, createInstance]);

  useEffect(() => {
    // Se a instância estiver conectada, marcar setup como concluído
    if (connectionState?.state === 'open' && user) {
      handleSetupComplete();
    }
  }, [connectionState?.state, user]);

  const handleSetupComplete = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          whatsapp_connected: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "WhatsApp conectado!",
        description: "Configuração concluída com sucesso.",
      });

      // Recarregar para ir para o dashboard
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast({
        title: "Erro ao finalizar configuração",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
        return <CheckCircle className="h-4 w-4" />;
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
        return 'Aguardando...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Smartphone className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Conectar WhatsApp</CardTitle>
          <CardDescription>
            Escaneie o QR Code para conectar seu WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {connectionState?.state === 'open' ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-700">
                  WhatsApp Conectado!
                </h3>
                <p className="text-gray-600">
                  Redirecionando para o painel...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!qrCode && connectionState?.state !== 'open' && (
                <Button
                  onClick={getQRCode}
                  disabled={isGettingQRCode || isCreatingInstance}
                  className="w-full"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {isGettingQRCode || isCreatingInstance ? 'Gerando QR Code...' : 'Gerar QR Code'}
                </Button>
              )}

              {qrCode && (
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      1. Abra o WhatsApp no seu celular
                    </p>
                    <p className="text-sm text-gray-600">
                      2. Toque em Mais opções &gt; Dispositivos conectados
                    </p>
                    <p className="text-sm text-gray-600">
                      3. Toque em Conectar um dispositivo
                    </p>
                    <p className="text-sm text-gray-600">
                      4. Aponte seu celular para esta tela
                    </p>
                  </div>
                  <Button variant="outline" onClick={clearQrCode}>
                    Gerar Novo QR Code
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeSetup;
