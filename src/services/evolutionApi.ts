import { EVOLUTION_CONFIG } from '@/config/evolution';

// Types for Evolution API
export interface CreateInstanceRequest {
  instanceName: string;
  token?: string;
  qrcode?: boolean;
  integration?: string;
  webhook?: string;
  webhook_by_events?: boolean;
  webhook_base64?: boolean;
  events?: string[];
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
  
  console.log('Evolution API Request:', {
    url,
    method: options.method || 'GET',
    hasApiKey: !!EVOLUTION_CONFIG.apiKey,
    endpoint
  });
  
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
    console.error('Evolution API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
      url
    });
    throw new Error(`Evolution API Error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Evolution API Response:', data);
  return data;
};

// Create instance with proper webhook configuration
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
    webhook: webhookUrl,
    webhook_by_events: false,
    webhook_base64: false,
    events: [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE',
      'CONNECTION_UPDATE'
    ],
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

// Find chats - GET /chat/findChats/{instanceName}
export const findChats = async (instanceName: string): Promise<FindChatsResponse> => {
  console.log('Finding chats for instance:', instanceName, 'using Evolution API config:', {
    baseUrl: EVOLUTION_CONFIG.baseUrl,
    hasApiKey: !!EVOLUTION_CONFIG.apiKey
  });
  
  return makeRequest<FindChatsResponse>(`/chat/findChats/${instanceName}`);
};

// Send text message - POST /message/sendText/{instanceName}
export const sendTextMessage = async (
  instanceName: string,
  number: string,
  text: string
): Promise<SendTextMessageResponse> => {
  console.log('Sending message via Evolution API:', { 
    instanceName, 
    number, 
    text,
    baseUrl: EVOLUTION_CONFIG.baseUrl,
    hasApiKey: !!EVOLUTION_CONFIG.apiKey
  });
  
  return makeRequest<SendTextMessageResponse>(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number,
      text,
    }),
  });
};

// Set webhook - POST /webhook/set/{instanceName}
export const setWebhook = async (
  instanceName: string,
  webhookUrl: string,
  webhookEvents?: string[]
): Promise<any> => {
  console.log('Setting webhook for instance:', instanceName, 'URL:', webhookUrl);
  
  return makeRequest(`/webhook/set/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: webhookEvents || [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE'
      ]
    }),
  });
};

// Setup webhook automatically - this is the missing function
export const setupWebhookAutomatically = async (instanceName: string): Promise<any> => {
  const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
  
  console.log('Setting up webhook automatically for instance:', instanceName);
  
  return setWebhook(instanceName, webhookUrl, [
    'MESSAGES_UPSERT',
    'MESSAGES_UPDATE', 
    'CONNECTION_UPDATE'
  ]);
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

// Updated sendMessage function to use the new sendTextMessage
export const sendMessage = async (to: string, content: string, instanceName: string = 'default') => {
  return sendTextMessage(instanceName, to, content);
};
