
import { makeRequest } from './httpClient';

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
        'CONNECTION_UPDATE',
        'SEND_MESSAGE'
      ]
    }),
  });
};

// Setup webhook automatically with the correct Evolution API format
export const setupWebhookAutomatically = async (instanceName: string): Promise<any> => {
  const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
  
  console.log('Setting up webhook automatically for instance:', instanceName);
  
  return setWebhook(instanceName, webhookUrl, [
    'MESSAGES_UPSERT',
    'MESSAGES_UPDATE', 
    'CONNECTION_UPDATE',
    'SEND_MESSAGE'
  ]);
};
