// Script de debug para verificar mensagens
// Execute no console do navegador

const debugMessages = async () => {
  console.log('🔍 === DEBUG MENSAGENS NUTEF ===');
  
  // Importar supabase (assumindo que está disponível globalmente)
  const { supabase } = window;
  
  if (!supabase) {
    console.error('❌ Supabase não está disponível');
    return;
  }
  
  // 1. Buscar conversa do Nutef
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .ilike('client_phone', '%551193247%');
    
  if (convError) {
    console.error('❌ Erro ao buscar conversas:', convError);
    return;
  }
  
  console.log('📞 Conversas encontradas:', conversations);
  
  if (!conversations || conversations.length === 0) {
    console.log('❌ Nenhuma conversa encontrada para Nutef');
    return;
  }
  
  const nutefConversation = conversations[0];
  console.log('🎯 Conversa do Nutef:', nutefConversation);
  
  // 2. Buscar todas as mensagens desta conversa
  const { data: allMessages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', nutefConversation.id)
    .order('timestamp', { ascending: true });
    
  if (msgError) {
    console.error('❌ Erro ao buscar mensagens:', msgError);
    return;
  }
  
  console.log('📨 Todas as mensagens:', allMessages);
  
  // 3. Analisar mensagens por direção e status de leitura
  const incoming = allMessages.filter(m => m.direction === 'incoming');
  const outgoing = allMessages.filter(m => m.direction === 'outgoing');
  const unread = incoming.filter(m => m.is_read === false);
  const read = incoming.filter(m => m.is_read === true);
  
  console.log('📊 RESUMO:');
  console.log('  📥 Mensagens recebidas (incoming):', incoming.length);
  console.log('  📤 Mensagens enviadas (outgoing):', outgoing.length);
  console.log('  ❌ Não lidas (incoming + is_read=false):', unread.length);
  console.log('  ✅ Lidas (incoming + is_read=true):', read.length);
  
  console.log('📋 Mensagens não lidas:', unread);
  
  // 4. Verificar se alguma mensagem não tem o campo is_read
  const withoutIsRead = allMessages.filter(m => m.is_read === null || m.is_read === undefined);
  if (withoutIsRead.length > 0) {
    console.log('⚠️ Mensagens SEM campo is_read:', withoutIsRead);
  }
  
  return {
    conversation: nutefConversation,
    allMessages,
    incoming,
    outgoing,
    unread,
    read,
    withoutIsRead
  };
};

// Executar o debug
debugMessages(); 