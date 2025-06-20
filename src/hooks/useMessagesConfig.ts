import { useState, useEffect } from 'react';

type MessageSource = 'supabase' | 'evolution';

interface MessagesConfig {
  source: MessageSource;
  instanceName: string;
  instancePhone: string;
}

const STORAGE_KEY = 'nutef-messages-config';

const defaultConfig: MessagesConfig = {
  source: 'supabase',
  instanceName: 'default',
  instancePhone: '',
};

export const useMessagesConfig = () => {
  const [config, setConfig] = useState<MessagesConfig>(defaultConfig);

  // Carregar configuração do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        setConfig({ ...defaultConfig, ...parsedConfig });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de mensagens:', error);
    }
  }, []);

  // Salvar configuração no localStorage
  const updateConfig = (newConfig: Partial<MessagesConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
      console.log('✅ Configuração de mensagens salva:', updatedConfig);
    } catch (error) {
      console.error('Erro ao salvar configuração de mensagens:', error);
    }
  };

  const setSource = (source: MessageSource) => {
    updateConfig({ source });
  };

  const setInstanceName = (instanceName: string) => {
    updateConfig({ instanceName });
  };

  const setInstancePhone = (instancePhone: string) => {
    updateConfig({ instancePhone });
  };

  return {
    config,
    setSource,
    setInstanceName,
    setInstancePhone,
    updateConfig,
    isEvolutionMode: config.source === 'evolution',
    isSupabaseMode: config.source === 'supabase',
  };
}; 