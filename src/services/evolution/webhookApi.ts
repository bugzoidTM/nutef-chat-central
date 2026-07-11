
import { makeRequest } from './httpClient';

// O webhook do whatsai é gerenciado pelo bridge: aponta sempre para
// /webhook/whatsai deste app, com token próprio. Estes helpers apenas
// (re)aplicam ou consultam essa configuração.
export const setWebhook = async (
  instanceName: string,
  _webhookUrl?: string,
  _webhookEvents?: string[]
): Promise<any> => {
  return makeRequest(`/api/wa/webhook/${instanceName}`, { method: 'POST' });
};

export const getWebhook = async (instanceName: string): Promise<any> => {
  return makeRequest(`/api/wa/webhook/${instanceName}`, { method: 'GET' });
};

export const setupWebhookAutomatically = async (instanceName: string): Promise<any> => {
  return setWebhook(instanceName);
};
