// Teste do webhook Evolution API
// Este script simula dados reais enviados pela Evolution API

const WEBHOOK_URL = 'https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook';

// Simula uma mensagem de texto recebida
const testMessageUpsert = {
  "event": "MESSAGES_UPSERT",
  "instance": "sua-instancia", // Substitua pelo nome da sua instância
  "data": [
    {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "3EB0F2E8B7B9E8F4A123456789ABCDEF"
      },
      "message": {
        "conversation": "Olá! Esta é uma mensagem de teste para verificar se o webhook está funcionando."
      },
      "pushName": "Cliente Teste",
      "messageTimestamp": Math.floor(Date.now() / 1000)
    }
  ]
};

// Simula atualização de conexão
const testConnectionUpdate = {
  "event": "CONNECTION_UPDATE",
  "instance": "sua-instancia", // Substitua pelo nome da sua instância
  "data": {
    "state": "open",
    "connection": "open"
  }
};

// Função para testar o webhook
async function testWebhook(testData, testName) {
  console.log(`\n🧪 Testando: ${testName}`);
  console.log('📤 Enviando dados:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.text();
    
    console.log('📊 Status:', response.status);
    console.log('📋 Resposta:', result);
    
    if (response.ok) {
      console.log('✅ Teste passou!');
    } else {
      console.log('❌ Teste falhou!');
    }
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes do webhook Evolution API');
  console.log('🔗 URL do webhook:', WEBHOOK_URL);
  
  // Teste 1: Mensagem recebida
  await testWebhook(testMessageUpsert, 'MESSAGES_UPSERT - Mensagem de texto');
  
  // Aguarda um pouco entre os testes
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Teste 2: Atualização de conexão
  await testWebhook(testConnectionUpdate, 'CONNECTION_UPDATE - Conexão aberta');
  
  console.log('\n🏁 Testes concluídos!');
  console.log('\n📋 Instruções:');
  console.log('1. Substitua "sua-instancia" pelo nome real da sua instância');
  console.log('2. Certifique-se de que a instância existe no banco de dados');
  console.log('3. Verifique os logs do Supabase para mais detalhes');
}

runTests(); 