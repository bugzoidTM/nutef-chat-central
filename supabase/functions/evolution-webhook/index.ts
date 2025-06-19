
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

    // Extract data from webhook - handle both single events and arrays
    let events = [];
    if (Array.isArray(body)) {
      events = body;
    } else if (body.event || body.data) {
      events = [body];
    } else {
      console.log('⚠️ Unknown webhook format:', body);
      return new Response(JSON.stringify({ error: 'Unknown webhook format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process each event
    for (const eventData of events) {
      const { event, instance, data } = eventData;
      console.log('📋 Processing event:', event, 'Instance:', instance);

      if (!instance) {
        console.log('❌ No instance found in event data');
        continue;
      }

      // Find the instance in our database using the instance name
      console.log('🔍 Looking for instance with name:', instance);
      
      const { data: instanceData, error: instanceError } = await supabase
        .from('instances')
        .select('*')
        .eq('instance_name', instance)
        .single();

      if (instanceError) {
        console.log('❌ Error finding instance:', instanceError);
        console.log('⚠️ Skipping event for unknown instance:', instance);
        continue;
      }

      console.log('✅ Instance found:', instanceData);

      // Handle different event types
      if ((event === 'messages.upsert' || event === 'MESSAGES_UPSERT') && data?.message) {
        console.log('📩 Processing message event:', data.message);

        // Extract message data
        const message = data.message;
        const isFromMe = message.key?.fromMe || false;
        const remoteJid = message.key?.remoteJid || '';
        
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
        } else {
          messageContent = '[Mensagem sem texto]';
        }

        console.log('📝 Message details:', {
          isFromMe,
          remoteJid,
          messageContent,
          messageType: typeof message.message,
          messageKeys: Object.keys(message.message || {})
        });

        // Only process incoming messages (not sent by us)
        if (!isFromMe && remoteJid) {
          // Extract phone number from remoteJid (remove @s.whatsapp.net or @c.us)
          const clientPhone = remoteJid.replace(/@s\.whatsapp\.net|@c\.us/g, '');
          console.log('📞 Client phone extracted:', clientPhone);

          // Check if conversation already exists
          let conversationId;
          const { data: existingConversation, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('client_phone', clientPhone)
            .eq('instance_id', instanceData.id)
            .single();

          if (convError && convError.code !== 'PGRST116') {
            console.log('❌ Error checking conversation:', convError);
            throw convError;
          }

          if (existingConversation) {
            conversationId = existingConversation.id;
            console.log('🔄 Using existing conversation:', conversationId);

            // Update last_message_at
            await supabase
              .from('conversations')
              .update({ 
                last_message_at: new Date().toISOString(),
                status: 'new' // Mark as new when receiving a message
              })
              .eq('id', conversationId);
          } else {
            console.log('🆕 Creating new conversation for:', clientPhone);
            
            // Create new conversation
            const { data: newConversation, error: newConvError } = await supabase
              .from('conversations')
              .insert({
                client_phone: clientPhone,
                client_name: clientPhone, // Use phone as default name
                instance_id: instanceData.id,
                sector: 'support', // Default sector
                status: 'new',
                last_message_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            if (newConvError) {
              console.log('❌ Error creating conversation:', newConvError);
              throw newConvError;
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
            throw messageError;
          }

          console.log('✅ Message inserted successfully');
        } else {
          console.log('⏭️ Skipping message (sent by us or invalid remoteJid)');
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
            .eq('instance_name', instance);
            
          console.log('✅ Instance status updated to:', status);
        }
      } else if (event === 'send.message' || event === 'SEND_MESSAGE') {
        console.log('📤 Message sent event:', data);
        // Could be used to update message status to 'sent'
      } else {
        console.log('ℹ️ Unhandled event type:', event);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: events.length }), {
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
