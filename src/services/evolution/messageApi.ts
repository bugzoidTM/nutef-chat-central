import { makeRequest } from './httpClient';
import type { 
  FindChatsResponse, 
  SendTextMessageRequest, 
  SendTextMessageResponse,
  FindMessagesRequest,
  FindMessagesResponse,
  EvolutionMessage,
  UnifiedMessage,
  Chat,
  EvolutionConversation
} from './types';

// Find chats for a specific instance - GET /chat/findChats/{instanceName}
export const findChats = async (instanceName: string): Promise<Chat[]> => {
  console.log('Finding chats for instance:', instanceName);
  
  try {
    const response = await makeRequest<FindChatsResponse>(`/chat/findChats/${instanceName}`);
    const chats = response.chats || [];
    
    console.log('✅ Chats found for', instanceName, ':', chats.length);
    return chats;
  } catch (error) {
    console.error('❌ Error finding chats for', instanceName, ':', error);
    return [];
  }
};

// Convert Evolution chats to conversations format
export const convertChatsToConversations = (
  chats: Chat[], 
  instanceName: string, 
  instancePhone: string
): EvolutionConversation[] => {
  return chats.map(chat => {
    // Extrair número do telefone do ID do chat
    const phoneNumber = chat.id.replace('@s.whatsapp.net', '').replace('@g.us', '');
    const isGroup = chat.id.includes('@g.us');
    
    // Determinar nome do cliente
    const clientName = chat.name || chat.participant || null;
    
    // Determinar setor baseado em alguma lógica (pode ser customizada)
    const sector = isGroup ? 'support' : 'sales';
    
    // Status baseado em mensagens não lidas
    const status = (chat.unreadCount && chat.unreadCount > 0) ? 'new' : 'finished';
    
    // Timestamp da última mensagem
    const lastMessageAt = chat.lastMessage?.timestamp 
      ? new Date(chat.lastMessage.timestamp * 1000).toISOString()
      : new Date().toISOString();

    return {
      id: chat.id, // usar o remoteJid completo
      client_name: clientName,
      client_phone: phoneNumber,
      sector,
      status,
      last_message_at: lastMessageAt,
      instance_name: instanceName,
      instance_phone: instancePhone,
      unread_count: chat.unreadCount || 0,
      profile_picture_url: chat.profilePictureUrl,
      is_group: isGroup
    };
  });
};

// Find messages - POST /chat/findMessages/{instanceName}
export const findMessages = async (
  instanceName: string,
  remoteJid: string,
  limit = 50,
  offset = 0
): Promise<FindMessagesResponse> => {
  console.log('Finding messages for instance:', instanceName, 'remoteJid:', remoteJid);
  
  const requestBody: FindMessagesRequest = {
    where: {
      key: {
        remoteJid
      }
    },
    limit,
    offset
  };

  try {
    const response = await makeRequest<FindMessagesResponse>(`/chat/findMessages/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    console.log('✅ Messages found for', instanceName, ':', response.messages?.length || 0);
    return response;
  } catch (error) {
    console.error('❌ Error finding messages for', instanceName, ':', error);
    return { messages: [] };
  }
};

// Função helper para converter mensagens da Evolution para formato unificado
export const convertEvolutionMessageToUnified = (
  evolutionMessage: EvolutionMessage,
  instancePhone: string
): UnifiedMessage => {
  // Extrair conteúdo da mensagem
  let content = '';
  let messageType: UnifiedMessage['message_type'] = 'text';
  let mediaUrl: string | undefined;
  let caption: string | undefined;

  const { message } = evolutionMessage;

  if (message.conversation) {
    content = message.conversation;
    messageType = 'text';
  } else if (message.extendedTextMessage?.text) {
    content = message.extendedTextMessage.text;
    messageType = 'text';
  } else if (message.imageMessage) {
    content = message.imageMessage.caption || 'Imagem';
    messageType = 'image';
    mediaUrl = message.imageMessage.url;
    caption = message.imageMessage.caption;
  } else if (message.videoMessage) {
    content = message.videoMessage.caption || 'Vídeo';
    messageType = 'video';
    mediaUrl = message.videoMessage.url;
    caption = message.videoMessage.caption;
  } else if (message.audioMessage) {
    content = 'Áudio';
    messageType = 'audio';
    mediaUrl = message.audioMessage.url;
  } else if (message.documentMessage) {
    content = message.documentMessage.title || message.documentMessage.fileName || 'Documento';
    messageType = 'document';
    mediaUrl = message.documentMessage.url;
  } else if (message.stickerMessage) {
    content = 'Sticker';
    messageType = 'sticker';
    mediaUrl = message.stickerMessage.url;
  } else if (message.locationMessage) {
    content = `Localização: ${message.locationMessage.name || message.locationMessage.address || 'Localização compartilhada'}`;
    messageType = 'location';
  } else if (message.contactMessage) {
    content = `Contato: ${message.contactMessage.displayName}`;
    messageType = 'contact';
  }

  // Determinar direção da mensagem
  const direction: 'incoming' | 'outgoing' = evolutionMessage.key.fromMe ? 'outgoing' : 'incoming';

  // Extrair número do telefone do remoteJid
  const phoneNumber = evolutionMessage.key.remoteJid.split('@')[0];

  return {
    id: evolutionMessage.key.id,
    content,
    direction,
    timestamp: new Date(parseInt(evolutionMessage.messageTimestamp) * 1000).toISOString(),
    from_phone: direction === 'outgoing' ? instancePhone : phoneNumber,
    to_phone: direction === 'outgoing' ? phoneNumber : instancePhone,
    message_type: messageType,
    media_url: mediaUrl,
    caption,
    source: 'evolution'
  };
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
    text
  });
  
  return makeRequest<SendTextMessageResponse>(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number,
      text,
    }),
  });
};

// Legacy function for backward compatibility
export const sendMessage = async (to: string, content: string, instanceName: string = 'default') => {
  return sendTextMessage(instanceName, to, content);
};
