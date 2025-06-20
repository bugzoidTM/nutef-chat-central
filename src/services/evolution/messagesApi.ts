
import { makeRequest } from './httpClient';
import type { FetchMessagesResponse, FetchMessagesRequest, EvolutionMessage } from './types';

// Fetch messages from Evolution API - GET /chat/fetchMessages/{instanceName}
export const fetchMessages = async (
  instanceName: string,
  remoteJid: string,
  limit: number = 100
): Promise<EvolutionMessage[]> => {
  console.log('Fetching messages from Evolution API:', { 
    instanceName, 
    remoteJid, 
    limit 
  });
  
  const requestBody: FetchMessagesRequest = {
    where: {
      key: {
        remoteJid: remoteJid
      }
    },
    limit,
    page: 1
  };
  
  try {
    const response = await makeRequest<FetchMessagesResponse>(`/chat/fetchMessages/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
    
    console.log('Evolution API messages response:', response);
    return response.messages || [];
  } catch (error) {
    console.error('Error fetching messages from Evolution API:', error);
    return [];
  }
};

// Convert Evolution message format to our internal format
export const convertEvolutionMessage = (evolutionMsg: EvolutionMessage, instancePhone: string): {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  from_phone: string;
  to_phone: string;
} => {
  const content = evolutionMsg.message.conversation || 
                  evolutionMsg.message.extendedTextMessage?.text || 
                  '[Mensagem não suportada]';
  
  const direction = evolutionMsg.key.fromMe ? 'outgoing' : 'incoming';
  const timestamp = new Date(evolutionMsg.messageTimestamp * 1000).toISOString();
  
  // Extract phone number from remoteJid (remove @s.whatsapp.net)
  const phoneNumber = evolutionMsg.key.remoteJid.replace('@s.whatsapp.net', '');
  
  return {
    id: evolutionMsg.key.id,
    content,
    direction,
    timestamp,
    from_phone: direction === 'incoming' ? phoneNumber : instancePhone,
    to_phone: direction === 'incoming' ? instancePhone : phoneNumber,
  };
};
