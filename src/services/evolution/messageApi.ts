
import { makeRequest } from './httpClient';
import type { FindChatsResponse, SendTextMessageRequest, SendTextMessageResponse } from './types';

// Find chats - GET /chat/findChats/{instanceName}
export const findChats = async (instanceName: string): Promise<FindChatsResponse> => {
  console.log('Finding chats for instance:', instanceName);
  
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
