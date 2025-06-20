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

// Novos tipos para buscar mensagens da Evolution API
export interface FindMessagesRequest {
  where: {
    key: {
      remoteJid: string;
    };
  };
  limit?: number;
  offset?: number;
}

export interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
      url?: string;
    };
    videoMessage?: {
      caption?: string;
      url?: string;
    };
    audioMessage?: {
      url?: string;
    };
    documentMessage?: {
      title?: string;
      fileName?: string;
      url?: string;
    };
    stickerMessage?: {
      url?: string;
    };
    locationMessage?: {
      degreesLatitude: number;
      degreesLongitude: number;
      name?: string;
      address?: string;
    };
    contactMessage?: {
      displayName: string;
      vcard: string;
    };
  };
  messageTimestamp: string;
  pushName?: string;
  status?: string;
}

export interface FindMessagesResponse {
  messages: EvolutionMessage[];
}

// Tipo unificado para mensagens compatível com o frontend
export interface UnifiedMessage {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  from_phone: string;
  to_phone: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact';
  media_url?: string;
  caption?: string;
  source: 'supabase' | 'evolution';
}
