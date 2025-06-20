
// Script para testar o webhook localmente
const testWebhook = async () => {
  const webhookUrl = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';
  
  const testData = {
    event: 'messages.upsert',
    instance: 'whatsapp_73999921633',
    data: {
      key: {
        remoteJid: '5573999999999@s.whatsapp.net',
        fromMe: false,
        id: 'test-message-id'
      },
      message: {
        conversation: 'Teste de mensagem do WhatsApp'
      },
      messageTimestamp: Date.now(),
      pushName: 'Teste Cliente'
    }
  };

  try {
    console.log('🧪 Testing webhook with data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.text();
    console.log('📊 Webhook response status:', response.status);
    console.log('📊 Webhook response:', result);
    
  } catch (error) {
    console.error('❌ Error testing webhook:', error);
  }
};

// testWebhook();
console.log('Script carregado. Execute testWebhook() no console para testar o webhook.');
