
// Integração WhatsApp — padrão whatsai (whatsai.nutef.com)
// As chamadas passam pelo bridge deste app (mesma origem, /api/wa/*), que fala
// com o whatsai pela rede interna e autentica com o JWT do Supabase do usuário.
export const WHATSAPP_API_CONFIG = {
  BASE_URL: '', // mesma origem
  WEBHOOK_URL: 'https://watende.nutef.com/webhook/whatsai',
  DEFAULT_EVENTS: [
    'messages.upsert',
    'connection.update',
    'qrcode.updated',
  ],
} as const;

// Compatibilidade com código legado
export const EVOLUTION_API_CONFIG = WHATSAPP_API_CONFIG;

export const getInstanceWebhookUrl = () => {
  return WHATSAPP_API_CONFIG.WEBHOOK_URL;
};
