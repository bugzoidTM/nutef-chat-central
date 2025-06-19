const payload = {
  event: 'messages.upsert',
  instance: 'whatsapp_73999921633',
  data: {
    key: {
      remoteJid: '5511932473951@s.whatsapp.net',
      fromMe: false,
      id: 'REAL_TEST_' + Date.now()
    },
    pushName: 'Debug Test Final',
    message: {
      conversation: 'Teste final com estrutura real - ' + new Date().toLocaleString('pt-BR')
    }
  }
};

fetch('https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZmR6Zmdjesx4eG96enNoYnp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MDA0OTUsImV4cCI6MjA2NDk3NjQ5NX0.j8C4IWjDDfq6d4_rVqXBAWZ7qlIJkVdEzALKjVjFi6I'
  },
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(console.log)
.catch(console.error); 