
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp: number;
    pushName?: string;
    status?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the webhook payload
    const payload: EvolutionWebhookPayload = await req.json()
    
    console.log('=== EVOLUTION WEBHOOK RECEIVED ===');
    console.log('Event:', payload.event);
    console.log('Instance:', payload.instance);
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    // Only process message events
    if (payload.event !== 'messages.upsert') {
      console.log('Event not processed, only processing messages.upsert, got:', payload.event);
      return new Response(
        JSON.stringify({ message: 'Event not processed', event: payload.event }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Extract message data
    const { data } = payload
    const messageText = data.message.conversation || data.message.extendedTextMessage?.text || ''
    const fromPhone = data.key.remoteJid.replace('@s.whatsapp.net', '')
    const senderName = data.pushName || 'Usuário'
    const isFromMe = data.key.fromMe

    console.log('=== MESSAGE DETAILS ===');
    console.log('Message text:', messageText);
    console.log('From phone:', fromPhone);
    console.log('Sender name:', senderName);
    console.log('Is from me:', isFromMe);

    // Don't process messages sent by us
    if (isFromMe) {
      console.log('Message from us, ignoring');
      return new Response(
        JSON.stringify({ message: 'Message from us, ignored' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Find the instance by instance_name
    console.log('Looking for instance with name:', payload.instance);
    const { data: instance, error: instanceError } = await supabaseClient
      .from('instances')
      .select('*')
      .eq('instance_name', payload.instance)
      .single()

    if (instanceError) {
      console.error('Error finding instance:', instanceError);
      console.log('Available instances query result:', instanceError);
      
      // Try to list all instances for debugging
      const { data: allInstances } = await supabaseClient
        .from('instances')
        .select('*');
      
      console.log('All instances in database:', allInstances);
    }

    if (!instance) {
      console.error('Instance not found with name:', payload.instance);
      return new Response(
        JSON.stringify({ error: 'Instance not found', searched_name: payload.instance }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    console.log('Found instance:', instance);

    // Check if conversation already exists
    console.log('Looking for existing conversation with phone:', fromPhone, 'and instance_id:', instance.id);
    let { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('client_phone', fromPhone)
      .eq('instance_id', instance.id)
      .single()

    if (conversationError && conversationError.code !== 'PGRST116') {
      console.error('Error finding conversation (not "not found"):', conversationError);
    }

    // Create conversation if it doesn't exist
    if (!conversation) {
      console.log('Creating new conversation for phone:', fromPhone);
      const { data: newConversation, error: createError } = await supabaseClient
        .from('conversations')
        .insert({
          client_phone: fromPhone,
          client_name: senderName,
          instance_id: instance.id,
          sector: 'support',
          status: 'new',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating conversation:', createError);
        throw createError
      }

      conversation = newConversation
      console.log('New conversation created:', conversation);
    } else {
      console.log('Found existing conversation:', conversation);
      // Update existing conversation
      const { error: updateError } = await supabaseClient
        .from('conversations')
        .update({
          client_name: senderName,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversation.id)

      if (updateError) {
        console.error('Error updating conversation:', updateError);
      } else {
        console.log('Conversation updated successfully');
      }
    }

    // Insert the message
    console.log('Inserting message for conversation:', conversation.id);
    const { error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        from_phone: fromPhone,
        to_phone: instance.phone,
        content: messageText,
        direction: 'incoming',
        message_type: 'text',
        timestamp: new Date(data.messageTimestamp * 1000).toISOString()
      })

    if (messageError) {
      console.error('Error inserting message:', messageError);
      throw messageError
    }

    console.log('=== WEBHOOK PROCESSED SUCCESSFULLY ===');
    console.log('Message saved for conversation:', conversation.id);

    return new Response(
      JSON.stringify({ 
        message: 'Webhook processed successfully',
        conversation_id: conversation.id,
        message_content: messageText 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('=== ERROR PROCESSING WEBHOOK ===');
    console.error('Error details:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
