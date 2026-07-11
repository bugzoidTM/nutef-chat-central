
import { makeRequest } from './httpClient';
import type { FindChatsResponse, SendTextMessageResponse } from './types';

// O whatsai não expõe a lista de chats do aparelho; as conversas do painel
// vêm do banco (tabela conversations). Mantido por compatibilidade.
export const findChats = async (instanceName: string): Promise<FindChatsResponse> => {
  console.log('findChats: não suportado pelo whatsai, retornando lista vazia para', instanceName);
  return [] as unknown as FindChatsResponse;
};

// Enviar mensagem de texto via bridge → whatsai
export const sendTextMessage = async (
  instanceName: string,
  number: string,
  text: string
): Promise<SendTextMessageResponse> => {
  console.log('Sending message via whatsai:', { instanceName, number });

  return makeRequest<SendTextMessageResponse>('/api/wa/send', {
    method: 'POST',
    body: JSON.stringify({ instanceName, number, text }),
  });
};

// Legacy
export const sendMessage = async (to: string, content: string, instanceName: string = 'default') => {
  return sendTextMessage(instanceName, to, content);
};
