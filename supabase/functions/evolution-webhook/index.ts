
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

    // Extract data from webhook
    const { event, instance, data } = body;
    console.log('📋 Event:', event, 'Instance:', instance);

    if (!instance) {
      console.log('❌ No instance found in webhook data');
      return new Response(JSON.stringify({ error: 'No instance found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the instance in our database using the new naming format
    console.log('🔍 Looking for instance with name:', instance);
    
    const { data: instanceData, error: instanceError } = await supabase
      .from('instances')
      .select('*')
      .eq('instance_name', instance)
      .single();

    if (instanceError) {
      console.log('❌ Error finding instance:', instanceError);
      return new Response(JSON.stringify({ error: 'Instance not found', details: instanceError }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Instance found:', instanceData);

    // Handle different event types
    if (event === 'messages.upsert' && data?.message) {
      console.log('📩 Processing message:', data.message);

      // Extract message data
      const message = data.message;
      const isFromMe = message.key?.fromMe || false;
      const remoteJid = message.key?.remoteJid || '';
      const messageContent = message.message?.conversation || 
                           message.message?.extendedTextMessage?.text || 
                           'Mensagem sem texto';

      console.log('📝 Message details:', {
        isFromMe,
        remoteJid,
        messageContent,
        messageType: typeof message.message
      });

      // Only process incoming messages (not sent by us)
      if (!isFromMe && remoteJid) {
        // Extract phone number from remoteJid (remove @s.whatsapp.net)
        const clientPhone = remoteJid.replace('@s.whatsapp.net', '');
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
            .update({ last_message_at: new Date().toISOString() })
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
        console.log('⏭️ Skipping message (sent by us or invalid)');
      }
    } else if (event === 'connection.update') {
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
    } else {
      console.log('ℹ️ Unhandled event type:', event);
    }

    return new Response(JSON.stringify({ success: true }), {
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
