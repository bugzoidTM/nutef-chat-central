
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QrCode, Smartphone, Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { useEvolutionInstance } from '@/hooks/useEvolutionInstance';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const QRCodeSetup = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');
  const [instanceCreated, setInstanceCreated] = useState(false);
  
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
  } = useEvolutionInstance(phoneNumber);

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
          phone: phoneNumber, // Atualizar o número no perfil
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

  const handleCreateInstance = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Número obrigatório",
        description: "Por favor, insira o número do WhatsApp.",
        variant: "destructive",
      });
      return;
    }
    setInstanceCreated(true);
    createInstance({});
  };

  const handleChangeNumber = () => {
    setInstanceCreated(false);
    clearQrCode();
    setPhoneNumber('');
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

  const handleGenerateQRCode = () => {
    clearQrCode();
    getQRCode();
  };

  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');
    
    // Formatar como (XX) XXXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
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
            {!instanceCreated 
              ? "Informe o número do WhatsApp para conectar"
              : "Escaneie o QR Code para conectar seu WhatsApp"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!instanceCreated ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Número do WhatsApp</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(XX) XXXXX-XXXX"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={15}
                />
                <p className="text-sm text-gray-500">
                  Digite o número que será usado para conectar o WhatsApp
                </p>
              </div>
              
              <Button
                onClick={handleCreateInstance}
                disabled={isCreatingInstance || !phoneNumber.trim()}
                className="w-full"
              >
                {isCreatingInstance ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Criando instância...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Criar Instância WhatsApp
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">{phoneNumber}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangeNumber}
                >
                  Trocar
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
                  {(!qrCode || !qrCode.trim()) && connectionState?.state !== 'open' && (
                    <Button
                      onClick={handleGenerateQRCode}
                      disabled={isGettingQRCode || isCreatingInstance}
                      className="w-full"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {isGettingQRCode || isCreatingInstance ? 'Gerando QR Code...' : 'Gerar QR Code'}
                    </Button>
                  )}

                  {qrCode && qrCode.trim() && (
                    <div className="text-center space-y-4">
                      <div className="bg-white p-8 rounded-lg border-2 border-gray-200 shadow-sm">
                        <img
                          src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                          alt="QR Code para conectar WhatsApp"
                          className="w-64 h-64 mx-auto block"
                          onError={(e) => {
                            console.error('Erro ao carregar QR Code:', e);
                            toast({
                              title: "Erro no QR Code",
                              description: "Erro ao carregar QR Code. Tente gerar novamente.",
                              variant: "destructive",
                            });
                          }}
                          onLoad={() => {
                            console.log('QR Code carregado com sucesso');
                          }}
                        />
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center justify-center space-x-2 mb-3">
                          <Smartphone className="h-4 w-4" />
                          <span className="font-medium">Como conectar:</span>
                        </div>
                        <p>1. Abra o WhatsApp no seu celular</p>
                        <p>2. Toque em <strong>Mais opções</strong> &gt; <strong>Dispositivos conectados</strong></p>
                        <p>3. Toque em <strong>Conectar um dispositivo</strong></p>
                        <p>4. Aponte seu celular para este QR Code</p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleGenerateQRCode}
                        disabled={isGettingQRCode}
                        className="w-full"
                      >
                        {isGettingQRCode ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Gerar Novo QR Code
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {!qrCode && connectionState?.state === 'connecting' && (
                    <div className="text-center space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto" />
                      <p className="text-yellow-800 font-medium">Instância conectando...</p>
                      <p className="text-yellow-700 text-sm">Aguarde um momento para gerar o QR Code</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeSetup;
