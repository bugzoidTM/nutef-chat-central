# 🚀 Guia Rápido - Fase 4: Sistema de Encaminhamento

## ⚡ Implementação Rápida

### 1. Aplicar Migrações
```bash
# Conectar ao banco Supabase
psql -h your-project-ref.supabase.co -d postgres -U postgres

# Executar script da Fase 4
\i apply-phase4-migrations.sql

# Verificar instalação
SELECT * FROM conversation_queue LIMIT 5;
SELECT get_queue_stats();
```

### 2. Verificar Estrutura
```sql
-- Tabelas criadas
\d conversation_queue
\d+ conversation_transfers

-- Funções disponíveis
\df get_queue_stats
\df process_queue_timeouts
\df cleanup_queue_items
```

### 3. Teste Rápido da Interface

#### Como Admin:
1. Login no sistema
2. Navegar para **"Fila de Atendimento"**
3. Verificar estatísticas e conversas aguardando
4. Navegar para **"Transferências"**
5. Visualizar histórico

#### Como Atendente:
1. Login no sistema
2. Visualizar conversas disponíveis na fila
3. Clicar em **"Atender"** para pegar uma conversa
4. Observar timeout de 5 minutos

## 🎯 Funcionalidades Principais

### Sistema de Filas
- ✅ **Auto-adição**: Conversas novas entram automaticamente na fila
- ✅ **Priorização**: Normal (1), Média (2), Alta (3)
- ✅ **Timeout**: 5 minutos para resposta
- ✅ **Reatribuição**: Automática após timeout
- ✅ **Estatísticas**: Dashboard em tempo real

### Histórico de Transferências
- ✅ **Transferências Pendentes**: Seção destacada
- ✅ **Filtros**: Status, setor, atendente, data
- ✅ **Ações**: Aceitar/rejeitar diretamente
- ✅ **Auditoria**: Registro completo de todas as ações

## 🔧 Configurações Importantes

### Timeout de Resposta
```sql
-- Modificar timeout padrão (5 minutos)
-- Em: mark_queue_timeout() function
-- Linha: NEW.timeout_at := NOW() + INTERVAL '5 minutes';
```

### Auto-Reatribuição
```typescript
// Controle no componente QueueManagement
const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);

// Toggle disponível para administradores
<Switch
  checked={autoAssignEnabled}
  onCheckedChange={setAutoAssignEnabled}
/>
```

### Limpeza Automática
```sql
-- Executar diariamente via cron
SELECT cleanup_queue_items();

-- Remove:
-- - Itens completados há mais de 7 dias
-- - Itens timeout há mais de 24 horas
```

## 📊 Monitoramento

### Métricas Chave
```sql
-- Estatísticas gerais
SELECT get_queue_stats();

-- Por setor específico
SELECT get_queue_stats('sector-uuid');

-- Conversas com timeout
SELECT COUNT(*) FROM conversation_queue WHERE status = 'timeout';

-- Taxa de reatribuição
SELECT 
  COUNT(*) FILTER (WHERE is_automatic = true) as automatic_transfers,
  COUNT(*) as total_transfers,
  ROUND(COUNT(*) FILTER (WHERE is_automatic = true) * 100.0 / COUNT(*), 2) as auto_percentage
FROM conversation_transfers
WHERE DATE(created_at) = CURRENT_DATE;
```

### Alertas Recomendados
```sql
-- Alta taxa de timeout (>20%)
SELECT 
  CASE 
    WHEN timeout_rate > 20 THEN 'ALERTA: Taxa de timeout alta'
    ELSE 'OK'
  END as status
FROM (
  SELECT 
    COUNT(*) FILTER (WHERE status = 'timeout') * 100.0 / 
    NULLIF(COUNT(*), 0) as timeout_rate
  FROM conversation_queue
  WHERE DATE(created_at) = CURRENT_DATE
) stats;

-- Fila muito longa (>10 conversas aguardando)
SELECT 
  CASE 
    WHEN waiting_count > 10 THEN 'ALERTA: Fila longa'
    ELSE 'OK'
  END as status
FROM (
  SELECT COUNT(*) as waiting_count
  FROM conversation_queue
  WHERE status = 'waiting'
) stats;
```

