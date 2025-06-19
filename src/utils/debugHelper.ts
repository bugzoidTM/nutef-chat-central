import { supabase } from '@/integrations/supabase/client';

export const debugHelper = {
  // Verificar se o usuário está autenticado
  async checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('🔐 Auth Status:', { 
      user: user ? { id: user.id, email: user.email } : null, 
      error: error?.message 
    });
    return { user, error };
  },

  // Verificar perfil do usuário
  async checkProfile() {
    const { user } = await this.checkAuth();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('👤 Profile Status:', { 
      profile: profile ? { id: profile.id, name: profile.name, role: profile.role } : null, 
      error: error?.message 
    });
    return { profile, error };
  },

  // Verificar instâncias
  async checkInstances() {
    const { data: instances, error } = await supabase
      .from('instances')
      .select('*');

    console.log('🏢 Instances Status:', { 
      count: instances?.length || 0,
      instances: instances?.map(i => ({ name: i.instance_name, phone: i.phone, status: i.status })),
      error: error?.message 
    });
    return { instances, error };
  },

  // Verificar conversas
  async checkConversations() {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('💬 Conversations Status:', { 
      count: conversations?.length || 0,
      conversations: conversations?.map(c => ({ 
        client_phone: c.client_phone, 
        sector: c.sector, 
        status: c.status 
      })),
      error: error?.message 
    });
    return { conversations, error };
  },

  // Verificar mensagens
  async checkMessages() {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('📝 Messages Status:', { 
      count: messages?.length || 0,
      messages: messages?.map(m => ({ 
        content: m.content.substring(0, 50) + '...', 
        direction: m.direction,
        timestamp: m.timestamp
      })),
      error: error?.message 
    });
    return { messages, error };
  },

  // Verificar tudo
  async checkAll() {
    console.log('🔍 === DEBUG REPORT ===');
    await this.checkAuth();
    await this.checkProfile();
    await this.checkInstances();
    await this.checkConversations();
    await this.checkMessages();
    console.log('🔍 === END DEBUG REPORT ===');
  },

  // Criar dados de teste
  async createTestData() {
    const { profile } = await this.checkProfile();
    if (!profile) {
      console.error('❌ No profile found. Cannot create test data.');
      return;
    }

    // Criar instância de teste
    const { data: testInstance, error: instanceError } = await supabase
      .from('instances')
      .upsert({
        instance_name: 'test_instance',
        phone: '5511999999999',
        admin_id: profile.id,
        status: 'connected',
        webhook_url: 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook',
      })
      .select()
      .single();

    if (instanceError) {
      console.error('❌ Error creating test instance:', instanceError);
      return;
    }

    console.log('✅ Test instance created:', testInstance);

    // Criar conversa de teste
    const { data: testConversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        instance_id: testInstance.id,
        client_phone: '5511888888888',
        client_name: 'Cliente Teste',
        sector: 'support',
        status: 'new',
      })
      .select()
      .single();

    if (conversationError) {
      console.error('❌ Error creating test conversation:', conversationError);
      return;
    }

    console.log('✅ Test conversation created:', testConversation);

    // Criar mensagem de teste
    const { data: testMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: testConversation.id,
        from_phone: '5511888888888',
        to_phone: '5511999999999',
        content: 'Olá! Esta é uma mensagem de teste.',
        direction: 'incoming',
      })
      .select()
      .single();

    if (messageError) {
      console.error('❌ Error creating test message:', messageError);
      return;
    }

    console.log('✅ Test message created:', testMessage);
    console.log('🎉 Test data creation completed!');
  },

  // Limpar dados de teste
  async cleanTestData() {
    console.log('🧹 Cleaning test data...');
    
    // Deletar mensagens de teste
    await supabase.from('messages').delete().like('content', '%teste%');
    
    // Deletar conversas de teste
    await supabase.from('conversations').delete().eq('client_name', 'Cliente Teste');
    
    // Deletar instâncias de teste
    await supabase.from('instances').delete().eq('instance_name', 'test_instance');
    
    console.log('✅ Test data cleaned');
  },

  // Verificar configuração do webhook no Evolution API
  async checkEvolutionWebhook() {
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    
    console.log(`🔗 Checking webhook config for instance: ${instanceName}`);
    
    try {
      // Verificar configuração do webhook
      const response = await fetch(`https://evolution.nutef.com/webhook/find/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1',
        },
      });
      
      if (!response.ok) {
        console.error('❌ Error fetching webhook config:', response.status, response.statusText);
        return;
      }
      
      const webhookConfig = await response.json();
      console.log('🔗 Webhook Configuration:', webhookConfig);
      
      const expectedWebhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
      
      if (webhookConfig?.webhook?.url === expectedWebhookUrl) {
        console.log('✅ Webhook URL is correctly configured');
      } else {
        console.error('❌ Webhook URL mismatch!');
        console.log('Expected:', expectedWebhookUrl);
        console.log('Current:', webhookConfig?.webhook?.url || 'Not set');
      }
      
      return { webhookConfig, expectedWebhookUrl };
    } catch (error) {
      console.error('❌ Error checking webhook:', error);
    }
  },

  // Configurar webhook no Evolution API
  async configureEvolutionWebhook() {
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    
    console.log(`🔧 Configuring webhook for instance: ${instanceName}`);
    
    try {
      const response = await fetch(`https://evolution.nutef.com/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1',
        },
        body: JSON.stringify({
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: false,
          events: [
            'APPLICATION_STARTUP',
            'QRCODE_UPDATED', 
            'CONNECTION_UPDATE',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'MESSAGES_DELETE',
            'SEND_MESSAGE',
            'CONTACTS_SET',
            'CONTACTS_UPSERT',
            'CONTACTS_UPDATE',
            'PRESENCE_UPDATE',
            'CHATS_SET',
            'CHATS_UPSERT',
            'CHATS_UPDATE',
            'CHATS_DELETE',
            'GROUPS_UPSERT',
            'GROUP_UPDATE',
            'GROUP_PARTICIPANTS_UPDATE',
            'NEW_JWT_TOKEN'
          ]
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error configuring webhook:', response.status, response.statusText, errorText);
        return;
      }
      
      const result = await response.json();
      console.log('✅ Webhook configured successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error configuring webhook:', error);
    }
  },

  // Testar webhook manualmente
  async testWebhook() {
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    
    const testData = {
      event: 'MESSAGES_UPSERT',
      instance: 'whatsapp_73999921633',
      data: {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false,
          id: 'test-message-id'
        },
        message: {
          conversation: 'Esta é uma mensagem de teste do debugHelper'
        },
        pushName: 'Teste Debugger',
        messageTimestamp: Date.now()
      }
    };
    
    console.log('🧪 Testing webhook with test data...');
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook test failed:', response.status, response.statusText, errorText);
        return;
      }
      
      const result = await response.text();
      console.log('✅ Webhook test successful:', result);
      
      // Aguardar um pouco e verificar se a conversa foi criada
      setTimeout(async () => {
        await this.checkConversations();
      }, 2000);
      
      return result;
    } catch (error) {
      console.error('❌ Error testing webhook:', error);
    }
  }
};

// Tornar disponível globalmente para debugging
(window as any).debugHelper = debugHelper; 