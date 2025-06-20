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

// Tipos para buscar instâncias
export interface InstanceInfo {
  instanceName: string;
  status: string;
  profilePictureUrl?: string;
  profileName?: string;
  phoneNumber?: string;
  connectionState?: string;
}

export interface FetchInstancesResponse {
  instances: InstanceInfo[];
}

// Tipos para informações de conexão
export interface ConnectionInfo {
  instance: {
    instanceName: string;
    owner: string;
    profilePictureUrl: string;
    profileName: string;
    phoneNumber: string;
    state: string;
  };
}

export interface Chat {
  id: string;
  name?: string;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    timestamp: number;
  };
  // Informações específicas da Evolution
  remoteJid?: string;
  profilePictureUrl?: string;
  isGroup?: boolean;
  participant?: string;
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

// Tipos para buscar mensagens da Evolution API
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

// Tipo para conversas baseadas na Evolution API
export interface EvolutionConversation {
  id: string; // remoteJid
  client_name: string | null;
  client_phone: string;
  sector: string;
  status: string;
  last_message_at: string;
  instance_name: string;
  instance_phone: string;
  unread_count?: number;
  profile_picture_url?: string;
  is_group?: boolean;
}

// Tipo unificado para mensagens
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
  source: 'evolution';
}
