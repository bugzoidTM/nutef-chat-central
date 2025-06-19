
import { makeRequest } from './httpClient';
import type { CreateInstanceRequest, CreateInstanceResponse, ConnectionStateResponse, QRCodeResponse } from './types';

// Create instance with webhook configuration included from the start
export const createInstance = async (
  instanceName: string,
  options: Partial<CreateInstanceRequest> = {}
): Promise<CreateInstanceResponse> => {
  console.log('Creating Evolution API instance:', instanceName, 'with options:', options);
  
  const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
  
  const requestBody = {
    instanceName,
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
    webhook: {
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'SEND_MESSAGE'
      ]
    },
    ...options,
  };

  console.log('Instance creation request body:', requestBody);
  
  return makeRequest<CreateInstanceResponse>('/instance/create', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
};

// Generate QR Code
export const getQRCode = async (instanceName: string): Promise<QRCodeResponse> => {
  console.log('Getting QR code for instance:', instanceName);
  
  return makeRequest<QRCodeResponse>(`/instance/connect/${instanceName}`);
};

// Check connection state
export const getConnectionState = async (instanceName: string): Promise<ConnectionStateResponse> => {
  console.log('Checking connection state for instance:', instanceName);
  
  return makeRequest<ConnectionStateResponse>(`/instance/connectionState/${instanceName}`);
};

// Check if instance exists
export const checkInstanceExists = async (instanceName: string): Promise<boolean> => {
  try {
    await getConnectionState(instanceName);
    return true;
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('does not exist')) {
      return false;
    }
    throw error;
  }
};
