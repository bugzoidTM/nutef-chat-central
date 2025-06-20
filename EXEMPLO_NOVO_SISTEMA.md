# Exemplos Práticos - Sistema Evolution API Exclusivo

## Cenário 1: Primeira Configuração

### Situação
Configurando o NutefTalk pela primeira vez com Evolution API.

### Passos
1. **Configure as variáveis de ambiente:**
```env
VITE_EVOLUTION_API_URL=https://minha-evolution-api.com
VITE_EVOLUTION_API_KEY=minha-chave-secreta
```

2. **Certifique-se de que tem uma instância conectada:**
```bash
# Teste se a API está funcionando
curl -H "apikey: minha-chave" https://minha-evolution-api.com/instance/fetchInstances
```

3. **Conecte uma instância via QR Code** (se não estiver conectada)

4. **Abra o NutefTalk** - O sistema detectará automaticamente!

### Resultado
✅ Dashboard carrega com conversas automáticas  
✅ Nenhuma configuração manual necessária  
✅ Instâncias detectadas automaticamente  

---

## Cenário 2: Múltiplas Instâncias

### Situação
Empresa com 3 instâncias Evolution para diferentes setores.

### Configuração Evolution
```
Instância 1: "suporte-tech" (11999000001)
Instância 2: "vendas-online" (11999000002)  
Instância 3: "financeiro" (11999000003)
```

### Como o Sistema Funciona
1. **Detecção Automática:**
```javascript
// O sistema busca todas automaticamente
const instances = await getAllInstancesWithDetails();
// Resultado: 3 instâncias encontradas

// Filtra apenas conectadas
const connected = instances.filter(i => i.connectionState === 'open');
// Resultado: 3 instâncias conectadas

// Usa a primeira como padrão
const defaultInstance = connected[0]; // "suporte-tech"
```

2. **Interface Mostra:**
```
Header: "suporte-tech • 11999000001"
Status: 🟢 Evolution API
Conversas: Mostra chats de "suporte-tech"
```

### Alternando Instâncias (Futuro)
```typescript
// Implementação futura para alternar instâncias
const { setActiveInstance } = useEvolutionInstances();
setActiveInstance('vendas-online'); // Muda para vendas
```

---

## Cenário 3: Debugando Problemas

### Problema: "Nenhuma Instância Conectada"

#### **Verificações no Console:**
```javascript
// 1. Testar conectividade da API
fetch('https://sua-api.com/instance/fetchInstances', {
  headers: { 'apikey': 'sua-chave' }
})
.then(r => r.json())
.then(console.log);

// 2. Ver configuração atual
console.log('API URL:', import.meta.env.VITE_EVOLUTION_API_URL);
console.log('API KEY:', import.meta.env.VITE_EVOLUTION_API_KEY ? 'SET' : 'NOT SET');

// 3. Ver logs do sistema
localStorage.setItem('debug', 'true');
// Recarregue a página e veja logs detalhados
```

#### **Verificações no Terminal:**
```bash
# Testar Evolution API diretamente
curl -X GET "https://sua-api.com/instance/fetchInstances" \
  -H "apikey: sua-chave"

# Testar estado de uma instância específica
curl -X GET "https://sua-api.com/instance/connectionState/sua-instancia" \
  -H "apikey: sua-chave"
```

#### **Soluções Comuns:**
1. **API não responde**: Verificar se Evolution está rodando
2. **API key inválida**: Verificar variável de ambiente
3. **Instâncias desconectadas**: Reconectar via QR Code
4. **CORS**: Configurar CORS na Evolution API

---

## Cenário 4: Monitoramento em Tempo Real

### Visualizar Estado do Sistema

#### **No Console do Browser:**
```javascript
// Ver instâncias carregadas
window.evolutionInstances = {
  total: 3,
  connected: 2,
  disconnected: 1,
  default: "suporte-tech"
};

// Ver conversas ativas
window.evolutionConversations = {
  total: 25,
  new: 5,
  in_progress: 15,
  finished: 5
};

// Ver mensagens da conversa atual
window.currentMessages = {
  count: 45,
  lastUpdate: "2025-01-20T10:30:00Z",
  source: "evolution"
};
```

#### **Logs Importantes:**
```
🔍 useEvolutionInstances - Fetching instances...
✅ useEvolutionInstances - Connected instances: 2

📊 useEvolutionConversations - Fetching chats for instance: suporte-tech
✅ useEvolutionConversations - Conversations fetched: 25

🔍 useMessages - Fetching messages for conversation: 5511999999999@s.whatsapp.net
✅ useMessages - Messages processed: 45
```

---

## Cenário 5: Performance e Otimização

### Tempos Esperados

#### **Carregamento Inicial:**
```
🕐 Instâncias: 2-5 segundos
🕐 Conversas: 3-8 segundos  
🕐 Mensagens: 1-3 segundos
```

