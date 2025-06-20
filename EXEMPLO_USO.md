# Exemplo Prático de Uso - Sistema Dual de Mensagens

## Cenário 1: Problema com Webhook

### Situação
O webhook do Supabase parou de funcionar e mensagens novas não estão aparecendo no dashboard.

### Solução
1. **Abrir o Dashboard**
2. **Clicar em "Configurar Fonte de Mensagens"**
3. **Selecionar "Evolution API (Direto)"**
4. **Configurar a instância:**
   - Nome da Instância: `minha-instancia`
   - Telefone da Instância: `5511987654321`
5. **Salvar configuração**

### Resultado
✅ Mensagens aparecem imediatamente do WhatsApp  
✅ Histórico completo disponível  
✅ Mensagens em tempo real  

---

## Cenário 2: Comparar Dados

### Situação
Suspeita de que algumas mensagens foram perdidas no banco de dados.

### Solução
1. **Primeiro, verificar no Supabase:**
   - Selecionar conversa
   - Ver quantas mensagens aparecem
   - Anotar horário da última mensagem

2. **Depois, verificar na Evolution API:**
   - Trocar para "Evolution API"
   - Selecionar a mesma conversa
   - Comparar quantidade e horários

### Código de Debug
```javascript
// No console do navegador, após selecionar uma conversa:

// Ver configuração atual
const config = JSON.parse(localStorage.getItem('nutef-messages-config'));
console.log('Configuração atual:', config);

// Ver mensagens carregadas
console.log('Mensagens na tela:', document.querySelectorAll('[data-message]').length);
```

---

## Cenário 3: Configuração Múltiplas Instâncias

### Situação
Empresa com várias instâncias Evolution para diferentes setores.

### Configurações por Setor

#### Suporte Técnico
```
Fonte: Evolution API
Nome da Instância: suporte-tech
Telefone: 5511999000001
```

#### Vendas
```
Fonte: Evolution API  
Nome da Instância: vendas-online
Telefone: 5511999000002
```

#### Financeiro
```
Fonte: Supabase
(usar webhook para velocidade)
```

### Como Alternar
1. **Sidebar:** Filtrar por setor
2. **Configuração:** Ajustar fonte conforme necessário
3. **Local Storage:** Configuração salva automaticamente

---

## Cenário 4: Troubleshooting Avançado

### Verificar Conectividade Evolution API

```bash
# Testar API diretamente
curl -X POST "https://sua-evolution-api.com/chat/findMessages/sua-instancia" \
  -H "Content-Type: application/json" \
  -H "apikey: sua-chave" \
  -d '{
    "where": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net"
      }
    },
    "limit": 10
  }'
```

### Verificar Logs do Sistema

```javascript
// Console do navegador
// Ativar logs detalhados
localStorage.setItem('debug', 'true');

// Ver todas as queries do React Query
window.reactQueryClient.getQueryCache().getAll();

// Ver configuração atual
console.log(JSON.parse(localStorage.getItem('nutef-messages-config')));
```

### Estados de Loading

O sistema mostra diferentes estados:

```
🔄 "Carregando mensagens..." - Buscando da Evolution API
💾 "Buscando do banco..." - Consultando Supabase  
❌ "Erro ao carregar" - Problema na API
✅ "X mensagens carregadas" - Sucesso
```

---

## Cenário 5: Performance Otimizada

### Para Uso Diário (Produção)
```
✅ Fonte: Supabase
✅ Webhook funcionando
✅ Velocidade máxima
```

### Para Investigação/Debug
```
🔍 Fonte: Evolution API
🔍 Dados em tempo real
🔍 Histórico completo
```

### Configuração Híbrida
```javascript
// Pseudo-código para implementação futura
const useHybridMessages = (conversationId) => {
  // 1. Carregar rápido do Supabase
  const supabaseMessages = useSupabaseMessages(conversationId);
  
  // 2. Verificar Evolution API em background
  const evolutionMessages = useEvolutionMessages(conversationId, {
    enabled: supabaseMessages.data?.length === 0 // só se não tiver dados
  });
  
  // 3. Retornar a melhor fonte
  return supabaseMessages.data?.length > 0 
    ? supabaseMessages 
    : evolutionMessages;
};
```

---

## Dicas de Uso

### ✅ Boas Práticas

1. **Use Supabase por padrão** - Mais rápido para uso normal
2. **Evolution API para debug** - Quando suspeitar de problemas
3. **Configure por equipe** - Diferentes setores, diferentes configurações
4. **Monitore logs** - Console mostra o que está acontecendo
5. **Teste ambos** - Compare resultados quando houver dúvidas

### ❌ Evite

1. **Não usar Evolution API o tempo todo** - Mais lento
2. **Não ignorar configurações** - Nome da instância deve estar correto
3. **Não misturar telefones** - Cada instância tem seu número
4. **Não esquecer variáveis de ambiente** - API_URL e API_KEY necessárias

### 🔧 Configurações Recomendadas

#### Desenvolvimento
```
Fonte: Evolution API
Debug: Habilitado
Logs: Detalhados
```

#### Produção
```
Fonte: Supabase
Cache: Habilitado
Fallback: Evolution API
```

#### Manutenção
```
Fonte: Evolution API
Comparação: Com Supabase
Validação: Manual
```

---

## Monitoramento Contínuo

### Métricas para Acompanhar

1. **Tempo de carregamento:**
   - Supabase: < 1 segundo
   - Evolution API: 2-5 segundos

2. **Taxa de sucesso:**
   - Supabase: 99%+ (se webhook OK)
   - Evolution API: 95%+ (depende da rede)

3. **Completude dos dados:**
   - Compare periodicamente ambas as fontes
   - Identifique mensagens perdidas

### Alertas Sugeridos

```javascript
// Exemplo de monitoramento
const monitorMessages = async (conversationId) => {
  const supabaseCount = await getSupabaseMessageCount(conversationId);
  const evolutionCount = await getEvolutionMessageCount(conversationId);
  
  if (Math.abs(supabaseCount - evolutionCount) > 5) {
    console.warn('⚠️ Diferença significativa entre fontes:', {
      supabase: supabaseCount,
      evolution: evolutionCount,
      difference: Math.abs(supabaseCount - evolutionCount)
    });
  }
};
```

Este sistema dual garante que você sempre tenha acesso às mensagens, independente de problemas com webhooks ou APIs! 