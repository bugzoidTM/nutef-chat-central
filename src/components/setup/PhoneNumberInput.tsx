
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Phone, QrCode, RefreshCw } from 'lucide-react';

interface PhoneNumberInputProps {
  phoneNumber: string;
  instanceName: string;
  isCreating: boolean;
  hasProfile: boolean;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export const PhoneNumberInput = ({ 
  phoneNumber, 
  instanceName, 
  isCreating, 
  hasProfile, 
  onPhoneChange, 
  onSubmit 
}: PhoneNumberInputProps) => {
  return (
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
          onChange={onPhoneChange}
          maxLength={15}
        />
        <p className="text-sm text-gray-500">
          Digite o número que será usado para conectar o WhatsApp
        </p>
        {phoneNumber && (
          <p className="text-xs text-blue-600">
            Nome da instância: {instanceName}
          </p>
        )}
      </div>
      
      <Button
        onClick={onSubmit}
        disabled={isCreating || !phoneNumber.trim() || !hasProfile}
        className="w-full"
      >
        {isCreating ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Configurando instância...
          </>
        ) : (
          <>
            <QrCode className="h-4 w-4 mr-2" />
            Configurar WhatsApp
          </>
        )}
      </Button>
    </div>
  );
};
