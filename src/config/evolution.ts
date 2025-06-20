
// Evolution API Configuration
export const EVOLUTION_API_CONFIG = {
  BASE_URL: 'https://evolution.nutef.com',
  API_KEY: '5be0fd0304550ebb6027dcce02ae4ab1',
  WEBHOOK_URL: 'https://webhook.nutef.com/webhook/c2785fe6-f5bc-4233-8e92-d0f47f9d7b80',
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
