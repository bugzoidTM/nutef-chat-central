
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, QrCode, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { useEvolutionInstance } from '@/hooks/useEvolutionInstance';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PhoneNumberInput } from './PhoneNumberInput';
import { ConnectionStatus } from './ConnectionStatus';
import { QRCodeDisplay } from './QRCodeDisplay';

const QRCodeSetup = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
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
    instanceName,
  } = useEvolutionInstance(phoneNumber);

  useEffect(() => {
    // Se a instância estiver conectada, finalizar setup
    if (connectionState?.state === 'open' && instanceCreated && profile && instanceName) {
      handleSetupComplete();
    }
  }, [connectionState?.state, instanceCreated, profile, instanceName]);

  const handleSetupComplete = async () => {
    if (!profile || !instanceName) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          whatsapp_connected: true,
          phone: phoneNumber,
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
        title: "Número obrigatório",
        description: "Por favor, insira o número do WhatsApp.",
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
      
      // Wait a moment for instance to be created, then try to get QR code
      setTimeout(() => {
        getQRCode().catch(error => {
          console.error('Error getting QR code after instance creation:', error);
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error creating instance:', error);
      setInstanceCreated(false);
    }
  };

  const handleChangeNumber = () => {
    setInstanceCreated(false);
    clearQrCode();
    setPhoneNumber('');
  };

  const handleGenerateQRCode = () => {
    clearQrCode();
    getQRCode();
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
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
            <PhoneNumberInput
              phoneNumber={phoneNumber}
              instanceName={instanceName}
              isCreating={isCreatingInstance}
              hasProfile={!!profile}
              onPhoneChange={handlePhoneChange}
              onSubmit={handleCreateInstance}
            />
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <div>
                    <span className="font-medium">{phoneNumber}</span>
                    <p className="text-xs text-gray-500">{instanceName}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangeNumber}
                >
                  Trocar
                </Button>
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
                    <QRCodeDisplay
                      qrCode={qrCode}
                      isGenerating={isGettingQRCode}
                      onRegenerate={handleGenerateQRCode}
                    />
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeSetup;
