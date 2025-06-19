
import { EVOLUTION_CONFIG } from '@/config/evolution';

// Types for Evolution API
export interface CreateInstanceRequest {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  integration?: string;
}

export interface CreateInstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
  webhook?: string;
  qrcode?: {
    code: string;
    base64: string;
  };
}

export interface ConnectionStateResponse {
  instance: {
    instanceName: string;
    state: string;
  };
}

export interface QRCodeResponse {
  base64: string;
  code: string;
}

export interface Chat {
  id: string;
  name?: string;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    timestamp: number;
  };
}

export interface FindChatsResponse {
  chats: Chat[];
}

export interface SendTextMessageRequest {
  number: string;
  text: string;
}

export interface SendTextMessageResponse {
  key: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
  };
  message: {
    conversation: string;
  };
}

const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${EVOLUTION_CONFIG.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_CONFIG.apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Evolution API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Create instance
export const createInstance = async (
  instanceName: string,
  options: Partial<CreateInstanceRequest> = {}
): Promise<CreateInstanceResponse> => {
  console.log('Creating Evolution API instance:', instanceName);
  
  return makeRequest<CreateInstanceResponse>('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      ...options,
    }),
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

// Find chats
export const findChats = async (instanceName: string): Promise<FindChatsResponse> => {
  console.log('Finding chats for instance:', instanceName);
  
  return makeRequest<FindChatsResponse>(`/chat/findChats/${instanceName}`);
};

// Send text message
export const sendTextMessage = async (
  instanceName: string,
  number: string,
  text: string
): Promise<SendTextMessageResponse> => {
  console.log('Sending message via Evolution API:', { instanceName, number, text });
  
  return makeRequest<SendTextMessageResponse>(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number,
      text,
    }),
  });
};

// Updated sendMessage function to use the new sendTextMessage
export const sendMessage = async (to: string, content: string, instanceName: string = 'default') => {
  return sendTextMessage(instanceName, to, content);
};
