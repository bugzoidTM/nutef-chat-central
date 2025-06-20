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
  console.log('🔄 WEBHOOK VERSION: v2.1.0 - FIXED EVENTDATA LOGIC');

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }), 
        { status: 500, headers: corsHeaders }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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

    // CORREÇÃO: Extract event data - Evolution sends different formats
    let eventData;
    let messageData;
    
    console.log('🔍 body.event value:', body.event);
    console.log('🔍 body.instance value:', body.instance);
    
    if (body.data) {
      // Evolution API sends: { event: "...", instance: "...", data: {...} }
      console.log('📦 Using wrapped data structure');
      messageData = body.data;
      eventData = {
        event: body.event,
        instance: body.instance,
        data: body.data
      };
      console.log('🔧 eventData created:', JSON.stringify(eventData, null, 2));
    } else {
      console.log('📦 Using direct structure (no data wrapper)');
      eventData = body;
      messageData = body;
    }

    console.log('🔍 eventData.event value:', eventData.event);
    console.log('🔍 eventData.instance value:', eventData.instance);

    // Handle message events
    if (eventData.event === 'messages.upsert' || eventData.event === 'MESSAGES_UPSERT') {
      console.log('📩 Processing message event');
      
      const messages = Array.isArray(messageData) ? messageData : [messageData];
      const instanceName = eventData.instance || body.instance;
      
      if (!instanceName) {
        console.log('❌ No instance name found in event data');
        return new Response(JSON.stringify({ error: 'No instance name' }), {
          status: 400, headers: corsHeaders
        });
      }

      console.log('🔍 Looking for instance with name:', instanceName);
      
      // Find the instance in our database
      const { data: instanceData, error: instanceError } = await supabase
        .from('instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();

      if (instanceError || !instanceData) {
        console.log('❌ Error finding instance:', instanceError);
        return new Response(JSON.stringify({ error: 'Instance not found' }), {
          status: 404, headers: corsHeaders
        });
      }

      console.log('✅ Instance found:', instanceData.instance_name);

      // Process messages
      for (const message of messages) {
        console.log('💬 Processing message:', JSON.stringify(message, null, 2));
        
        // Skip messages sent by us
        if (message.key?.fromMe) {
          console.log('⏭️ Skipping message sent by us');
          continue;
        }

        const remoteJid = message.key?.remoteJid;
        if (!remoteJid) {
          console.log('⏭️ Skipping message without remoteJid');
          continue;
        }

        // Extract phone number from remoteJid
        const clientPhone = remoteJid.replace(/@s\.whatsapp\.net|@c\.us/g, '');
        console.log('📞 Client phone extracted:', clientPhone);

        // Extract message content
        let messageContent = '';
        if (message.message?.conversation) {
          messageContent = message.message.conversation;
        } else if (message.message?.extendedTextMessage?.text) {
          messageContent = message.message.extendedTextMessage.text;
        } else if (message.message?.imageMessage?.caption) {
          messageContent = message.message.imageMessage.caption || '[Imagem]';
        } else if (message.message?.videoMessage?.caption) {
          messageContent = message.message.videoMessage.caption || '[Vídeo]';
        } else if (message.message?.audioMessage) {
          messageContent = '[Áudio]';
        } else if (message.message?.documentMessage?.title) {
          messageContent = `[Documento: ${message.message.documentMessage.title}]`;
        } else {
          messageContent = '[Mensagem sem texto]';
        }

        console.log('📝 Final extracted message content:', messageContent);

        if (!messageContent) {
          console.log('❌ Skipping message without content');
          continue;
        }

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

          // Update last_message_at and set status to new if finished
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
    } else if (eventData.event === 'connection.update' || eventData.event === 'CONNECTION_UPDATE') {
      console.log('🔄 Connection update:', eventData.data);
      
      const instanceName = eventData.instance || eventData.instanceName;
      const connectionData = eventData.data || eventData;
      
      if (instanceName && connectionData?.state) {
        const status = connectionData.state === 'open' ? 'connected' : 
                      connectionData.state === 'connecting' ? 'connecting' : 'disconnected';
        
        await supabase
          .from('instances')
          .update({ status })
          .eq('instance_name', instanceName);
          
        console.log('✅ Instance status updated to:', status);
      }
    } else {
      console.log('ℹ️ Unhandled event type:', eventData.event);
    }

    return new Response(JSON.stringify({ 
      success: true, 
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