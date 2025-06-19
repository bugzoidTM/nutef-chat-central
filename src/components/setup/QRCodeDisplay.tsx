
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, RefreshCw } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCode: string;
  isGenerating: boolean;
  onRegenerate: () => void;
}

export const QRCodeDisplay = ({ qrCode, isGenerating, onRegenerate }: QRCodeDisplayProps) => {
  return (
    <div className="text-center space-y-4">
      <div className="bg-white p-8 rounded-lg border-2 border-gray-200 shadow-sm">
        <img
          src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
          alt="QR Code para conectar WhatsApp"
          className="w-64 h-64 mx-auto block"
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
        onClick={onRegenerate}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? (
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
  );
};
