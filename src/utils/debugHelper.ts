import { supabase } from '@/integrations/supabase/client';

export const debugHelper = {
  testWebhookVersion: async () => {
    console.log('Testing webhook...');
    const random = Math.random().toString(36).substring(7);
    const testPhoneNumber = '5511964982174';
    const testMessage = `Teste webhook ${random}`;

    try {
      const response = await fetch('/api/webhooks/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instance_name: "vortex-chat-dev",
          contacts: [{ wa_id: testPhoneNumber }],
          messages: [{ type: 'text', body: testMessage }],
        }),
      });

      if (response.ok) {
        console.log('Webhook chamado com sucesso!');
      } else {
        console.error('Erro ao chamar o webhook:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Corpo da resposta de erro:', errorData);
      }
    } catch (error) {
      console.error('Erro ao chamar o webhook:', error);
    }
  },

  checkAll: async () => {
    console.log('Iniciando diagnóstico completo...');
    await debugHelper.checkAuth();
  },

  checkAuth: async () => {
    console.log('Verificando autenticação...');
    const user = await supabase.auth.getUser();
    if (user) {
      console.log('Usuário autenticado:', user);
    } else {
      console.warn('Nenhum usuário autenticado.');
    }
  },

  checkConversations: async () => {
    console.log('Verificando conversas...');
    const { data, error } = await supabase
      .from('conversations')
      .select('*');

    if (error) {
      console.error('Erro ao buscar conversas:', error);
    } else {
      console.log('Conversas encontradas:', data);
    }
  },

  checkMessages: async () => {
    console.log('Verificando mensagens...');
    const conversationId = 'c14d0938-f4b2-4847-9224-46654c77a01a'; // Substitua pelo ID da conversa que você quer testar
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
    } else {
      console.log('Mensagens encontradas:', data);
    }
  },
  
  debugDashboardIssues: async () => {
    console.log('Iniciando debug do dashboard...');

    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('✅ Usuário autenticado:', user.id);
    } else {
      console.error('❌ Usuário não autenticado.');
      return;
    }

    // Verificar se o perfil do usuário está sendo carregado corretamente
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao carregar perfil:', profileError);
      return;
    }

    if (profile) {
      console.log('✅ Perfil encontrado:', profile);
    } else {
      console.warn('⚠️ Perfil não encontrado.');
    }

    // Verificar se as conversas estão sendo carregadas corretamente
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*');

    if (conversationsError) {
      console.error('❌ Erro ao carregar conversas:', conversationsError);
      return;
    }

    if (conversations) {
      console.log('✅ Conversas encontradas:', conversations.length);
    } else {
      console.warn('⚠️ Nenhuma conversa encontrada.');
    }

    // Tentar encontrar uma conversa de teste (substitua 'ID_DA_CONVERSA_DE_TESTE' pelo ID real)
    const testConversationId = 'c14d0938-f4b2-4847-9224-46654c77a01a';
    const testConversation = conversations?.find(c => c.id === testConversationId);

    if (testConversation) {
      console.log('✅ Conversa de teste encontrada:', testConversation);
    } else {
      console.warn('⚠️ Conversa de teste não encontrada.');
    }

    // Verificar se as mensagens da conversa de teste estão sendo carregadas corretamente
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', testConversationId);

    if (messagesError) {
      console.error('❌ Erro ao carregar mensagens:', messagesError);
      return;
    }

    if (messages) {
      console.log('✅ Mensagens de teste encontradas:', messages.length);
    } else {
      console.warn('⚠️ Nenhuma mensagem de teste encontrada.');
    }
  },
  
  forceRefreshDashboard: async () => {
    console.log('🔄 Forcing dashboard refresh...');
    
    // Instead of accessing window.queryClient directly, we'll use a different approach
    try {
      // Force a page refresh to clear all caches
      console.log('🔄 Refreshing page to clear all caches...');
      window.location.reload();
    } catch (error) {
      console.error('❌ Error forcing refresh:', error);
    }
  },
};
