# Configurar N8N para Processar Webhooks do WhatsApp

## 🎯 Objetivo
Fazer com que as mensagens recebidas no N8N apareçam no dashboard do sistema.

## 📋 Passo a Passo

### 1. Adicionar Nós ao Fluxo N8N

Conecte os seguintes nós **depois** do nó "Respond to Webhook":

#### **Nó 1: Filtrar Mensagens Recebidas (IF)**
- **Tipo:** `If`
- **Condições:**
  - Condição 1: `{{ $json.body.event }}` **equals** `messages.upsert`
  - Condição 2: `{{ $json.body.data.key.fromMe }}` **equals** `false`
  - **Combinador:** `AND`

#### **Nó 2: Transformar Dados (Set)**
- **Tipo:** `Set`
- **Assignments:**
  - `event` = `MESSAGES_UPSERT` (string)
  - `instance` = `{{ $json.body.instance }}` (string)  
  - `data` = `{{ [$json.body.data] }}` (object)

#### **Nó 3: Enviar para Supabase (HTTP Request)**
- **Tipo:** `HTTP Request`
- **Method:** `POST`
- **URL:** `https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook`
- **Headers:**
  - `Content-Type`: `application/json`
- **Body (JSON):**
```json
{
  "event": "{{ $json.event }}",
  "instance": "{{ $json.instance }}",
  "data": "{{ $json.data }}"
}
```

### 2. Fluxo Completo

```
Webhook → Respond to Webhook → Filtrar Mensagens → Transformar Dados → Enviar para Supabase
```

## 🔧 Configuração Detalhada

### Nó "Filtrar Mensagens Recebidas"
```javascript
// Condição 1: Verificar se é evento de mensagem
{{ $json.body.event }} equals "messages.upsert"

// Condição 2: Verificar se não é mensagem enviada por nós
{{ $json.body.data.key.fromMe }} equals false
```

### Nó "Transformar Dados"
```javascript
// Transformar o formato para o esperado pelo webhook do Supabase
{
  "event": "MESSAGES_UPSERT",
  "instance": "{{ $json.body.instance }}",
  "data": [{{ $json.body.data }}]  // Colocar em array
}
```

### Nó "Enviar para Supabase"
```javascript
// POST para o webhook do Supabase
URL: https://ojfdzfgcysxoxzszhbzr.supabase.co/functions/v1/evolution-webhook
Body: {
  "event": "{{ $json.event }}",
  "instance": "{{ $json.instance }}",
  "data": {{ $json.data }}
}
```

## 🧪 Teste

1. **Envie uma mensagem** para o WhatsApp conectado à instância
2. **Verifique os logs** do N8N para ver se passou pelos filtros
3. **Verifique os logs** do Supabase: https://supabase.com/dashboard/project/ojfdzfgcysxoxzszhbzr/functions/evolution-webhook/logs
4. **Verifique o dashboard** para ver se a mensagem apareceu

## ⚠️ Pontos Importantes

### Estrutura de Dados Recebida
```json
{
  "body": {
    "event": "messages.upsert",
    "instance": "whatsapp_7391008217",
    "data": {
      "key": {
        "remoteJid": "557399921633@s.whatsapp.net",
        "fromMe": false,  // false = mensagem recebida, true = mensagem enviada
        "id": "C1BFC522D0A5CF3C4A279B24A71E8A23"
      },
      "message": {
        "conversation": "Texto da mensagem"
      },
      "pushName": "Nome do Cliente"
    }
  }
}
```

### Instâncias no Banco
Certifique-se de que existe uma instância no banco com `instance_name = "whatsapp_7391008217"`.

### Debug
- **Logs N8N:** Verificar se os dados estão passando pelos nós
- **Logs Supabase:** Verificar se o webhook está processando
- **Dashboard:** Verificar se as conversas aparecem

## 🚀 Resultado Esperado

Após configurar, quando alguém enviar uma mensagem para o WhatsApp:
1. ✅ N8N recebe o webhook
2. ✅ Filtra apenas mensagens recebidas (`fromMe: false`)
3. ✅ Transforma os dados para o formato do Supabase
4. ✅ Envia para o webhook do Supabase
5. ✅ Webhook processa e salva no banco
6. ✅ Mensagem aparece no dashboard

Agora as mensagens devem aparecer automaticamente no dashboard! 🎉 