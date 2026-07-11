
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, QrCode, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { useEvolutionInstance } from '@/hooks/useEvolutionInstance';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ConnectionStatus } from './ConnectionStatus';
import { QRCodeDisplay } from './QRCodeDisplay';
import { PhoneNumberInput } from './PhoneNumberInput';

const QRCodeSetup = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [instanceCreated, setInstanceCreated] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Use o número do telefone já cadastrado no perfil
  const phoneNumber = profile?.phone || '';

  const handleSavePhone = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (!cleanPhone || !profile) return;

    setSavingPhone(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone: cleanPhone })
        .eq('id', profile.id);

      if (error) throw error;
      window.location.reload();
    } catch (error: any) {
      console.error('Error saving phone:', error);
      toast({
        title: "Erro ao salvar número",
        description: error.message,
        variant: "destructive",
      });
      setSavingPhone(false);
    }
  };
  
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
    instanceName,
  } = useEvolutionInstance(phoneNumber);

  // Verificação mais ativa do estado da conexão após QR Code ser gerado
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (qrCode && connectionState?.state !== 'open' && !isCheckingConnection) {
      console.log('QRCodeSetup - Starting active connection checking...');
      setIsCheckingConnection(true);
      
      // Verificar estado da conexão a cada 3 segundos quando QR Code estiver ativo
      intervalId = setInterval(async () => {
        console.log('QRCodeSetup - Checking connection state actively...');
        try {
          await refetchConnectionState();
        } catch (error) {
          console.error('QRCodeSetup - Error checking connection state:', error);
        }
      }, 3000);
    }
    
    // Parar verificação se conectado ou QR Code removido
    if (connectionState?.state === 'open' || !qrCode) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      setIsCheckingConnection(false);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [qrCode, connectionState?.state, refetchConnectionState, isCheckingConnection]);

  useEffect(() => {
    // Se a instância estiver conectada, finalizar setup
    if (connectionState?.state === 'open' && instanceCreated && profile && instanceName) {
      console.log('QRCodeSetup - WhatsApp connected, completing setup...');
      handleSetupComplete();
    }
  }, [connectionState?.state, instanceCreated, profile, instanceName]);

  useEffect(() => {
    // Criar instância automaticamente quando o componente carrega
    if (phoneNumber && profile && !instanceCreated) {
      handleCreateInstance();
    }
  }, [phoneNumber, profile]);

  // Reset whatsapp_connected to false when component mounts
  // This ensures we always verify the actual connection
  useEffect(() => {
    const resetConnectionStatus = async () => {
      if (profile?.whatsapp_connected) {
        console.log('QRCodeSetup - Resetting whatsapp_connected to verify real connection');
        await supabase
          .from('profiles')
          .update({ whatsapp_connected: false })
          .eq('id', profile.id);
      }
    };
    
    resetConnectionStatus();
  }, [profile?.id]);

  const handleSetupComplete = async () => {
    if (!profile || !instanceName) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          whatsapp_connected: true,
          instance_name: instanceName,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "WhatsApp conectado!",
        description: "Configuração concluída com sucesso. Sistema pronto para receber mensagens.",
      });

      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      console.error('Error completing setup:', error);
      toast({
        title: "Erro ao finalizar configuração",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateInstance = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Número não encontrado",
        description: "Número do WhatsApp não encontrado no perfil.",
        variant: "destructive",
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Perfil não encontrado",
        description: "Perfil do usuário não foi carregado. Tente recarregar a página.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setInstanceCreated(true);
      await createInstance({});
      
      // Wait a moment for instance to be created, then try to get QR code if not already available
      if (!qrCode) {
        setTimeout(() => {
          getQRCode().catch(error => {
            console.error('Error getting QR code after instance creation:', error);
          });
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error creating instance:', error);
      setInstanceCreated(false);
    }
  };

  const handleGenerateQRCode = () => {
    clearQrCode();
    getQRCode();
  };

  if (!phoneNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Smartphone className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Número do WhatsApp</CardTitle>
            <CardDescription>
              Informe o número que será conectado ao sistema de atendimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhoneNumberInput
              phoneNumber={phoneInput}
              instanceName={phoneInput ? `whatsapp_${phoneInput.replace(/\D/g, '')}` : ''}
              isCreating={savingPhone}
              hasProfile={!!profile}
              onPhoneChange={(e) => setPhoneInput(e.target.value)}
              onSubmit={handleSavePhone}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-600" />
              <div className="text-center">
                <span className="font-medium">{phoneNumber}</span>
                <p className="text-xs text-gray-500">{instanceName}</p>
              </div>
            </div>
          </div>

          <ConnectionStatus
            connectionState={connectionState}
            isLoading={connectionStateLoading}
            onRefresh={refetchConnectionState}
          />

          {connectionState?.state === 'open' ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-green-700">
                  WhatsApp Conectado!
                </h3>
                <p className="text-gray-600">
                  Sistema configurado e pronto para receber mensagens.
                </p>
                <p className="text-sm text-gray-500 mt-2">
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
                <>
                  <QRCodeDisplay
                    qrCode={qrCode}
                    isGenerating={isGettingQRCode}
                    onRegenerate={handleGenerateQRCode}
                  />
                  {isCheckingConnection && (
                    <div className="text-center space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-blue-800 font-medium">Aguardando conexão...</span>
                      </div>
                      <p className="text-blue-700 text-sm">
                        Escaneie o QR Code com seu WhatsApp para conectar
                      </p>
                    </div>
                  )}
                </>
              )}

              {!qrCode && (connectionState?.state === 'connecting' || isCreatingInstance) && (
                <div className="text-center space-y-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto" />
                  <p className="text-yellow-800 font-medium">
                    {isCreatingInstance ? 'Criando instância...' : 'Instância conectando...'}
                  </p>
                  <p className="text-yellow-700 text-sm">
                    {isCreatingInstance 
                      ? 'Configurando a instância WhatsApp...' 
                      : 'Aguarde um momento para gerar o QR Code'
                    }
                  </p>
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
