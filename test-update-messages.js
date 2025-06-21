// Teste para atualizar mensagens do Nutef diretamente
// Cole no console do navegador da aplicação

const testUpdateNutefMessages = async () => {
  console.log('🧪 === TESTE DE ATUALIZAÇÃO NUTEF ===');
  
  // Verificar se supabase está disponível
  if (!window.supabase) {
    console.error('❌ Supabase não disponível no window');
    return;
  }
  
  const supabase = window.supabase;
  
  try {
    // 1. Buscar a conversa do Nutef
    console.log('1️⃣ Buscando conversa do Nutef...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .ilike('client_phone', '%5511932473951%');
    
    if (convError) {
      console.error('❌ Erro ao buscar conversa:', convError);
      return;
    }
    
    if (!conversations || conversations.length === 0) {
      console.log('❌ Conversa do Nutef não encontrada');
      return;
    }
    
    const nutefConv = conversations[0];
    console.log('✅ Conversa encontrada:', nutefConv);
    
    // 2. Verificar mensagens não lidas
    console.log('2️⃣ Verificando mensagens não lidas...');
    const { data: unreadMessages, error: unreadError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', nutefConv.id)
      .eq('direction', 'incoming')
      .eq('is_read', false);
    
    if (unreadError) {
      console.error('❌ Erro ao buscar mensagens não lidas:', unreadError);
      return;
    }
    
    console.log('📨 Mensagens não lidas encontradas:', unreadMessages);
    
    if (!unreadMessages || unreadMessages.length === 0) {
      console.log('✅ Não há mensagens não lidas!');
      return;
    }
    
    // 3. Tentar marcar como lidas
    console.log('3️⃣ Marcando mensagens como lidas...');
    const { data: updatedMessages, error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', nutefConv.id)
      .eq('direction', 'incoming')
      .eq('is_read', false)
      .select('*');
    
    if (updateError) {
      console.error('❌ Erro ao atualizar mensagens:', updateError);
      return;
    }
    
    console.log('✅ Mensagens atualizadas com sucesso:', updatedMessages);
    
    // 4. Verificar se funcionou
    console.log('4️⃣ Verificando resultado...');
    const { data: checkMessages, error: checkError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', nutefConv.id)
      .eq('direction', 'incoming')
      .eq('is_read', false);
    
    if (checkError) {
      console.error('❌ Erro ao verificar resultado:', checkError);
      return;
    }
    
    console.log('📊 Mensagens não lidas após atualização:', checkMessages?.length || 0);
    
    if (checkMessages.length === 0) {
      console.log('🎉 SUCESSO! Todas as mensagens foram marcadas como lidas!');
    } else {
      console.log('⚠️ Ainda há mensagens não lidas:', checkMessages);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
};

// Executar o teste
testUpdateNutefMessages(); 