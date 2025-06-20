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

  // Verificar configuração completa do Evolution API
  async checkEvolutionConfiguration() {
    console.log('🔍 === VERIFICAÇÃO COMPLETA DO EVOLUTION API ===');
    
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    
    console.log(`🔗 Verificando configuração para instância: ${instanceName}`);
    console.log(`📞 Número da instância: ${instance.phone}`);
    console.log(`📡 Status da instância: ${instance.status}`);
    
    // 1. Verificar status da instância
    console.log('\n🔍 1. VERIFICANDO STATUS DA INSTÂNCIA...');
    try {
      const statusResponse = await fetch(`https://evolution.nutef.com/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1'
        }
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('✅ Status da instância:', statusData);
      } else {
        console.error('❌ Erro ao verificar status:', statusResponse.status, statusResponse.statusText);
      }
    } catch (error) {
      console.error('❌ Erro na requisição de status:', error);
    }
    
    // 2. Verificar configuração do webhook
    console.log('\n🔍 2. VERIFICANDO CONFIGURAÇÃO DO WEBHOOK...');
    try {
      const webhookResponse = await fetch(`https://evolution.nutef.com/webhook/find/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1'
        }
      });
      
      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        console.log('✅ Configuração atual do webhook:', webhookData);
        
        const expectedUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
        
        // A estrutura pode ser diferente - vamos verificar várias possibilidades
        const currentUrl = webhookData.url || webhookData.webhook?.url;
        const isEnabled = webhookData.enabled || webhookData.webhook?.enabled;
        const events = webhookData.events || webhookData.webhook?.events || [];
        
        console.log('🔍 Dados extraídos:', {
          url: currentUrl,
          enabled: isEnabled,
          eventsCount: events.length,
          events: events
        });
        
        if (currentUrl === expectedUrl) {
          console.log('✅ URL do webhook está correta');
        } else {
          console.error('❌ URL do webhook incorreta!');
          console.log('URL atual:', currentUrl);
          console.log('URL esperada:', expectedUrl);
        }
        
        if (isEnabled) {
          console.log('✅ Webhook está habilitado');
        } else {
          console.error('❌ Webhook está desabilitado!');
        }
        
        // Verificar se tem MESSAGES_UPSERT nos eventos
        const hasMessagesUpsert = events.includes('MESSAGES_UPSERT');
        if (hasMessagesUpsert) {
          console.log('✅ MESSAGES_UPSERT está configurado');
        } else {
          console.error('❌ MESSAGES_UPSERT NÃO está configurado!');
          console.log('Eventos atuais:', events);
        }
      } else {
        console.error('❌ Erro ao verificar webhook:', webhookResponse.status, webhookResponse.statusText);
      }
    } catch (error) {
      console.error('❌ Erro na requisição de webhook:', error);
    }
    
    // 3. Verificar configuração dos eventos
    console.log('\n🔍 3. VERIFICANDO EVENTOS DO WEBHOOK...');
    try {
      const eventsResponse = await fetch(`https://evolution.nutef.com/settings/find/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1'
        }
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        console.log('✅ Configurações da instância:', eventsData);
      } else {
        console.error('❌ Erro ao verificar eventos:', eventsResponse.status, eventsResponse.statusText);
      }
    } catch (error) {
      console.error('❌ Erro na requisição de eventos:', error);
    }
    
    console.log('\n🎯 RESUMO DA VERIFICAÇÃO:');
    console.log('1. Verifique se a instância está conectada (QR Code escaneado)');
    console.log('2. Verifique se o webhook está habilitado e com URL correta');
    console.log('3. Verifique se os eventos estão configurados para enviar messages.upsert');
  },

  // Configurar webhook automaticamente
  async fixEvolutionWebhook() {
    console.log('🔧 === CORRIGINDO CONFIGURAÇÃO DO WEBHOOK ===');
    
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    
    console.log(`🔧 Configurando webhook para instância: ${instanceName}`);
    
    // Configuração do webhook
    const webhookConfig = {
      webhook: {
        url: 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook',
        enabled: true,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
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
          'CONNECTION_UPDATE',
          'LABELS_EDIT',
          'LABELS_ASSOCIATION',
          'CALL'
        ]
      }
    };
    
    try {
      const response = await fetch(`https://evolution.nutef.com/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1'
        },
        body: JSON.stringify(webhookConfig)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Webhook configurado com sucesso:', result);
        
        // Verificar se foi aplicado
        setTimeout(async () => {
          console.log('\n🔍 Verificando se a configuração foi aplicada...');
          await this.checkEvolutionConfiguration();
        }, 2000);
        
      } else {
        console.error('❌ Erro ao configurar webhook:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Detalhes do erro:', errorText);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
    }
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
  },

  // Teste com payload real do Evolution API
  async testRealEvolutionPayload() {
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    
    // Payload que simula exatamente o que o Evolution API envia
    const payload = {
      "event": "messages.upsert",
      "instance": "whatsapp_73999921633",
      "data": {
        "key": {
          "remoteJid": "5511999999999@s.whatsapp.net",
          "fromMe": false,
          "id": "REAL_TEST_" + Date.now()
        },
        "message": {
          "conversation": "Teste simulando payload real do Evolution - " + new Date().toLocaleString('pt-BR')
        },
        "pushName": "Teste Real",
        "messageTimestamp": Date.now()
      }
    };
    
    console.log('🧪 Testing with REAL Evolution API payload structure...');
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmR6ZmdjeXN4b3h6c3poYnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTc2MDcsImV4cCI6MjA2NTg3MzYwN30.Y3BEkfR24jKAdARwBc8UE-4b2_uwy7B2Sd3RYDsaTQ4'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('📊 Result:', result);
    
    // Aguardar e verificar
    setTimeout(() => this.checkConversations(), 3000);
  },

  // Teste para verificar se o webhook está recebendo as mensagens
  showWebhookLogsInstructions() {
    console.log('📋 Para verificar os logs do webhook:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
    console.log('2. Procure por logs com "🚀 Evolution webhook received request"');
    console.log('3. Verifique se as mensagens reais estão chegando');
    console.log('4. Se não há logs, o problema pode estar na configuração do webhook no Evolution API');
  },

  // Teste para verificar a configuração do webhook
  async verifyWebhookConfiguration() {
    console.log('🔧 Verificando configuração do webhook...');
    
    const instanceName = 'whatsapp_73999921633';
    const apiKey = 'MjM4NzY5NzItMTUyMy00YjZkLWE3YzAtNzJjZWQ4MzM5YjUx';
    const baseUrl = 'https://evolution.nutef.com';
    
    try {
      const response = await fetch(`${baseUrl}/webhook/find/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        }
      });
      
      const webhookConfig = await response.json();
      console.log('📋 Configuração atual do webhook:', JSON.stringify(webhookConfig, null, 2));
      
      const expectedUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
      
      if (webhookConfig.url === expectedUrl) {
        console.log('✅ URL do webhook está correta');
      } else {
        console.log('❌ URL do webhook está incorreta');
        console.log('Expected:', expectedUrl);
        console.log('Current:', webhookConfig.url);
      }
      
      if (webhookConfig.enabled) {
        console.log('✅ Webhook está habilitado');
      } else {
        console.log('❌ Webhook está desabilitado');
      }
      
      console.log('📋 Eventos configurados:', webhookConfig.events);
      
    } catch (error) {
      console.error('❌ Erro ao verificar configuração do webhook:', error);
    }
  },

  // Teste diagnóstico para identificar o problema
  async diagnoseWebhookProblem() {
    console.log('🔍 === DIAGNÓSTICO DO PROBLEMA DO WEBHOOK ===');
    
    console.log('\n1️⃣ Verificando configuração do webhook...');
    await this.verifyWebhookConfiguration();
    
    console.log('\n2️⃣ Testando com payload direto (funciona)...');
    // Usar o teste que já funciona
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    const directPayload = {
      "event": "messages.upsert",
      "instance": "whatsapp_73999921633",
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "DIRECT_TEST_" + Date.now()
      },
      "message": {
        "conversation": "Teste direto que funciona - " + new Date().toLocaleString('pt-BR')
      },
      "pushName": "Teste Direto"
    };
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmR6ZmdjeXN4b3h6c3poYnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTc2MDcsImV4cCI6MjA2NTg3MzYwN30.Y3BEkfR24jKAdARwBc8UE-4b2_uwy7B2Sd3RYDsaTQ4'
        },
        body: JSON.stringify(directPayload)
      });
      const result = await response.json();
      console.log('✅ Teste direto resultado:', result);
    } catch (error) {
      console.error('❌ Erro no teste direto:', error);
    }
    
    console.log('\n3️⃣ Testando com payload real do Evolution (problema)...');
    await this.testRealEvolutionPayload();
    
    console.log('\n4️⃣ Instruções para teste manual:');
    console.log('- Envie uma mensagem real do WhatsApp');
    console.log('- Verifique os logs do webhook');
    console.log('- Compare com os logs dos testes');
    
    console.log('\n📋 Links úteis:');
    console.log('- Logs do webhook: https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
    console.log('- Para testar manualmente: debugHelper.showWebhookLogsInstructions()');
    
    console.log('\n🔍 === PRÓXIMOS PASSOS ===');
    console.log('1. Aguarde os testes terminarem (5 segundos)');
    console.log('2. Envie uma mensagem real do WhatsApp');
    console.log('3. Verifique os logs do webhook');
    console.log('4. Compare os logs dos testes com os logs reais');
  },

  // Análise específica do problema identificado
  async analyzeWebhookIssue() {
    console.log('🔍 === ANÁLISE DO PROBLEMA IDENTIFICADO ===');
    
    console.log('\n🎯 PROBLEMA IDENTIFICADO:');
    console.log('✅ Webhook recebe o payload e retorna sucesso');
    console.log('❌ Mas não cria a conversa no banco de dados');
    console.log('💡 Isso indica erro silencioso no processamento');
    
    console.log('\n📋 DIFERENÇAS ENTRE PAYLOADS:');
    console.log('🟢 Teste que FUNCIONA (direto):');
    console.log('   { event: "messages.upsert", message: {...}, key: {...} }');
    console.log('🔴 Teste que NÃO FUNCIONA (Evolution real):');
    console.log('   { event: "messages.upsert", data: { message: {...}, key: {...} } }');
    
    console.log('\n🔧 TESTE PARA CONFIRMAR:');
    console.log('Vou testar se o problema é realmente a estrutura "data"...');
    
    // Teste com estrutura data
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    const dataPayload = {
      "event": "messages.upsert",
      "instance": "whatsapp_73999921633",
      "data": {
        "key": {
          "remoteJid": "5511888888888@s.whatsapp.net",
          "fromMe": false,
          "id": "DATA_TEST_" + Date.now()
        },
        "message": {
          "conversation": "TESTE COM DATA WRAPPER - " + new Date().toLocaleString('pt-BR')
        },
        "pushName": "Teste Data Wrapper"
      }
    };
    
    try {
      console.log('📤 Enviando teste com estrutura "data"...');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmR6ZmdjeXN4b3h6c3poYnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTc2MDcsImV4cCI6MjA2NTg3MzYwN30.Y3BEkfR24jKAdARwBc8UE-4b2_uwy7B2Sd3RYDsaTQ4'
        },
        body: JSON.stringify(dataPayload)
      });
      
      const result = await response.json();
      console.log('📊 Resultado do teste com data:', result);
      
      // Aguardar e verificar se criou conversa
      setTimeout(async () => {
        console.log('\n🔍 Verificando se a conversa foi criada...');
        await this.checkConversations();
        
        console.log('\n🎯 CONCLUSÃO BASEADA NOS LOGS:');
        console.log('❌ Nos logs vemos: "ℹ️ Unhandled event type: undefined"');
        console.log('💡 Isso significa que eventData.event está undefined');
        console.log('🔧 O webhook está perdendo o event e instance no processamento');
        
        console.log('\n📋 Logs do webhook: https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
        console.log('\n🔍 PROCURE POR ESTES LOGS:');
        console.log('- "🔧 eventData created:" (deve mostrar event e instance)');
        console.log('- "🔄 Final eventData:" (deve mostrar event e instance)');
        console.log('- "🔍 eventData.event value:" (deve mostrar "messages.upsert")');
        console.log('- "ℹ️ Unhandled event type:" (se undefined, confirmamos o problema)');
        
        console.log('\n🎯 PRÓXIMO PASSO:');
        console.log('Execute este teste e verifique os logs para confirmar onde está o problema');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Erro no teste com data:', error);
    }
  },

  // Teste simplificado para debug
  async testSimpleDataPayload() {
    console.log('🧪 === TESTE SIMPLIFICADO COM DATA ===');
    
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    const payload = {
      "event": "messages.upsert",
      "instance": "whatsapp_73999921633",
      "data": {
        "key": {
          "remoteJid": "5511777777777@s.whatsapp.net",
          "fromMe": false,
          "id": "SIMPLE_TEST_" + Date.now()
        },
        "message": {
          "conversation": "Teste simples com data - " + new Date().toLocaleString('pt-BR')
        },
        "pushName": "Debug Test"
      }
    };
    
    console.log('📋 Payload enviado:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmR6ZmdjeXN4b3h6c3poYnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTc2MDcsImV4cCI6MjA2NTg3MzYwN30.Y3BEkfR24jKAdARwBc8UE-4b2_uwy7B2Sd3RYDsaTQ4'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log('📊 Resultado:', result);
      
      console.log('\n🔍 VERIFIQUE OS LOGS EM:');
      console.log('https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
      
      setTimeout(() => this.checkConversations(), 3000);
      
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  },

  // Teste final para confirmar correção
  async testWebhookFix() {
    console.log('🔧 === TESTE FINAL PARA CONFIRMAR CORREÇÃO ===');
    
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    const payload = {
      "event": "messages.upsert",
      "instance": "whatsapp_73999921633",
      "data": {
        "key": {
          "remoteJid": "5511666666666@s.whatsapp.net",
          "fromMe": false,
          "id": "FIX_TEST_" + Date.now()
        },
        "message": {
          "conversation": "TESTE CORREÇÃO DO WEBHOOK - " + new Date().toLocaleString('pt-BR')
        },
        "pushName": "Fix Test"
      }
    };
    
    console.log('📋 Payload de teste:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmR6ZmdjeXN4b3h6c3poYnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTc2MDcsImV4cCI6MjA2NTg3MzYwN30.Y3BEkfR24jKAdARwBc8UE-4b2_uwy7B2Sd3RYDsaTQ4'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log('📊 Resultado:', result);
      
      console.log('\n🔍 VERIFIQUE OS LOGS PARA CONFIRMAR:');
      console.log('https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
      
      console.log('\n📋 PROCURE POR:');
      console.log('✅ "🔧 Verification - eventData.event: messages.upsert"');
      console.log('✅ "🔧 Verification - eventData.instance: whatsapp_73999921633"');
      console.log('✅ "📩 Processing message event" (deve aparecer!)');
      console.log('❌ NÃO deve mais aparecer "ℹ️ Unhandled event type: undefined"');
      
      setTimeout(async () => {
        console.log('\n🔍 Verificando se a conversa foi criada...');
        await this.checkConversations();
        
        console.log('\n🎯 RESULTADO ESPERADO:');
        console.log('✅ Se apareceu conversa nova = PROBLEMA CORRIGIDO!');
        console.log('❌ Se não apareceu = ainda há problema nos logs');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  },

  // Teste para confirmar nova versão do webhook
  async testWebhookVersion() {
    console.log('🔍 === TESTE DE VERSÃO DO WEBHOOK ===');
    
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    const payload = {
      "event": "messages.upsert",
      "instance": "whatsapp_73999921633",
      "data": {
        "key": {
          "remoteJid": "5511555555555@s.whatsapp.net",
          "fromMe": false,
          "id": "VERSION_TEST_" + Date.now()
        },
        "message": {
          "conversation": "Teste de versão - " + new Date().toLocaleString('pt-BR')
        },
        "pushName": "Version Test"
      }
    };
    
    console.log('📋 Testando nova versão do webhook...');
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmR6ZmdjeXN4b3h6c3poYnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTc2MDcsImV4cCI6MjA2NTg3MzYwN30.Y3BEkfR24jKAdARwBc8UE-4b2_uwy7B2Sd3RYDsaTQ4'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log('📊 Resultado:', result);
      
      console.log('\n🔍 VERIFIQUE OS LOGS PARA VER:');
      console.log('https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
      
      console.log('\n📋 PROCURE POR:');
      console.log('✅ "🔄 WEBHOOK VERSION: v2.1.0 - FIXED EVENTDATA LOGIC"');
      console.log('✅ "🔍 body.event value: messages.upsert"');
      console.log('✅ "🔧 eventData created:" com event e instance');
      console.log('✅ "📩 Processing message event"');
      console.log('❌ NÃO deve aparecer "ℹ️ Unhandled event type: undefined"');
      
      console.log('\n🎯 SE APARECER A MENSAGEM DE VERSÃO:');
      console.log('✅ A nova versão está rodando - problema deve estar corrigido!');
      console.log('❌ Se não aparecer - há problema de deploy');
      
      setTimeout(async () => {
        console.log('\n🔍 Verificando conversas...');
        await this.checkConversations();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Erro:', error);
    }
  },

  // Verificar diferenças entre payloads de teste e reais
  async debugWebhookPayloads() {
    console.log('🔍 === ANÁLISE DE PAYLOADS DO WEBHOOK ===');
    
    // 1. Verificar logs recentes do webhook
    console.log('📋 ÚLTIMOS LOGS DO WEBHOOK:');
    console.log('Vá para: https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
    console.log('Procure por mensagens reais (não de teste)');
    
    // 2. Verificar todas as conversas no banco
    console.log('\n🔍 VERIFICANDO TODAS AS CONVERSAS...');
    try {
      const { data: allConversations, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Erro:', error);
      } else {
        console.log('✅ Total de conversas no banco:', allConversations?.length || 0);
        allConversations?.forEach((conv, index) => {
          console.log(`📞 Conversa ${index + 1}:`, {
            id: conv.id,
            client_phone: conv.client_phone,
            client_name: conv.client_name,
            status: conv.status,
            created_at: conv.created_at,
            last_message_at: conv.last_message_at
          });
        });
      }
    } catch (error) {
      console.error('❌ Erro buscando conversas:', error);
    }
    
    // 3. Verificar todas as mensagens
    console.log('\n🔍 VERIFICANDO TODAS AS MENSAGENS...');
    try {
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          *,
          conversations!inner (
            client_phone,
            client_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) {
        console.error('❌ Erro:', error);
      } else {
        console.log('✅ Total de mensagens recentes:', allMessages?.length || 0);
        allMessages?.forEach((msg, index) => {
          console.log(`💬 Mensagem ${index + 1}:`, {
            content: msg.content.substring(0, 50) + '...',
            from_phone: msg.from_phone,
            direction: msg.direction,
            created_at: msg.created_at,
            conversation_phone: msg.conversations?.client_phone
          });
        });
      }
    } catch (error) {
      console.error('❌ Erro buscando mensagens:', error);
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Verifique os logs do webhook para payloads reais');
    console.log('2. Compare a estrutura dos payloads reais vs teste');
    console.log('3. Envie uma mensagem real do WhatsApp agora');
  },

  // Teste com diferentes números para criar múltiplas conversas
  async testMultipleConversations() {
    console.log('🧪 === TESTE DE MÚLTIPLAS CONVERSAS ===');
    
    const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
    const testNumbers = ['5511111111111', '5511222222222', '5511333333333'];
    
    for (let i = 0; i < testNumbers.length; i++) {
      const payload = {
        "event": "messages.upsert",
        "instance": "whatsapp_73999921633",
        "data": {
          "key": {
            "remoteJid": `${testNumbers[i]}@s.whatsapp.net`,
            "fromMe": false,
            "id": `MULTI_TEST_${i}_${Date.now()}`
          },
          "message": {
            "conversation": `Mensagem de teste ${i + 1} - ${new Date().toLocaleString('pt-BR')}`
          },
          "pushName": `Teste ${i + 1}`
        }
      };
      
      console.log(`📤 Enviando teste ${i + 1} para ${testNumbers[i]}...`);
      
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmR6ZmdjeXN4b3h6c3poYnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyOTc2MDcsImV4cCI6MjA2NTg3MzYwN30.Y3BEkfR24jKAdARwBc8UE-4b2_uwy7B2Sd3RYDsaTQ4'
          },
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        console.log(`✅ Teste ${i + 1} resultado:`, result);
        
        // Aguardar 1 segundo entre testes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Erro no teste ${i + 1}:`, error);
      }
    }
    
    console.log('\n⏳ Aguardando 5 segundos para verificar resultados...');
    setTimeout(async () => {
      await this.debugWebhookPayloads();
    }, 5000);
  },

  // Teste enviar mensagem via Evolution API (para testar se dispara webhook)
  async testSendMessageToWebhook() {
    console.log('📤 === TESTE ENVIAR MENSAGEM VIA EVOLUTION API ===');
    
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    
    // Enviar mensagem para um número de teste
    const testNumber = '5511987654321'; // Número fictício para teste
    const testMessage = `Teste automático - ${new Date().toLocaleString('pt-BR')}`;
    
    console.log(`📤 Enviando mensagem de teste para ${testNumber}...`);
    console.log(`📝 Mensagem: ${testMessage}`);
    
    try {
      const response = await fetch(`https://evolution.nutef.com/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1'
        },
        body: JSON.stringify({
          number: testNumber,
          text: testMessage
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Mensagem enviada com sucesso:', result);
        console.log('🔍 Isso deve ter disparado o webhook com event: SEND_MESSAGE');
        
        // Aguardar e verificar se apareceu no webhook
        setTimeout(() => {
          console.log('📋 Verifique os logs do webhook em:');
          console.log('https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
          console.log('Procure por logs com "SEND_MESSAGE" ou texto:', testMessage);
        }, 2000);
        
      } else {
        console.error('❌ Erro ao enviar mensagem:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Detalhes:', errorText);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
    }
  },

  // Verificar se o número da instância está correto
  async verifyInstancePhoneNumber() {
    console.log('📞 === VERIFICAÇÃO DO NÚMERO DA INSTÂNCIA ===');
    
    const { instances } = await this.checkInstances();
    if (!instances || instances.length === 0) {
      console.error('❌ No instances found');
      return;
    }

    const instance = instances[0];
    const instanceName = instance.instance_name;
    
    console.log(`📞 Número no banco: ${instance.phone}`);
    console.log(`🏷️ Nome da instância: ${instanceName}`);
    
    try {
      // Buscar informações da instância no Evolution API
      const response = await fetch(`https://evolution.nutef.com/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': '5be0fd0304550ebb6027dcce02ae4ab1'
        }
      });
      
      if (response.ok) {
        const instances = await response.json();
        console.log('✅ Todas as instâncias no Evolution:', instances);
        
        const ourInstance = instances.find(i => i.instanceName === instanceName);
        if (ourInstance) {
          console.log('✅ Nossa instância encontrada:', ourInstance);
          console.log('📞 Número real:', ourInstance.owner || 'Não informado');
          console.log('📡 Status real:', ourInstance.connectionStatus || 'Não informado');
        } else {
          console.error('❌ Nossa instância não encontrada na lista!');
        }
      } else {
        console.error('❌ Erro ao buscar instâncias:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
    }
  },

  // Teste de stress: monitorar webhook intensivamente
  async intensiveWebhookMonitor() {
    console.log('🔄 === MONITOR INTENSIVO DO WEBHOOK ===');
    console.log('📱 ENVIE UMA MENSAGEM REAL AGORA para o número (73) 99992-1633');
    console.log('⏰ Monitorando por 60 segundos...');
    
    const startTime = new Date();
    let messageFound = false;
    
    const checkMessages = async () => {
      try {
        const { data: newMessages, error } = await supabase
          .from('messages')
          .select(`
            *,
            conversations!inner (
              client_phone,
              client_name
            )
          `)
          .gte('created_at', startTime.toISOString())
          .order('created_at', { ascending: false });
          
        if (!error && newMessages && newMessages.length > 0) {
          const realMessages = newMessages.filter(msg => 
            !msg.content.includes('Teste') && 
            !msg.content.includes('VERSION_TEST') && 
            !msg.content.includes('MULTI_TEST')
          );
          
          if (realMessages.length > 0) {
            console.log('🎉 MENSAGEM REAL DETECTADA!');
            realMessages.forEach(msg => {
              console.log('💬 Mensagem:', {
                content: msg.content,
                from_phone: msg.from_phone,
                direction: msg.direction,
                created_at: msg.created_at,
                conversation_phone: msg.conversations?.client_phone
              });
            });
            messageFound = true;
          }
        }
      } catch (error) {
        console.error('❌ Erro verificando mensagens:', error);
      }
    };
    
    // Verificar a cada 2 segundos por 60 segundos
    const interval = setInterval(checkMessages, 2000);
    
    setTimeout(() => {
      clearInterval(interval);
      if (messageFound) {
        console.log('✅ SUCESSO! Mensagens reais estão chegando!');
      } else {
        console.log('❌ PROBLEMA! Nenhuma mensagem real detectada em 60 segundos');
        console.log('🔍 Próximas verificações:');
        console.log('1. Confirme que enviou a mensagem para (73) 99992-1633');
        console.log('2. Verifique se o WhatsApp está conectado');
        console.log('3. Execute debugHelper.verifyInstancePhoneNumber()');
      }
    }, 60000);
  },

  // Monitorar webhook em tempo real
  async monitorWebhookRealTime() {
    console.log('🔄 === MONITOR DE WEBHOOK EM TEMPO REAL ===');
    console.log('📱 AGORA envie uma mensagem REAL do WhatsApp para o número (73) 99992-1633');
    console.log('🕐 Aguardando 30 segundos para capturar...');
    
    // Marcar o tempo inicial
    const startTime = new Date();
    console.log('⏰ Iniciado em:', startTime.toLocaleString('pt-BR'));
    
    // Verificar mensagens novas a cada 3 segundos por 30 segundos
    const checkInterval = setInterval(async () => {
      try {
        const { data: newMessages, error } = await supabase
          .from('messages')
          .select(`
            *,
            conversations!inner (
              client_phone,
              client_name
            )
          `)
          .gte('created_at', startTime.toISOString())
          .order('created_at', { ascending: false });
          
        if (!error && newMessages && newMessages.length > 0) {
          console.log('🆕 NOVA MENSAGEM DETECTADA:');
          newMessages.forEach(msg => {
            console.log('💬', {
              content: msg.content,
              from_phone: msg.from_phone,
              direction: msg.direction,
              created_at: msg.created_at,
              conversation_phone: msg.conversations?.client_phone,
              is_real: !msg.content.includes('Teste') && !msg.content.includes('VERSION_TEST')
            });
          });
        }
      } catch (error) {
        console.error('❌ Erro verificando mensagens:', error);
      }
    }, 3000);
    
    // Parar após 30 segundos
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('⏹️ Monitoramento finalizado');
      console.log('📋 Verifique também os logs do webhook:');
      console.log('https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs');
    }, 30000);
  },

  // Diagnóstico completo do dashboard
  async debugDashboardIssues() {
    console.log('🔍 === DIAGNÓSTICO COMPLETO DO DASHBOARD ===');
    
    // 1. Verificar autenticação e perfil
    const { user } = await this.checkAuth();
    const { profile } = await this.checkProfile();
    
    if (!user || !profile) {
      console.error('❌ Usuário não autenticado ou sem perfil');
      return;
    }
    
    console.log('✅ Usuário autenticado:', { id: user.id, email: user.email });
    console.log('✅ Perfil encontrado:', { id: profile.id, role: profile.role });
    
    // 2. Testar query de conversas diretamente
    console.log('\n🔍 TESTANDO QUERY DE CONVERSAS...');
    try {
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          instances (
            instance_name,
            phone
          )
        `)
        .order('last_message_at', { ascending: false });
        
      if (convError) {
        console.error('❌ Erro na query de conversas:', convError);
      } else {
        console.log('✅ Conversas encontradas:', conversations?.length || 0);
        console.log('📋 Conversas:', conversations);
      }
    } catch (error) {
      console.error('❌ Erro na query de conversas:', error);
    }
    
    // 3. Testar query específica da conversa de teste
    console.log('\n🔍 PROCURANDO CONVERSA DE TESTE...');
    try {
      const { data: testConv, error: testError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_phone', '5511555555555')
        .maybeSingle();
        
      if (testError) {
        console.error('❌ Erro buscando conversa de teste:', testError);
      } else if (testConv) {
        console.log('✅ Conversa de teste encontrada:', testConv);
        
        // 4. Testar mensagens desta conversa
        const { data: testMessages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', testConv.id)
          .order('timestamp', { ascending: true });
          
        if (msgError) {
          console.error('❌ Erro buscando mensagens de teste:', msgError);
        } else {
          console.log('✅ Mensagens de teste encontradas:', testMessages?.length || 0);
          console.log('📝 Mensagens:', testMessages);
        }
      } else {
        console.log('❌ Conversa de teste não encontrada');
      }
    } catch (error) {
      console.error('❌ Erro buscando conversa de teste:', error);
    }
    
    // 5. Verificar setores do usuário (se for atendente)
    if (profile.role === 'attendant') {
      console.log('\n🔍 VERIFICANDO SETORES DO ATENDENTE...');
      try {
        const { data: sectors, error: sectorError } = await supabase
          .from('attendant_sectors')
          .select('sector')
          .eq('attendant_id', profile.id);
          
        if (sectorError) {
          console.error('❌ Erro buscando setores:', sectorError);
        } else {
          console.log('✅ Setores do atendente:', sectors);
        }
      } catch (error) {
        console.error('❌ Erro buscando setores:', error);
      }
    }
    
    // 6. Testar real-time subscription
    console.log('\n🔍 TESTANDO REAL-TIME SUBSCRIPTION...');
    const channel = supabase
      .channel('test-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('📨 Real-time update recebido:', payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da subscrição:', status);
      });
      
    // Aguardar um pouco e depois limpar
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('🔄 Canal real-time removido');
    }, 5000);
    
    console.log('\n✅ Diagnóstico completo!');
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Se não viu conversas: problema de RLS - execute o SQL de correção');
    console.log('2. Se viu conversas mas não no dashboard: problema de cache/real-time');
    console.log('3. Se real-time não conectou: problema de configuração do Supabase');
  },

  // Forçar atualização do cache do dashboard
  async forceRefreshDashboard() {
    console.log('🔄 === FORÇANDO ATUALIZAÇÃO DO DASHBOARD ===');
    
    // Simulação de como o React Query funciona
    console.log('🔄 Invalidando queries do React Query...');
    
    // Se você tiver acesso ao queryClient globalmente
    if (window.queryClient) {
      window.queryClient.invalidateQueries({ queryKey: ['conversations'] });
      window.queryClient.invalidateQueries({ queryKey: ['messages'] });
      console.log('✅ Queries invalidadas via queryClient global');
    } else {
      console.log('❌ queryClient global não encontrado');
    }
    
    // Tentar forçar uma re-renderização
    console.log('🔄 Para forçar atualização manual:');
    console.log('1. Troque de aba no dashboard e volte');
    console.log('2. Recarregue a página');
    console.log('3. Faça logout e login novamente');
    
    // Teste uma inserção direta para ver se dispara o real-time
    console.log('\n🧪 TESTANDO INSERÇÃO DIRETA PARA DISPARAR REAL-TIME...');
    try {
      const testConvId = crypto.randomUUID();
      const { error } = await supabase.from('conversations').insert({
        id: testConvId,
        instance_id: 'a573ea33-9d0c-4081-add8-7fe47ff1b118', // ID da instância existente
        client_phone: '5511777777777',
        client_name: 'Teste Real-time',
        sector: 'support',
        status: 'new'
      });
      
      if (error) {
        console.error('❌ Erro inserindo conversa de teste:', error);
      } else {
        console.log('✅ Conversa de teste inserida para disparar real-time');
        
        // Remover após 10 segundos
        setTimeout(async () => {
          await supabase.from('conversations').delete().eq('id', testConvId);
          console.log('🗑️ Conversa de teste removida');
        }, 10000);
      }
    } catch (error) {
      console.error('❌ Erro no teste de real-time:', error);
    }
  }
};

// Tornar disponível globalmente para debugging
(window as any).debugHelper = debugHelper; 