#### **Atualizações Automáticas:**
```
⏱️ Instâncias: A cada 30 segundos
⏱️ Conversas: A cada 30 segundos
⏱️ Mensagens: A cada 15 segundos
```

### Otimizações Implementadas
1. **Cache Inteligente**: React Query cache por 10-60 segundos
2. **Retry Logic**: 2 tentativas automáticas em caso de erro
3. **Filtro Local**: Filtros aplicados no frontend
4. **Loading States**: Estados de loading granulares

---

## Cenário 6: Diferentes Tipos de Mensagem

### Mensagens Suportadas

#### **Texto Simples:**
```
👤 Cliente: "Olá, preciso de ajuda"
🏢 Atendente: "Claro! Em que posso ajudar?"
```

#### **Mídia:**
```
📷 Cliente: "Imagem - Foto do problema"
🎥 Cliente: "Vídeo - Demonstração do erro"  
🎵 Cliente: "Áudio - Explicação falada"
📄 Cliente: "Documento - manual.pdf"
```

#### **Especiais:**
```
😊 Cliente: "Sticker - emoji animado"
📍 Cliente: "Localização: Shopping Center"
👤 Cliente: "Contato: João Silva (+55 11 99999-9999)"
```

### Como Aparecem na Interface
- Cada tipo tem ícone específico
- Conteúdo adaptado ao tipo
- URLs de mídia disponíveis quando aplicável

---

## Cenário 7: Grupos do WhatsApp

### Conversas em Grupo

#### **Identificação:**
```typescript
interface EvolutionConversation {
  is_group: true,
  client_name: "Suporte Técnico - Equipe",
  client_phone: "grupo-id-hash",
  id: "120363xxx@g.us"  // Termina com @g.us
}
```

#### **Interface:**
- 👥 Ícone de grupo no avatar
- Badge "Grupo" no cabeçalho
- Nome do grupo como título

#### **Funcionalidades:**
- Envio de mensagens para o grupo
- Visualização de mensagens de todos os participantes
- Setorização automática como "support"

---

## Cenário 8: Estados de Erro

### Tipos de Erro e Soluções

#### **Erro de Conectividade:**
```
❌ "Erro ao carregar conversas: Network Error"

Solução:
- Verificar conexão com internet
- Testar se Evolution API está acessível
- Verificar CORS se em desenvolvimento
```

#### **Erro de Autenticação:**
```
❌ "Erro ao carregar conversas: 401 Unauthorized"

Solução:
- Verificar API key nas variáveis de ambiente
- Testar API key diretamente via curl
- Regenerar API key se necessário
```

#### **Erro de Instância:**
```
❌ "Nenhuma instância conectada disponível"

Solução:
- Conectar pelo menos uma instância
- Verificar estado da conexão
- Reconectar via QR Code se necessário
```

---

## Cenário 9: Envio de Mensagens

### Fluxo Completo

#### **Usuário digita mensagem:**
```
1. Usuário: "Obrigado pelo atendimento!"
2. Sistema: Valida se há instância conectada
3. Sistema: Identifica conversa selecionada
4. Sistema: Chama sendTextMessage(instance, phone, text)
5. Evolution API: Envia para WhatsApp
6. Sistema: Atualiza interface
7. Interface: Mostra mensagem enviada
```

#### **Indicadores Visuais:**
```
🔄 Enviando... (botão desabilitado)
✅ Enviado (mensagem aparece)
❌ Erro (toast de erro)
```

#### **Tratamento de Erros:**
```javascript
try {
  await sendTextMessage(instance, phone, content);
  toast.success("Mensagem enviada!");
} catch (error) {
  toast.error("Erro ao enviar: " + error.message);
}
```

---

## Resumo das Vantagens

### ✅ **O que o Sistema Faz Automaticamente:**
1. **Detecta instâncias Evolution**
2. **Busca conversas ativas**
3. **Carrega mensagens em tempo real**
4. **Atualiza dados periodicamente**
5. **Converte formatos de dados**
6. **Trata diferentes tipos de mídia**
7. **Suporta grupos**
8. **Gerencia estados de erro**

### ✅ **O que Você NÃO Precisa Mais Fazer:**
1. ❌ Configurar nomes de instância manualmente
2. ❌ Informar telefones das instâncias
3. ❌ Alternar entre fontes de dados
4. ❌ Configurar webhooks
5. ❌ Gerenciar sincronização
6. ❌ Tratar conversão de dados

### 🚀 **Resultado Final:**
- **Sistema plug-and-play**
- **Zero configuração manual**
- **Sempre atualizado**
- **Suporte completo ao WhatsApp**

O novo sistema oferece uma experiência muito mais simples e confiável! 🎉 