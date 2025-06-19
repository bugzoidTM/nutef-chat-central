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
      
      if (webhookConfig?.url === expectedWebhookUrl) {
        console.log('✅ Webhook URL is correctly configured');
        console.log('✅ Webhook is enabled:', webhookConfig.enabled);
        console.log('✅ Configured events:', webhookConfig.events);
        return { webhookConfig, expectedWebhookUrl, status: 'configured' };
      } else {
        console.error('❌ Webhook URL mismatch!');
        console.log('Expected:', expectedWebhookUrl);
        console.log('Current:', webhookConfig?.url || 'Not set');
        
        // Verificar se é apenas um problema de string comparison
        console.log('🔍 URL comparison debug:');
        console.log('Expected length:', expectedWebhookUrl.length);
        console.log('Current length:', (webhookConfig?.url || '').length);
        console.log('Are they equal?', webhookConfig?.url === expectedWebhookUrl);
        console.log('Current URL:', JSON.stringify(webhookConfig?.url));
        console.log('Expected URL:', JSON.stringify(expectedWebhookUrl));
        
        return { webhookConfig, expectedWebhookUrl, status: 'mismatch' };
      }
    } catch (error) {
      console.error('❌ Error checking webhook:', error);
    }
  },

  // Reconfigurar webhook com eventos válidos
  async configureWebhookWithValidEvents() {
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    
    console.log(`🔧 Configuring webhook with VALID events for: ${instanceName}`);
    
    // Eventos válidos do Evolution API (baseado no erro retornado)
    const validEvents = [
      'APPLICATION_STARTUP',
      'QRCODE_UPDATED',
      'MESSAGES_SET',        // Este pode ser o evento de mensagens recebidas!
      'MESSAGES_UPSERT',
      'MESSAGES_EDITED',
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
      'CONNECTION_UPDATE',
      'LABELS_EDIT',
      'LABELS_ASSOCIATION',
      'CALL',
      'TYPEBOT_START',
      'TYPEBOT_CHANGE_STATUS',
      'REMOVE_INSTANCE',
      'LOGOUT_INSTANCE'
    ];
    
    try {
      const response = await fetch(`https://evolution.nutef.com/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1',
        },
        body: JSON.stringify({
          webhook: {
            url: webhookUrl,
            enabled: true,
            events: validEvents
          }
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error configuring webhook:', response.status, response.statusText, errorText);
        return;
      }
      
      const result = await response.json();
      console.log('✅ Webhook configured with all valid events:', result);
      console.log('🎯 Key events configured:');
      console.log('  - MESSAGES_SET (may be for received messages)');
      console.log('  - MESSAGES_UPSERT (standard message event)');
      console.log('  - MESSAGES_UPDATE');
      console.log('  - SEND_MESSAGE');
      
      return result;
    } catch (error) {
      console.error('❌ Error configuring webhook:', error);
    }
  },

  // Teste completo após configuração
  async testAfterConfiguration() {
    console.log('🎯 === TESTE APÓS CONFIGURAÇÃO ===');
    
    console.log('\n1️⃣ Configurando webhook com eventos válidos...');
    await this.configureWebhookWithValidEvents();
    
    console.log('\n2️⃣ Verificando configuração...');
    await this.checkEvolutionWebhook();
    
    console.log('\n3️⃣ Enviando mensagem de teste...');
    await this.testSendMessage();
    
    console.log('\n🎯 === PRÓXIMOS PASSOS ===');
    console.log('1. ✅ Aguarde a mensagem chegar no WhatsApp');
    console.log('2. 📱 RESPONDA a mensagem de teste');
    console.log('3. 🔍 Verifique os logs: https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
    console.log('4. 💻 Execute: debugHelper.checkConversations()');
    console.log('5. ⚡ Se funcionar, o problema era o evento MESSAGES_SET!');
  },

  // Verificar se o webhook está recebendo dados
  async checkWebhookLogs() {
    console.log('📊 Para verificar os logs do webhook:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
    console.log('2. Ou execute: debugHelper.testWebhook() para testar manualmente');
    console.log('3. Envie uma mensagem para o WhatsApp e verifique se aparecem logs');
  },

  // Forçar restart da instância para recarregar webhook
  async restartInstance() {
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    
    console.log(`🔄 Trying to restart instance: ${instanceName}`);
    
    // Tentar diferentes endpoints de restart
    const endpoints = [
      `/instance/restart/${instanceName}`,
      `/instance/${instanceName}/restart`,
      `/instance/reboot/${instanceName}`,
      `/manager/restart/${instanceName}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        const response = await fetch(`https://evolution.nutef.com${endpoint}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'apikey': '5be0fd0304550ebb6027dcce02ae4ab1',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Instance restart successful with endpoint:', endpoint);
          console.log('📄 Result:', result);
          return result;
        } else {
          console.log(`❌ Failed with ${endpoint}: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Error with ${endpoint}:`, error.message);
      }
    }
    
    console.error('❌ All restart endpoints failed');
    return null;
  },

  // Verificar status da conexão da instância
  async checkInstanceConnection() {
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    
    console.log(`🔍 Checking connection status for: ${instanceName}`);
    
    try {
      const response = await fetch(`https://evolution.nutef.com/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1',
        },
      });
      
      if (!response.ok) {
        console.error('❌ Error checking connection:', response.status, response.statusText);
        return;
      }
      
      const connectionData = await response.json();
      console.log('📡 Connection Status:', connectionData);
      
      return connectionData;
    } catch (error) {
      console.error('❌ Error checking connection:', error);
    }
  },

  // Reconfigurar webhook com mais eventos
  async reconfigureWebhookWithAllEvents() {
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    
    console.log(`🔧 Reconfiguring webhook with ALL events for: ${instanceName}`);
    
    try {
      const response = await fetch(`https://evolution.nutef.com/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1',
        },
        body: JSON.stringify({
          webhook: {
            url: webhookUrl,
            enabled: true,
            events: [
              'APPLICATION_STARTUP',
              'QRCODE_UPDATED', 
              'CONNECTION_UPDATE',
              'MESSAGES_UPSERT',
              'messages.upsert',
              'MESSAGES_UPDATE',
              'messages.update',
              'MESSAGES_DELETE',
              'messages.delete',
              'SEND_MESSAGE',
              'send.message',
              'CONTACTS_SET',
              'contacts.set',
              'CONTACTS_UPSERT',
              'contacts.upsert',
              'CONTACTS_UPDATE',
              'contacts.update',
              'PRESENCE_UPDATE',
              'presence.update',
              'CHATS_SET',
              'chats.set',
              'CHATS_UPSERT',
              'chats.upsert',
              'CHATS_UPDATE',
              'chats.update',
              'CHATS_DELETE',
              'chats.delete',
              'GROUPS_UPSERT',
              'groups.upsert',
              'GROUP_UPDATE',
              'group.update',
              'GROUP_PARTICIPANTS_UPDATE',
              'group.participants.update',
              'NEW_JWT_TOKEN'
            ]
          }
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error reconfiguring webhook:', response.status, response.statusText, errorText);
        return;
      }
      
      const result = await response.json();
      console.log('✅ Webhook reconfigured with all events:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error reconfiguring webhook:', error);
    }
  },

  // Testar se a instância consegue enviar mensagem
  async testSendMessage() {
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    
    console.log(`📤 Testing send message from: ${instanceName}`);
    
    const testPhone = '5511932473951'; // Número que você usou para enviar mensagem
    const testMessage = 'Teste de envio - ' + new Date().toLocaleString();
    
    try {
      const response = await fetch(`https://evolution.nutef.com/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1',
        },
        body: JSON.stringify({
          number: testPhone,
          text: testMessage
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error sending test message:', response.status, response.statusText, errorText);
        return;
      }
      
      const result = await response.json();
      console.log('✅ Test message sent:', result);
      console.log('📱 Check your WhatsApp to confirm message was received');
      
      return result;
    } catch (error) {
      console.error('❌ Error sending test message:', error);
    }
  },

  // Diagnóstico completo
  async fullDiagnosis() {
    console.log('🔍 === DIAGNÓSTICO COMPLETO ===');
    
    console.log('\n1️⃣ Verificando autenticação e perfil...');
    await this.checkAuth();
    await this.checkProfile();
    
    console.log('\n2️⃣ Verificando instâncias...');
    await this.checkInstances();
    
    console.log('\n3️⃣ Verificando conexão da instância...');
    await this.checkInstanceConnection();
    
    console.log('\n4️⃣ Verificando configuração do webhook...');
    await this.checkEvolutionWebhook();
    
    console.log('\n5️⃣ Reconfigurando webhook com todos os eventos...');
    await this.reconfigureWebhookWithAllEvents();
    
    console.log('\n6️⃣ Testando envio de mensagem...');
    await this.testSendMessage();
    
    console.log('\n7️⃣ Verificando conversas...');
    await this.checkConversations();
    
    console.log('\n🔍 === FIM DO DIAGNÓSTICO ===');
    console.log('📋 Próximos passos:');
    console.log('1. Aguarde o teste de envio chegar no WhatsApp');
    console.log('2. Responda a mensagem de teste');
    console.log('3. Execute: debugHelper.checkConversations()');
    console.log('4. Verifique os logs: https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
  },

  // Testar webhook com payload real do Evolution API
  async testWebhookWithRealPayload() {
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    
    // Payload exato capturado do Evolution API
    const realPayload = {
      "event": "messages.upsert",
      "instance": "whatsapp_73999921633",
      "data": {
        "key": {
          "remoteJid": "5511932473951@s.whatsapp.net",
          "fromMe": false,
          "id": "TEST_MESSAGE_" + Date.now()
        },
        "pushName": "Teste Debug",
        "status": "DELIVERY_ACK",
        "message": {
          "conversation": "Mensagem de teste com payload real - " + new Date().toLocaleString(),
          "messageContextInfo": {
            "deviceListMetadata": {
              "senderKeyHash": "test==",
              "senderTimestamp": "1749394460",
              "recipientKeyHash": "test==",
              "recipientTimestamp": "1750350225"
            },
            "deviceListMetadataVersion": 2,
            "messageSecret": "test"
          }
        },
        "messageType": "conversation",
        "messageTimestamp": Date.now(),
        "instanceId": "79fe5b11-8137-4bc0-ab38-342dd871853e",
        "source": "android"
      },
      "destination": webhookUrl,
      "date_time": new Date().toISOString(),
      "sender": "557399921633@s.whatsapp.net",
      "server_url": "https://evolution.nutef.com",
      "apikey": "5497DCC5-BB88-495B-8F21-A9B88D365C15"
    };
    
    console.log('🧪 Testing webhook with REAL Evolution API payload...');
    console.log('📋 Payload structure matches captured data from webhook.site');
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmR6ZmdjeXN4b3h6c3poYnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTc2MDcsImV4cCI6MjA2NTg3MzYwN30.Y3BEkfR24jKAdARwBc8UE-4b2_uwy7B2Sd3RYDsaTQ4',
          'User-Agent': 'Evolution-API/1.0'
        },
        body: JSON.stringify(realPayload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook test failed:', response.status, response.statusText, errorText);
        return;
      }
      
      const result = await response.text();
      console.log('✅ Webhook test with real payload successful:', result);
      
      // Aguardar e verificar se a conversa foi criada
      setTimeout(async () => {
        console.log('🔄 Checking conversations after real payload test...');
        await this.checkConversations();
      }, 3000);
      
      return result;
    } catch (error) {
      console.error('❌ Error testing webhook with real payload:', error);
    }
  },

  // Teste final com payload real
  async finalTest() {
    console.log('🎯 === TESTE FINAL COM PAYLOAD REAL ===');
    
    console.log('\n1️⃣ Testando webhook com payload real do Evolution API...');
    await this.testWebhookWithRealPayload();
    
    console.log('\n2️⃣ Aguardando processamento...');
    console.log('⏳ Verificando logs em 5 segundos...');
    
    setTimeout(async () => {
      console.log('\n3️⃣ Verificando resultados...');
      await this.checkConversations();
      await this.checkMessages();
      
      console.log('\n🎯 === PRÓXIMOS PASSOS ===');
      console.log('1. ✅ Se funcionou: o problema era o formato do evento!');
      console.log('2. ❌ Se não funcionou: verificar logs do Supabase');
      console.log('3. 📋 Logs: https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
    }, 5000);
  }
};

// Tornar disponível globalmente para debugging
(window as any).debugHelper = debugHelper; 