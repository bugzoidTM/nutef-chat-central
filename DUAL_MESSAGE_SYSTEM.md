# Sistema Dual de Mensagens - NutefTalk

## Visão Geral

O sistema de multiatendimento NutefTalk agora suporta duas formas de buscar mensagens:

1. **Supabase (Banco de Dados)** - Método original via webhooks
2. **Evolution API (Direto)** - Novo método que busca mensagens diretamente da API

## Arquivos Implementados

### 1. Tipos Unificados (`src/services/evolution/types.ts`)

```typescript
// Novos tipos para Evolution API
export interface FindMessagesRequest { ... }
export interface EvolutionMessage { ... }
export interface FindMessagesResponse { ... }

// Tipo unificado compatível com ambas as fontes
export interface UnifiedMessage {
  id: string;
  content: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  from_phone: string;
  to_phone: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact';
  media_url?: string;
  caption?: string;
  source: 'supabase' | 'evolution'; // Indicador da fonte
}
```

### 2. API da Evolution (`src/services/evolution/messageApi.ts`)

```typescript
// Buscar mensagens da Evolution API
export const findMessages = async (
  instanceName: string,
  remoteJid: string,
  limit = 50,
  offset = 0
): Promise<FindMessagesResponse> => { ... }

// Converter mensagens da Evolution para formato unificado
export const convertEvolutionMessageToUnified = (
  evolutionMessage: EvolutionMessage,
  instancePhone: string
): UnifiedMessage => { ... }
```

### 3. Hook Unificado de Mensagens (`src/hooks/useMessages.ts`)

```typescript
export const useMessages = (
  selectedConversation: string | null, 
  options: UseMessagesOptions = {}
) => {
  // Busca tanto do Supabase quanto da Evolution API
  // baseado na configuração
}

// Hooks específicos para compatibilidade
export const useSupabaseMessages = (selectedConversation: string | null) => { ... }
export const useEvolutionMessages = (
  selectedConversation: string | null,
  instanceName: string,
  instancePhone: string
) => { ... }
```

### 4. Configuração de Mensagens (`src/hooks/useMessagesConfig.ts`)

```typescript
export const useMessagesConfig = () => {
  // Gerencia configuração salva no localStorage
  // Permite alternar entre Supabase e Evolution API
  // Armazena configurações da instância Evolution
}
```

### 5. Seletor de Fonte (`src/components/dashboard/MessageSourceSelector.tsx`)

Interface gráfica para:
- Alternar entre Supabase e Evolution API
- Configurar nome da instância
- Configurar telefone da instância
- Visualizar status atual

### 6. Dashboard Atualizado (`src/components/dashboard/Dashboard.tsx`)

```typescript
const Dashboard = () => {
  const { config, isEvolutionMode } = useMessagesConfig();
  
  // Usar hook com configuração dinâmica
  const { messages, messagesLoading } = useMessages(selectedConversation, {
    source: config.source,
    instanceName: config.instanceName,
    instancePhone: config.instancePhone,
  });
  
  // ... resto do código
}
```

### 7. ChatArea Aprimorado (`src/components/dashboard/ChatArea.tsx`)

- Suporte a `UnifiedMessage`
- Indicadores visuais do tipo de mensagem
- Indicadores da fonte da mensagem (Supabase vs Evolution)
- Melhor tratamento de loading

## Como Usar

### 1. Configuração Inicial

1. Acesse o Dashboard
2. Clique em "Configurar Fonte de Mensagens"
3. Escolha entre:
   - **Supabase**: Mensagens do banco (método atual)
   - **Evolution API**: Mensagens diretas da API

### 2. Configuração da Evolution API

Se escolher Evolution API, configure:
- **Nome da Instância**: Nome configurado na Evolution API (ex: "default")
- **Telefone da Instância**: Número do WhatsApp conectado (ex: "5511999999999")

### 3. Visualização

- Mensagens do Supabase: Ícone de banco de dados 🗄️
- Mensagens da Evolution: Ícone de raio ⚡
- Status visível no cabeçalho da lista de conversas

## Vantagens de Cada Método

### Supabase (Banco de Dados)
✅ **Vantagens:**
- Mais rápido para carregar
- Funciona offline (dados já armazenados)
- Suporte a busca e filtragem avançada
- Histórico persistente

❌ **Desvantagens:**
- Depende do webhook funcionar
- Pode ter mensagens perdidas se webhook falhar
- Não mostra mensagens mais recentes se webhook estiver com problema

### Evolution API (Direto)
✅ **Vantagens:**
- Sempre atualizado (dados em tempo real)
- Não depende de webhooks
- Recupera todo o histórico disponível no WhatsApp
- Funciona mesmo se webhook estiver com problema

❌ **Desvantagens:**
- Mais lento para carregar
- Requer conexão ativa com Evolution API
- Limitado pelos limites de rate da API
- Não persiste dados localmente

## Casos de Uso Recomendados

### Use Supabase quando:
- Precisa de velocidade máxima
- Tem webhook funcionando corretamente
- Quer funcionalidades de busca avançada
- Sistema em produção estável

### Use Evolution API quando:
- Webhook não está funcionando
- Precisa recuperar mensagens perdidas
- Quer garantir dados mais atualizados
- Está testando ou fazendo troubleshooting

## Configuração da Evolution API

### Endpoints Utilizados

```
POST /chat/findMessages/{instanceName}
```

### Formato de Requisição

```json
{
  "where": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net"
    }
  },
  "limit": 50,
  "offset": 0
}
```

### Variáveis de Ambiente Necessárias

Certifique-se de que estas variáveis estão configuradas:

```env
VITE_EVOLUTION_API_URL=https://sua-evolution-api.com
VITE_EVOLUTION_API_KEY=sua-chave-da-api
```

## Monitoramento e Debug

### Logs do Console

O sistema gera logs detalhados:

```
🔍 useMessages - Fetching messages for conversation: xxx source: evolution
📡 useMessages - Fetching from Evolution API: { instanceName: "default", remoteJid: "xxx@s.whatsapp.net" }
📝 useMessages - Evolution API response: { messagesCount: 25 }
```

### Indicadores Visuais

- **Ponto verde**: Evolution API ativa
- **Ponto azul**: Supabase ativo
- **Ícones nas mensagens**: 
  - ⚡ Mensagem da Evolution API
  - 🗄️ Mensagem do Supabase

## Solução de Problemas

### Evolution API não funciona
1. Verifique se a URL da API está correta
2. Confirme se a chave da API é válida
3. Teste a conectividade com a instância
4. Verifique se o nome da instância está correto

### Mensagens não aparecem
1. Confirme se o telefone da instância está correto
2. Verifique se a conversa selecionada existe na Evolution
3. Teste primeiro com Supabase para comparar

### Performance lenta
1. Evolution API é naturalmente mais lenta
2. Considere usar Supabase para uso normal
3. Use Evolution API apenas quando necessário

## Próximos Passos

1. **Cache híbrido**: Combinar ambos os métodos
2. **Sincronização**: Sincronizar dados entre Supabase e Evolution
3. **Interface melhorada**: Mais opções de configuração
4. **Monitoramento**: Dashboard de saúde das fontes de dados 