## 🚨 Troubleshooting

### Problema: Conversas não entram na fila
```sql
-- Verificar trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_queue';

-- Testar manualmente
INSERT INTO conversation_queue (conversation_id, sector_id, priority)
SELECT id, sector_id, 1
FROM conversations 
WHERE status = 'new' AND assigned_to IS NULL;
```

### Problema: Timeout não funciona
```sql
-- Verificar conversas com timeout vencido
SELECT * FROM conversation_queue 
WHERE status = 'assigned' 
AND timeout_at < NOW();

-- Executar processamento manual
SELECT process_queue_timeouts();
```

### Problema: Políticas RLS bloqueando acesso
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'conversation_queue';

-- Testar acesso como usuário específico
SET ROLE authenticator;
SET "request.jwt.claims" = '{"sub":"user-uuid","role":"admin"}';
SELECT * FROM conversation_queue LIMIT 1;
RESET ROLE;
```

## 🎨 Personalização da Interface

### Cores das Prioridades
```typescript
// Em QueueManagement.tsx
const getPriorityLabel = (priority: number) => {
  if (priority >= 3) return { label: 'Alta', color: 'bg-red-100 text-red-800' };
  if (priority >= 2) return { label: 'Média', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Normal', color: 'bg-green-100 text-green-800' };
};
```

### Tempo de Atualização
```typescript
// Modificar intervalo de atualização
const { data: queueItems } = useQuery({
  queryKey: ['queue-items'],
  queryFn: fetchQueueItems,
  refetchInterval: 10000, // 10 segundos (padrão)
});
```

## 📈 Otimizações de Performance

### Índices Adicionais
```sql
-- Para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_queue_created_waiting 
ON conversation_queue(created_at) 
WHERE status = 'waiting';

CREATE INDEX IF NOT EXISTS idx_transfers_date 
ON conversation_transfers(DATE(created_at));
```

### Cache de Estatísticas
```sql
-- Criar view materializada para estatísticas
CREATE MATERIALIZED VIEW queue_stats_cache AS
SELECT 
  sector_id,
  COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
  COUNT(*) FILTER (WHERE status = 'assigned') as assigned,
  COUNT(*) FILTER (WHERE status = 'timeout') as timeout,
  AVG(EXTRACT(EPOCH FROM (COALESCE(assigned_at, NOW()) - created_at)) / 60) as avg_wait_time
FROM conversation_queue
GROUP BY sector_id;

-- Atualizar cache periodicamente
REFRESH MATERIALIZED VIEW queue_stats_cache;
```

## ✅ Checklist de Implementação

### Banco de Dados
- [ ] Migração executada com sucesso
- [ ] Tabela `conversation_queue` criada
- [ ] Triggers funcionando
- [ ] Políticas RLS ativas
- [ ] Funções SQL disponíveis

### Interface
- [ ] Menu "Fila de Atendimento" visível para admins
- [ ] Menu "Transferências" visível para admins
- [ ] Estatísticas carregando corretamente
- [ ] Botões de ação funcionando
- [ ] Filtros aplicando corretamente

### Funcionalidades
- [ ] Conversas novas entram na fila automaticamente
- [ ] Atendentes podem pegar conversas da fila
- [ ] Timeout de 5 minutos funcionando
- [ ] Reatribuição automática ativa
- [ ] Transferências manuais funcionando
- [ ] Histórico de transferências visível

### Monitoramento
- [ ] Estatísticas em tempo real
- [ ] Métricas de performance
- [ ] Alertas configurados
- [ ] Limpeza automática agendada

---

## 🎉 Conclusão

A **Fase 4** está implementada e funcional! O sistema agora possui:

✅ **Fila inteligente** com priorização e timeout automático  
✅ **Reatribuição automática** para garantir SLA  
✅ **Histórico completo** de transferências  
✅ **Dashboard de métricas** em tempo real  
✅ **Interface responsiva** para admins e atendentes  

**Próximo passo**: Monitorar métricas e ajustar configurações conforme necessário.

Para suporte, consulte a documentação completa em `FASE4_RESUMO_IMPLEMENTACAO.md`. 