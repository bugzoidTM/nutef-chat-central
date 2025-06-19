import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Evolution webhook received request:', req.method, req.url);
  console.log('📋 Request headers:', Object.fromEntries(req.headers.entries()));
  console.log('🔍 User-Agent:', req.headers.get('user-agent'));
  console.log('🔍 Content-Type:', req.headers.get('content-type'));

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlLength: supabaseUrl?.length || 0,
      supabaseKeyLength: supabaseKey?.length || 0
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }), 
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the request body
    let body;
    try {
      body = await req.json();
      console.log('📨 Webhook body received:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Verificar se é uma chamada válida (do Evolution API ou teste autorizado)
    const isFromEvolution = req.headers.get('user-agent')?.includes('Evolution') || 
                           req.headers.get('user-agent')?.includes('WhatsApp') ||
                           body?.instance || body?.instanceName;
    
    const hasValidAuth = req.headers.get('authorization');
    
    if (!isFromEvolution && !hasValidAuth) {
      console.log('❌ Unauthorized request - not from Evolution API and no valid auth');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - webhook expects calls from Evolution API' }), 
        { status: 401, headers: corsHeaders }
      );
    }

    console.log('✅ Request authorized:', { isFromEvolution, hasValidAuth: !!hasValidAuth });

    // Handle different webhook formats from Evolution API
    let events = [];
    
    // Check if it's a single event with 'event' property
    if (body.event) {
      events = [body];
      console.log('📌 Single event detected');
    }
    // Check if it's an array of events
    else if (Array.isArray(body)) {
      events = body;
      console.log('📌 Array of events detected');
    }
    // Check if it's wrapped in a 'data' property
    else if (body.data) {
      if (Array.isArray(body.data)) {
        events = body.data;
        console.log('📌 Events in data array detected');
      } else {
        events = [body.data];
        console.log('📌 Single event in data property detected');
      }
    }
    // Fallback: treat entire body as single event
    else {
      events = [body];
      console.log('📌 Treating entire body as single event');
    }

    console.log('📋 Processing events:', events.length);

    // Process each event
    for (const eventData of events) {
      console.log('🔄 Processing event:', JSON.stringify(eventData, null, 2));
      
      const { event, instance, instanceName, data } = eventData;
      
      // Use instanceName or instance for finding the instance
      const instanceKey = instanceName || instance;
      
      if (!instanceKey) {
        console.log('❌ No instance key found in event data, available keys:', Object.keys(eventData));
        continue;
      }

      // Find the instance in our database using the instance name
      console.log('🔍 Looking for instance with name:', instanceKey);
      
      const { data: instanceData, error: instanceError } = await supabase
        .from('instances')
        .select('*')
        .eq('instance_name', instanceKey)
        .single();

      if (instanceError) {
        console.log('❌ Error finding instance:', instanceError);
        console.log('⚠️ Skipping event for unknown instance:', instanceKey);
        
        // Log available instances for debugging
        const { data: allInstances, error: listError } = await supabase
          .from('instances')
          .select('instance_name, phone')
          .limit(10);
          
        if (!listError && allInstances) {
          console.log('📝 Available instances in database:', allInstances.map(i => i.instance_name));
        }
        
        continue;
      }

      console.log('✅ Instance found:', { 
        id: instanceData.id, 
        name: instanceData.instance_name, 
        phone: instanceData.phone 
      });

      // Handle different event types - normalizar para minúsculo para comparação
      const eventLower = event?.toLowerCase() || '';
      console.log('🔍 Event received:', event, '-> normalized:', eventLower);
      
      if (eventLower === 'messages.upsert' || eventLower === 'messages_upsert' || 
          eventLower === 'messages.set' || eventLower === 'messages_set') {
        console.log('📩 Processing message event:', event);
        
        // Handle both single message and array of messages
        let messages = [];
        if (data?.messages) {
          messages = Array.isArray(data.messages) ? data.messages : [data.messages];
        } else if (data && data.key && data.message) {
          // Evolution API sends data with key and message properties
          messages = [data];
        } else if (data?.message) {
          // Fallback for other formats
          messages = [data.message];
        }

        console.log('📝 Found messages to process:', messages.length);

        for (const message of messages) {
          console.log('💬 Processing message:', JSON.stringify(message, null, 2));
          
          // Corrigir a verificação - os dados podem estar na raiz do data ou dentro de message
          const isFromMe = message.key?.fromMe || false;
          const remoteJid = message.key?.remoteJid || '';
          
          console.log('🔍 Debug message structure:', {
            hasKey: !!message.key,
            remoteJid: remoteJid,
            isFromMe: isFromMe,
            hasMessage: !!message.message,
            messageKeys: message.message ? Object.keys(message.message) : [],
            pushName: message.pushName
          });
          
          // Skip messages sent by us
          if (isFromMe) {
            console.log('⏭️ Skipping message sent by us');
            continue;
          }

          if (!remoteJid) {
            console.log('❌ Skipping message without remoteJid');
            console.log('🔍 Available message properties:', Object.keys(message));
            console.log('🔍 Full message structure:', JSON.stringify(message, null, 2));
            continue;
          }

          // Get message content from different possible locations
          let messageContent = '';
          if (message.message?.conversation) {
            messageContent = message.message.conversation;
          } else if (message.message?.extendedTextMessage?.text) {
            messageContent = message.message.extendedTextMessage.text;
          } else if (message.message?.imageMessage?.caption) {
            messageContent = message.message.imageMessage.caption || '[Imagem]';
          } else if (message.message?.videoMessage?.caption) {
            messageContent = message.message.videoMessage.caption || '[Vídeo]';
          } else if (message.message?.documentMessage?.title) {
            messageContent = `[Documento: ${message.message.documentMessage.title}]`;
          } else if (message.message?.audioMessage) {
            messageContent = '[Áudio]';
          } else if (message.pushName && !messageContent) {
            messageContent = '[Mensagem sem texto]';
          }

          console.log('📝 Extracted message content:', messageContent);

          if (!messageContent) {
            console.log('❌ Skipping message without content');
            console.log('🔍 Message structure for content extraction:', JSON.stringify(message.message, null, 2));
            continue;
          }

          // Extract phone number from remoteJid
          const clientPhone = remoteJid.replace(/@s\.whatsapp\.net|@c\.us/g, '');
          console.log('📞 Client phone extracted:', clientPhone);

          // Check if conversation already exists
          let conversationId;
          const { data: existingConversation, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('client_phone', clientPhone)
            .eq('instance_id', instanceData.id)
            .maybeSingle();

          if (convError) {
            console.log('❌ Error checking conversation:', convError);
            continue;
          }

          if (existingConversation) {
            conversationId = existingConversation.id;
            console.log('🔄 Using existing conversation:', conversationId);

            // Update last_message_at and set status to new
            await supabase
              .from('conversations')
              .update({ 
                last_message_at: new Date().toISOString(),
                status: 'new'
              })
              .eq('id', conversationId);
          } else {
            console.log('🆕 Creating new conversation for:', clientPhone);
            
            // Create new conversation
            const { data: newConversation, error: newConvError } = await supabase
              .from('conversations')
              .insert({
                client_phone: clientPhone,
                client_name: message.pushName || clientPhone,
                instance_id: instanceData.id,
                sector: 'support',
                status: 'new',
                last_message_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            if (newConvError) {
              console.log('❌ Error creating conversation:', newConvError);
              continue;
            }

            conversationId = newConversation.id;
            console.log('✅ New conversation created:', conversationId);
          }

          // Insert the message
          console.log('💬 Inserting message into conversation:', conversationId);
          const { error: messageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              content: messageContent,
              direction: 'incoming',
              from_phone: clientPhone,
              to_phone: instanceData.phone,
              message_type: 'text',
              timestamp: new Date().toISOString(),
            });

          if (messageError) {
            console.log('❌ Error inserting message:', messageError);
            continue;
          }

          console.log('✅ Message inserted successfully');
        }
      } else if (eventLower === 'connection.update' || eventLower === 'connection_update') {
        console.log('🔄 Connection update:', data);
        
        // Update instance status based on connection state
        if (data?.state) {
          const status = data.state === 'open' ? 'connected' : 
                        data.state === 'connecting' ? 'connecting' : 'disconnected';
          
          await supabase
            .from('instances')
            .update({ status })
            .eq('instance_name', instanceKey);
            
          console.log('✅ Instance status updated to:', status);
        }
      } else if (eventLower === 'send.message' || eventLower === 'send_message') {
        console.log('📤 Message sent event:', data);
        // Could be used to update message status to 'sent'
      } else {
        console.log('ℹ️ Unhandled event type:', event);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: events.length,
      message: 'Webhook processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
