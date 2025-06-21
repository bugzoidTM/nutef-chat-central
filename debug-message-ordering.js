// Script para debug de ordenação de mensagens
// Execute no console do navegador com o sistema aberto

const debugMessageOrdering = async () => {
  console.log('🔍 === DEBUG ORDENAÇÃO MENSAGENS ===');
  
  const { supabase } = window;
  if (!supabase) {
    console.error('❌ Supabase não disponível');
    return;
  }
  
  // Buscar conversa do Nutef (exemplo)
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .ilike('client_phone', '%551193247%')
    .limit(1);
    
  if (!conversations || conversations.length === 0) {
    console.log('❌ Conversa não encontrada');
    return;
  }
  
  const conversationId = conversations[0].id;
  console.log('🎯 Analisando conversa:', conversationId);
  
  // Buscar mensagens com diferentes ordenações
  const { data: byTimestamp } = await supabase
    .from('messages')
    .select('id, content, direction, timestamp, created_at')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true })
    .order('created_at', { ascending: true });
    
  const { data: byCreated } = await supabase
    .from('messages')
    .select('id, content, direction, timestamp, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  console.log('📊 COMPARAÇÃO DE ORDENAÇÕES:');
  console.log('─'.repeat(80));
  
  console.log('🕐 Por TIMESTAMP + CREATED_AT:');
  byTimestamp?.forEach((msg, i) => {
    const direction = msg.direction === 'outgoing' ? '📤' : '📥';
    const content = msg.content.substring(0, 30);
    const timestamp = new Date(msg.timestamp).toLocaleString('pt-BR');
    const created = new Date(msg.created_at).toLocaleString('pt-BR');
    
    console.log(`${i+1}. ${direction} ${content} | TS: ${timestamp} | CR: ${created}`);
  });
  
  console.log('\n🕐 Por CREATED_AT apenas:');
  byCreated?.forEach((msg, i) => {
    const direction = msg.direction === 'outgoing' ? '📤' : '📥';
    const content = msg.content.substring(0, 30);
    const timestamp = new Date(msg.timestamp).toLocaleString('pt-BR');
    const created = new Date(msg.created_at).toLocaleString('pt-BR');
    
    console.log(`${i+1}. ${direction} ${content} | TS: ${timestamp} | CR: ${created}`);
  });
  
  // Verificar se há diferenças significativas
  const timeDiffs = byTimestamp?.map((msg, i) => {
    const tsTime = new Date(msg.timestamp).getTime();
    const crTime = new Date(msg.created_at).getTime();
    return {
      id: msg.id,
      direction: msg.direction,
      content: msg.content.substring(0, 20),
      timeDiff: Math.abs(tsTime - crTime),
      timestampFirst: tsTime < crTime
    };
  });
  
  console.log('\n⏱️ DIFERENÇAS DE TEMPO (timestamp vs created_at):');
  timeDiffs?.forEach(diff => {
    const direction = diff.direction === 'outgoing' ? '📤' : '📥';
    const diffSec = (diff.timeDiff / 1000).toFixed(2);
    console.log(`${direction} ${diff.content} | Diff: ${diffSec}s | TS First: ${diff.timestampFirst}`);
  });
  
  return { byTimestamp, byCreated, timeDiffs };
};

// Executar automaticamente
console.log('🚀 Executando debug de ordenação...');
debugMessageOrdering(); 