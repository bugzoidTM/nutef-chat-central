# Webhook Alterado para Externo

## 🔄 Alteração Realizada

O sistema foi configurado para usar o webhook externo da Nutef ao invés do webhook interno do Supabase.

### Webhook Anterior (Interno - Supabase)
```
https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook
```

### Webhook Atual (Externo - Nutef)
```
https://webhook.nutef.com/webhook/c2785fe6-f5bc-4233-8e92-d0f47f9d7b80
```

## 📋 Arquivos Alterados

### 1. `src/config/evolution.ts`
- Alterado `WEBHOOK_URL` na configuração principal da Evolution API

### 2. `src/services/evolution/webhookApi.ts`
- Alterado URL do webhook na função `setupWebhookAutomatically`

### 3. `src/services/evolution/instanceApi.ts`
- Alterado URL do webhook na função `createInstance`

### 4. `src/hooks/useWebhookConfig.ts`
- Alterado URL do webhook no hook de configuração

### 5. `test-webhook-evolution.js`
- Alterado `WEBHOOK_URL` no script de teste
- Corrigido erro de sintaxe (aspas não fechadas)

## 🚀 Próximos Passos

1. **Teste o novo webhook:**
   ```bash
   node test-webhook-evolution.js
   ```

2. **Recrie qualquer instância existente** para que ela use o novo webhook automaticamente

3. **Monitore o webhook externo** para verificar se está recebendo os dados

4. **Verifique se as mensagens aparecem no dashboard** após configurar o novo webhook

## 💡 Importante

- Todas as novas instâncias criadas usarão automaticamente o novo webhook externo
- Instâncias existentes podem precisar ser reconfiguradas ou recriadas
- O webhook externo deve processar os dados e enviar para o sistema conforme necessário

## 🔧 Para Reconfigurar Instâncias Existentes

Se você tiver instâncias existentes que ainda usam o webhook antigo, você pode:

1. **Recriar a instância** (método mais simples)
2. **Ou reconfigurar o webhook manualmente** usando a API da Evolution:

```javascript
// Exemplo de reconfiguração manual
const response = await fetch(`https://evolution.nutef.com/webhook/set/NOME_DA_INSTANCIA`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'SUA_API_KEY'
  },
  body: JSON.stringify({
    url: 'https://webhook.nutef.com/webhook/c2785fe6-f5bc-4233-8e92-d0f47f9d7b80',
    enabled: true,
    events: [
      'MESSAGES_UPSERT',
      'CONNECTION_UPDATE',
      'QRCODE_UPDATED'
    ]
  })
});
```

Agora o sistema está configurado para usar o webhook externo da Nutef! 🎉 