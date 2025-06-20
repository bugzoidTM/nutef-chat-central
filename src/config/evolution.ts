
// Evolution API Configuration
export const EVOLUTION_API_CONFIG = {
  BASE_URL: 'https://evolution.nutef.com',
  API_KEY: '5be0fd0304550ebb6027dcce02ae4ab1',
  WEBHOOK_URL: 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook',
  DEFAULT_EVENTS: [
    'MESSAGES_UPSERT',
    'MESSAGES_UPDATE',
    'CONNECTION_UPDATE',
    'SEND_MESSAGE'
  ]
} as const;

export const getInstanceWebhookUrl = () => {
  return EVOLUTION_API_CONFIG.WEBHOOK_URL;
};
