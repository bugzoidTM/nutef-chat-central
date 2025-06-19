
import { makeRequest } from './httpClient';

// Set webhook - POST /webhook/set/{instanceName}
export const setWebhook = async (
  instanceName: string,
  webhookUrl: string,
  webhookEvents?: string[]
): Promise<any> => {
  console.log('Setting webhook for instance:', instanceName, 'URL:', webhookUrl);
  
  const events = webhookEvents || [
    'MESSAGES_UPSERT',
    'MESSAGES_UPDATE',
    'CONNECTION_UPDATE',
    'SEND_MESSAGE'
  ];
  
  return makeRequest(`/webhook/set/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: events
    }),
  });
};

// Get webhook info - GET /webhook/find/{instanceName}
export const getWebhook = async (instanceName: string): Promise<any> => {
  console.log('Getting webhook info for instance:', instanceName);
  
  return makeRequest(`/webhook/find/${instanceName}`, {
    method: 'GET',
  });
};

// Setup webhook automatically with the correct Evolution API format
export const setupWebhookAutomatically = async (instanceName: string): Promise<any> => {
  const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
  
  console.log('Setting up webhook automatically for instance:', instanceName);
  
  try {
    // First try to get existing webhook
    const existingWebhook = await getWebhook(instanceName);
    console.log('Existing webhook:', existingWebhook);
    
    // Set or update webhook
    const result = await setWebhook(instanceName, webhookUrl, [
      'MESSAGES_UPSERT',
      'MESSAGES_UPDATE', 
      'CONNECTION_UPDATE',
      'SEND_MESSAGE'
    ]);
    
    console.log('Webhook setup result:', result);
    return result;
  } catch (error) {
    console.error('Error setting up webhook:', error);
    throw error;
  }
};
