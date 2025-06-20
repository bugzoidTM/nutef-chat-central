# 🛠️ Instruções para Corrigir Problemas do Dashboard

## 📋 **Resumo dos Problemas Identificados**

1. **Webhook funcionando** ✅ - As mensagens estão sendo inseridas no banco
2. **Dashboard não mostra mensagens** ❌ - Possível problema de RLS ou Real-time
3. **Mensagens repetidas não aparecem** ❌ - Cache não está sendo invalidado

---

## 🚀 **Passo 1: Execute o Diagnóstico**

No console do navegador (F12), execute:

```javascript
debugHelper.debugDashboardIssues()
```

### **O que procurar nos logs:**
- ✅ "Usuário autenticado" e "Perfil encontrado"
- ✅ "Conversas encontradas: X" (se X > 0, RLS está OK)
- ✅ "Conversa de teste encontrada" (deve aparecer a conversa)
- ✅ "Mensagens de teste encontradas: X" (se X > 0, mensagens estão acessíveis)
- ✅ "Status da subscrição: SUBSCRIBED" (real-time funcionando)

---

## 🛠️ **Passo 2: Corrigir Políticas RLS (se necessário)**

Se o diagnóstico mostrar **0 conversas** ou **erros de RLS**:

1. Vá para o **Supabase SQL Editor**
2. Execute o conteúdo do arquivo `fix-dashboard-rls.sql`
3. Execute novamente o diagnóstico

---

## 🔄 **Passo 3: Testar Real-time**

No console, execute:

```javascript
debugHelper.forceRefreshDashboard()
```

### **O que deve acontecer:**
- Uma conversa de teste será criada
- Deve aparecer no dashboard em tempo real
- A conversa será removida após 10 segundos

---

## 🧪 **Passo 4: Teste Completo**

1. **Execute o teste do webhook:**
   ```javascript
   debugHelper.testWebhookVersion()
   ```

2. **Aguarde 3 segundos**

3. **Vá para o dashboard e verifique:**
   - Se a conversa apareceu na lista
   - Se você consegue clicar na conversa
   - Se as mensagens aparecem na área de chat

4. **Execute o teste novamente:**
   ```javascript
   debugHelper.testWebhookVersion()
   ```

5. **Verifique se a nova mensagem aparece sem recarregar a página**

---

## 🔍 **Passo 5: Diagnóstico por Problemas Específicos**

### **Problema: Conversas não aparecem no dashboard**
```javascript
// Teste direto da query
debugHelper.checkConversations()

// Se mostrar conversas aqui mas não no dashboard, é problema de cache
debugHelper.forceRefreshDashboard()
```

### **Problema: Mensagens não aparecem ao clicar na conversa**
```javascript
// Substitua CONVERSATION_ID pelo ID real da conversa
debugHelper.checkMessages()
```

### **Problema: Real-time não funciona**
1. Verifique se nos logs aparece "Status da subscrição: SUBSCRIBED"
2. Se não aparecer, o problema é de configuração do Supabase
3. Tente recarregar a página

---

## 🎯 **Possíveis Soluções Alternativas**

### **Se nada funcionar:**

1. **Recarregar a página** (pode ser cache do navegador)
2. **Fazer logout e login novamente**
3. **Limpar localStorage:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

### **Se Real-time não funcionar:**

Adicione logging manual no `useConversations.ts`:
```javascript
// No início da função queryFn, adicione:
console.log('🔄 Buscando conversas...', new Date().toLocaleTimeString());

// Após receber os dados:
console.log('✅ Conversas recebidas:', data?.length, new Date().toLocaleTimeString());
```

---

## 📊 **Interpretação dos Resultados**

### **Cenário 1: RLS Bloqueando**
- Diagnóstico mostra 0 conversas
- Console mostra erros tipo "RLS" ou "permission denied"
- **Solução:** Execute o SQL de correção

### **Cenário 2: Cache não Atualizando**
- Diagnóstico mostra conversas
- Dashboard não mostra ou mostra dados antigos
- **Solução:** Problemas de React Query ou Real-time

### **Cenário 3: Real-time Desconectado**  
- Mensagens aparecem após recarregar
- Status da subscrição não é "SUBSCRIBED"
- **Solução:** Verificar configuração do Supabase Realtime

---

## 🆘 **Se Nada Funcionar**

Execute este comando para ver todos os logs:

```javascript
// Ativar logs detalhados
localStorage.setItem('debug', 'true');

// Executar diagnóstico completo
await debugHelper.checkAll();
await debugHelper.debugDashboardIssues();
await debugHelper.testWebhookVersion();

// Aguardar 5 segundos e verificar
setTimeout(() => {
  debugHelper.checkConversations();
}, 5000);
```

Envie os logs completos para análise se o problema persistir! 