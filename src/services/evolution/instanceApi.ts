import { makeRequest } from './httpClient';
import type { 
  CreateInstanceRequest, 
  CreateInstanceResponse, 
  ConnectionStateResponse, 
  QRCodeResponse,
  FetchInstancesResponse, 
  InstanceInfo, 
  ConnectionInfo
} from './types';

// Create instance with webhook configuration included from the start
export const createInstance = async (
  instanceName: string,
  options: Partial<CreateInstanceRequest> = {}
): Promise<CreateInstanceResponse> => {
  console.log('Creating Evolution API instance:', instanceName, 'with options:', options);
  
  const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
  
  const requestBody = {
    instanceName,
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
    webhook: {
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'SEND_MESSAGE'
      ]
    },
    ...options,
  };

  console.log('Instance creation request body:', requestBody);
  
  return makeRequest<CreateInstanceResponse>('/instance/create', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
};

// Generate QR Code
export const getQRCode = async (instanceName: string): Promise<QRCodeResponse> => {
  console.log('Getting QR code for instance:', instanceName);
  
  return makeRequest<QRCodeResponse>(`/instance/connect/${instanceName}`);
};

// Check connection state
export const getConnectionState = async (instanceName: string): Promise<ConnectionStateResponse> => {
  console.log('Checking connection state for instance:', instanceName);
  
  return makeRequest<ConnectionStateResponse>(`/instance/connectionState/${instanceName}`);
};

// Check if instance exists
export const checkInstanceExists = async (instanceName: string): Promise<boolean> => {
  try {
    await getConnectionState(instanceName);
    return true;
  } catch (error: any) {
    if (error.message.includes('404') || error.message.includes('does not exist')) {
      return false;
    }
    throw error;
  }
};

// Fetch all instances - GET /instance/fetchInstances
export const fetchInstances = async (): Promise<InstanceInfo[]> => {
  console.log('Fetching all Evolution instances...');
  
  try {
    const response = await makeRequest<InstanceInfo[]>('/instance/fetchInstances');
    
    // A resposta pode ser um array direto ou um objeto com propriedade instances
    const instances = Array.isArray(response) ? response : (response as any).instances || [];
    
    console.log('✅ Instances fetched:', instances.length);
    return instances;
  } catch (error) {
    console.error('❌ Error fetching instances:', error);
    return [];
  }
};

// Get connection info for a specific instance - GET /instance/connect/{instanceName}
export const getConnectionInfo = async (instanceName: string): Promise<ConnectionInfo | null> => {
  console.log('Getting connection info for instance:', instanceName);
  
  try {
    const response = await makeRequest<ConnectionInfo>(`/instance/connect/${instanceName}`);
    console.log('✅ Connection info fetched for', instanceName);
    return response;
  } catch (error) {
    console.error('❌ Error getting connection info for', instanceName, ':', error);
    return null;
  }
};

// Get connection state for a specific instance - GET /instance/connectionState/{instanceName}
export const getConnectionStateForSpecificInstance = async (instanceName: string): Promise<ConnectionStateResponse | null> => {
  console.log('Getting connection state for instance:', instanceName);
  
  try {
    const response = await makeRequest<ConnectionStateResponse>(`/instance/connectionState/${instanceName}`);
    console.log('✅ Connection state fetched for', instanceName, ':', response.instance.state);
    return response;
  } catch (error) {
    console.error('❌ Error getting connection state for', instanceName, ':', error);
    return null;
  }
};

// Get detailed instance information with connection details
export const getInstanceDetails = async (instanceName: string): Promise<InstanceInfo | null> => {
  console.log('Getting detailed info for instance:', instanceName);
  
  try {
    // Buscar informações de conexão
    const connectionInfo = await getConnectionInfo(instanceName);
    const connectionState = await getConnectionStateForSpecificInstance(instanceName);
    
    if (!connectionInfo) {
      return null;
    }
    
    const instanceDetails: InstanceInfo = {
      instanceName: connectionInfo.instance.instanceName,
      status: connectionState?.instance.state || 'unknown',
      profilePictureUrl: connectionInfo.instance.profilePictureUrl,
      profileName: connectionInfo.instance.profileName,
      phoneNumber: connectionInfo.instance.phoneNumber,
      connectionState: connectionState?.instance.state
    };
    
    console.log('✅ Instance details compiled for', instanceName);
    return instanceDetails;
  } catch (error) {
    console.error('❌ Error getting instance details for', instanceName, ':', error);
    return null;
  }
};

// Get all instances with detailed information
export const getAllInstancesWithDetails = async (): Promise<InstanceInfo[]> => {
  console.log('Getting all instances with detailed information...');
  
  try {
    const instances = await fetchInstances();
    
    if (instances.length === 0) {
      console.log('⚠️ No instances found');
      return [];
    }
    
    // Buscar detalhes para cada instância
    const instancesWithDetails = await Promise.allSettled(
      instances.map(instance => getInstanceDetails(instance.instanceName))
    );
    
    // Filtrar apenas as instâncias com sucesso
    const validInstances = instancesWithDetails
      .filter((result): result is PromiseFulfilledResult<InstanceInfo> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
    
    console.log('✅ Instances with details:', validInstances.length, 'out of', instances.length);
    return validInstances;
  } catch (error) {
    console.error('❌ Error getting all instances with details:', error);
    return [];
  }
};
