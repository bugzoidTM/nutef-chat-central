
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
  console.log('🔄 WEBHOOK VERSION: v3.2.0 - IMPROVED MESSAGE PROCESSING');

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

    // Evolution API sends webhooks in the format:
    // { event: "MESSAGES_UPSERT", instance: "instanceName", data: [...] }
    const event = body.event;
    const instanceName = body.instance;
    const eventData = body.data;

    console.log('📋 Processing event:', event, 'for instance:', instanceName);

    if (!event || !instanceName) {
      console.log('❌ Missing required fields: event or instance');
      return new Response(JSON.stringify({ 
        error: 'Missing event or instance',
        received: { event, instanceName }
      }), {
        status: 400, headers: corsHeaders
      });
    }

    // Handle MESSAGES_UPSERT event - incoming messages
    if (event === 'MESSAGES_UPSERT' || event === 'messages.upsert') {
      console.log('📩 Processing MESSAGES_UPSERT event');
      
      // Find the instance in our database
      const { data: instanceData, error: instanceError } = await supabase
        .from('instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();

      if (instanceError || !instanceData) {
        console.log('❌ Instance not found:', instanceName, 'Error:', instanceError);
        
        // Log available instances for debugging
        const { data: allInstances } = await supabase
          .from('instances')
          .select('instance_name')
          .limit(10);
        console.log('📋 Available instances:', allInstances?.map(i => i.instance_name) || []);
        
        return new Response(JSON.stringify({ 
          error: 'Instance not found', 
          instance: instanceName,
          available: allInstances?.map(i => i.instance_name) || []
        }), {
          status: 404, headers: corsHeaders
        });
      }

      console.log('✅ Instance found:', instanceData.instance_name);

      // Process messages array - handle both single message and array
      const messages = Array.isArray(eventData) ? eventData : [eventData];
      console.log('🔍 Processing', messages.length, 'messages');

      let processedCount = 0;
      
      for (const message of messages) {
        try {
          console.log('💬 Processing message:', message.key?.id);
          
          // Skip messages sent by us (fromMe = true)
          if (message.key?.fromMe === true) {
            console.log('⏭️ Skipping outgoing message (fromMe = true)');
            continue;
          }

          const remoteJid = message.key?.remoteJid;
          if (!remoteJid) {
            console.log('⏭️ Skipping message without remoteJid');
            continue;
          }

          // Extract phone number from remoteJid (remove @s.whatsapp.net or @c.us)
          const clientPhone = remoteJid.replace(/@s\.whatsapp\.net|@c\.us/g, '');
          console.log('📞 Client phone:', clientPhone);

          // Extract message content
          let messageContent = '';
          let messageType = 'text';
          
          const msgObj = message.message;
          if (!msgObj) {
            console.log('⏭️ Skipping message without message content');
            continue;
          }

          // Check different message types according to WhatsApp structure
          if (msgObj.conversation) {
            messageContent = msgObj.conversation;
          } else if (msgObj.extendedTextMessage?.text) {
            messageContent = msgObj.extendedTextMessage.text;
          } else if (msgObj.imageMessage) {
            messageContent = msgObj.imageMessage.caption || '[Imagem]';
            messageType = 'image';
          } else if (msgObj.videoMessage) {
            messageContent = msgObj.videoMessage.caption || '[Vídeo]';
            messageType = 'video';
          } else if (msgObj.audioMessage) {
            messageContent = '[Áudio]';
            messageType = 'audio';
          } else if (msgObj.documentMessage) {
            messageContent = `[Documento: ${msgObj.documentMessage.title || 'Arquivo'}]`;
            messageType = 'document';
          } else if (msgObj.stickerMessage) {
            messageContent = '[Figurinha]';
            messageType = 'sticker';
          } else if (msgObj.locationMessage) {
            messageContent = '[Localização]';
            messageType = 'location';
          } else if (msgObj.contactMessage) {
            messageContent = '[Contato]';
            messageType = 'contact';
          } else {
            console.log('🔍 Unknown message type, available keys:', Object.keys(msgObj));
            messageContent = '[Mensagem não suportada]';
            messageType = 'unknown';
          }

          console.log('📝 Message content:', messageContent, 'type:', messageType);

          if (!messageContent || messageContent.trim() === '') {
            console.log('⏭️ Skipping empty message');
            continue;
          }

          // Find or create conversation
          let conversationId;
          
          const { data: existingConversation, error: convError } = await supabase
            .from('conversations')
            .select('id, status')
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

            // Update conversation timestamp and reopen if finished
            const updateData: any = { 
              last_message_at: new Date().toISOString(),
            };
            
            // If conversation was finished, reopen it
            if (existingConversation.status === 'finished') {
              updateData.status = 'new';
              updateData.assigned_to = null;
              console.log('🔄 Reopening finished conversation');
            }

            await supabase
              .from('conversations')
              .update(updateData)
              .eq('id', conversationId);
          } else {
            console.log('🆕 Creating new conversation for:', clientPhone);
            
            // Get the first active sector as default
            const { data: defaultSector } = await supabase
              .from('sectors')
              .select('id')
              .eq('is_active', true)
              .limit(1)
              .single();

            const { data: newConversation, error: newConvError } = await supabase
              .from('conversations')
              .insert({
                client_phone: clientPhone,
                client_name: message.pushName || clientPhone,
                instance_id: instanceData.id,
                sector: 'support', // Keep legacy field for compatibility
                sector_id: defaultSector?.id || null,
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
          const messageToInsert = {
            conversation_id: conversationId,
            content: messageContent,
            direction: 'incoming' as const,
            from_phone: clientPhone,
            to_phone: instanceData.phone,
            message_type: messageType,
            timestamp: new Date().toISOString(),
            whatsapp_message_id: message.key?.id || null,
          };
          
          const { error: messageError } = await supabase
            .from('messages')
            .insert(messageToInsert);

          if (messageError) {
            console.log('❌ Error inserting message:', messageError);
          } else {
            console.log('✅ Message inserted successfully');
            processedCount++;
          }
        } catch (messageProcessError) {
          console.log('❌ Error processing individual message:', messageProcessError);
        }
      }
      
      console.log('✅ Processed', processedCount, 'messages successfully');
    } 
    // Handle CONNECTION_UPDATE event
    else if (event === 'CONNECTION_UPDATE') {
      console.log('🔄 Processing CONNECTION_UPDATE event');
      
      const connectionData = eventData;
      console.log('🔌 Connection data:', connectionData);
      
      if (connectionData?.state) {
        let status = 'disconnected';
        
        switch (connectionData.state) {
          case 'open':
            status = 'connected';
            break;
          case 'connecting':
            status = 'connecting';
            break;
          case 'close':
          case 'closed':
            status = 'disconnected';
            break;
          default:
            status = 'disconnected';
        }
        
        const { error: updateError } = await supabase
          .from('instances')
          .update({ status })
          .eq('instance_name', instanceName);
          
        if (updateError) {
          console.log('❌ Error updating instance status:', updateError);
        } else {
          console.log('✅ Instance status updated to:', status);
        }
      }
    }
    // Handle QRCODE_UPDATED event
    else if (event === 'QRCODE_UPDATED') {
      console.log('📱 Processing QRCODE_UPDATED event');
      
      const qrData = eventData;
      if (qrData?.qrcode) {
        const { error: qrError } = await supabase
          .from('instances')
          .update({ 
            qr_code: qrData.qrcode,
            status: 'qr_code'
          })
          .eq('instance_name', instanceName);
          
        if (qrError) {
          console.log('❌ Error updating QR code:', qrError);
        } else {
          console.log('✅ QR code updated for instance:', instanceName);
        }
      }
    }
    // Handle other events
    else if (event === 'SEND_MESSAGE') {
      console.log('📤 SEND_MESSAGE event received (ignoring)');
    }
    else if (event === 'MESSAGES_UPDATE') {
      console.log('🔄 MESSAGES_UPDATE event received (ignoring for now)');
    }
    else if (event === 'MESSAGES_DELETE') {
      console.log('🗑️ MESSAGES_DELETE event received (ignoring for now)');
    }
    else {
      console.log('ℹ️ Unhandled event type:', event);
      console.log('ℹ️ Supported events: MESSAGES_UPSERT, CONNECTION_UPDATE, QRCODE_UPDATED');
    }

    console.log('✅ Webhook processing completed successfully');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processed successfully',
      event: event,
      instance: instanceName
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
