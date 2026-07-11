
import { makeRequest } from './httpClient';
import type { CreateInstanceRequest, CreateInstanceResponse, ConnectionStateResponse, QRCodeResponse } from './types';

// Cria a instância no whatsai; o bridge já configura o webhook e o modo
// "humano atendeu" (bot interno do whatsai desligado) e dispara a geração do QR.
export const createInstance = async (
  instanceName: string,
  _options: Partial<CreateInstanceRequest> = {}
): Promise<CreateInstanceResponse> => {
  console.log('Creating whatsai instance:', instanceName);

  return makeRequest<CreateInstanceResponse>('/api/wa/instances', {
    method: 'POST',
    body: JSON.stringify({ instanceName }),
  });
};

// Obter QR Code
export const getQRCode = async (instanceName: string): Promise<QRCodeResponse> => {
  console.log('Getting QR code for instance:', instanceName);

  return makeRequest<QRCodeResponse>(`/api/wa/qr/${instanceName}`);
};

// Estado da conexão — formato compatível: { instance: { instanceName, state } }
export const getConnectionState = async (instanceName: string): Promise<ConnectionStateResponse> => {
  return makeRequest<ConnectionStateResponse>(`/api/wa/connection-state/${instanceName}`);
};

// Verifica se a instância existe no whatsai
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
