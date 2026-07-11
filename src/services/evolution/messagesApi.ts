
import { makeRequest } from './httpClient';
import type { FetchMessagesResponse, EvolutionMessage } from './types';

// Busca histórico direto do whatsai (fallback/diagnóstico — a fonte primária
// do painel é a tabela messages do banco, alimentada pelo webhook).
export const fetchMessages = async (
  instanceName: string,
  remoteJid: string,
  limit: number = 100
): Promise<EvolutionMessage[]> => {
  try {
    const response = await makeRequest<FetchMessagesResponse>(
      `/api/wa/messages/${instanceName}?jid=${encodeURIComponent(remoteJid)}&limit=${limit}`
    );
    return response.messages || [];
  } catch (error) {
    console.error('Error fetching messages from whatsai:', error);
    return [];
  }
};

// Converte o formato do whatsai (Evolution-like) para o formato interno
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

  const phoneNumber = evolutionMsg.key.remoteJid.replace(/@s\.whatsapp\.net|@c\.us|@lid/g, '');

  return {
    id: evolutionMsg.key.id,
    content,
    direction,
    timestamp,
    from_phone: direction === 'incoming' ? phoneNumber : instancePhone,
    to_phone: direction === 'incoming' ? instancePhone : phoneNumber,
  };
};
