
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
