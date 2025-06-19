
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

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the request body
    const body = await req.json();
    console.log('📨 Webhook body received:', JSON.stringify(body, null, 2));

    // Handle different webhook formats from Evolution API
    let events = [];
    
    // Check if it's a single event with 'event' property
    if (body.event) {
      events = [body];
    }
    // Check if it's an array of events
    else if (Array.isArray(body)) {
      events = body;
    }
    // Check if it's wrapped in a 'data' property
    else if (body.data) {
      if (Array.isArray(body.data)) {
        events = body.data;
      } else {
        events = [body.data];
      }
    }
    // Fallback: treat entire body as single event
    else {
      events = [body];
    }

    console.log('📋 Processing events:', events.length);

    // Process each event
    for (const eventData of events) {
      console.log('🔄 Processing event:', JSON.stringify(eventData, null, 2));
      
      const { event, instance, instanceName, data } = eventData;
      
      // Use instanceName or instance for finding the instance
      const instanceKey = instanceName || instance;
      
      if (!instanceKey) {
        console.log('❌ No instance key found in event data');
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
        continue;
      }

      console.log('✅ Instance found:', instanceData);

      // Handle different event types
      if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
        console.log('📩 Processing message event');
        
        // Handle both single message and array of messages
        let messages = [];
        if (data?.messages) {
          messages = Array.isArray(data.messages) ? data.messages : [data.messages];
        } else if (data?.message) {
          messages = [data.message];
        } else if (data && data.key) {
          // Direct message object
          messages = [data];
        }

        console.log('📝 Found messages to process:', messages.length);

        for (const message of messages) {
          console.log('💬 Processing message:', JSON.stringify(message, null, 2));
          
          const isFromMe = message.key?.fromMe || false;
          const remoteJid = message.key?.remoteJid || '';
          
          // Skip messages sent by us
          if (isFromMe) {
            console.log('⏭️ Skipping message sent by us');
            continue;
          }

          if (!remoteJid) {
            console.log('⏭️ Skipping message without remoteJid');
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

          if (!messageContent) {
            console.log('⏭️ Skipping message without content');
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
      } else if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
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
      } else if (event === 'send.message' || event === 'SEND_MESSAGE') {
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
