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

    // Add debug logging to understand the structure
    console.log('🔍 Raw body type:', typeof body);
    console.log('🔍 Body keys:', Object.keys(body));
    console.log('🔍 Has body.data?', !!body.data);
    console.log('🔍 Has body.event?', !!body.event);
    console.log('🔍 Has body.instance?', !!body.instance);

    // Extract event data - Evolution sends different formats
    let eventData = body;
    let messageData = body;
    
    if (body.data) {
      // Evolution API sends: { event: "...", instance: "...", data: {...} }
      // We need to preserve the event and instance from the root level
      messageData = body.data;
      eventData = {
        event: body.event,
        instance: body.instance,
        data: body.data
      };
      console.log('📦 Using wrapped data structure');
    } else {
      console.log('📦 Using direct structure (no data wrapper)');
    }

    console.log('🔄 Processing event data:', JSON.stringify(eventData, null, 2));
    console.log('🔄 Message data:', JSON.stringify(messageData, null, 2));

    // Handle message events
    if (eventData.event === 'messages.upsert' || eventData.event === 'MESSAGES_UPSERT') {
      console.log('📩 Processing message event');
      
      const messages = Array.isArray(messageData) ? messageData : [messageData];
      const instanceName = eventData.instance || body.instance;
      
      console.log('🔍 Instance name from eventData.instance:', eventData.instance);
      console.log('🔍 Instance name from body.instance:', body.instance);
      console.log('🔍 Final instance name:', instanceName);
      
      if (!instanceName) {
        console.log('❌ No instance name found in event data');
        console.log('❌ eventData:', JSON.stringify(eventData, null, 2));
        console.log('❌ body:', JSON.stringify(body, null, 2));
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
        console.log('❌ Searched for instance_name:', instanceName);
        // Let's also check what instances exist
        const { data: allInstances } = await supabase
          .from('instances')
          .select('instance_name')
          .limit(10);
        console.log('❌ Available instances:', allInstances);
        return new Response(JSON.stringify({ error: 'Instance not found' }), {
          status: 404, headers: corsHeaders
        });
      }

      console.log('✅ Instance found:', instanceData.instance_name);
      console.log('🔍 Processing messages array length:', messages.length);

      // Process messages
      for (const message of messages) {
        console.log('💬 Processing message:', JSON.stringify(message, null, 2));
        
        // Debug message structure
        console.log('🔍 Message keys:', Object.keys(message));
        console.log('🔍 Has message.key?', !!message.key);
        console.log('🔍 Has message.message?', !!message.message);
        console.log('🔍 message.key:', JSON.stringify(message.key, null, 2));
        
        // Skip messages sent by us
        if (message.key?.fromMe) {
          console.log('⏭️ Skipping message sent by us');
          continue;
        }

        const remoteJid = message.key?.remoteJid;
        console.log('🔍 remoteJid:', remoteJid);
        
        if (!remoteJid) {
          console.log('⏭️ Skipping message without remoteJid');
          continue;
        }

        // Extract phone number from remoteJid
        const clientPhone = remoteJid.replace(/@s\.whatsapp\.net|@c\.us/g, '');
        console.log('📞 Client phone extracted:', clientPhone);

        // Extract message content
        let messageContent = '';
        console.log('🔍 message.message:', JSON.stringify(message.message, null, 2));
        
        if (message.message?.conversation) {
          messageContent = message.message.conversation;
          console.log('📝 Content from conversation:', messageContent);
        } else if (message.message?.extendedTextMessage?.text) {
          messageContent = message.message.extendedTextMessage.text;
          console.log('📝 Content from extendedTextMessage:', messageContent);
        } else if (message.message?.imageMessage?.caption) {
          messageContent = message.message.imageMessage.caption || '[Imagem]';
          console.log('📝 Content from imageMessage:', messageContent);
        } else if (message.message?.videoMessage?.caption) {
          messageContent = message.message.videoMessage.caption || '[Vídeo]';
          console.log('📝 Content from videoMessage:', messageContent);
        } else if (message.message?.audioMessage) {
          messageContent = '[Áudio]';
          console.log('📝 Content from audioMessage:', messageContent);
        } else if (message.message?.documentMessage?.title) {
          messageContent = `[Documento: ${message.message.documentMessage.title}]`;
          console.log('📝 Content from documentMessage:', messageContent);
        } else {
          messageContent = '[Mensagem sem texto]';
          console.log('📝 Content fallback:', messageContent);
        }

        console.log('📝 Final extracted message content:', messageContent);

        if (!messageContent) {
          console.log('❌ Skipping message without content');
          continue;
        }

        // Check if conversation already exists
        let conversationId;
        console.log('🔍 Checking for existing conversation:', { clientPhone, instanceId: instanceData.id });
        
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
          const { error: updateError } = await supabase
            .from('conversations')
            .update({ 
              last_message_at: new Date().toISOString(),
              status: 'new'
            })
            .eq('id', conversationId);

          if (updateError) {
            console.log('❌ Error updating conversation:', updateError);
          } else {
            console.log('✅ Conversation updated successfully');
          }
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
        const messageToInsert = {
          conversation_id: conversationId,
          content: messageContent,
          direction: 'incoming',
          from_phone: clientPhone,
          to_phone: instanceData.phone,
          message_type: 'text',
          timestamp: new Date().toISOString(),
        };
        
        console.log('💬 Message to insert:', JSON.stringify(messageToInsert, null, 2));
        
        const { error: messageError } = await supabase
          .from('messages')
          .insert(messageToInsert);

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
      console.log('ℹ️ Available events to handle: messages.upsert, MESSAGES_UPSERT, connection.update, CONNECTION_UPDATE');
    }

    console.log('✅ Webhook processing completed successfully');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    console.error('❌ Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
