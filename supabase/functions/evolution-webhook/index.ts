
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
    
    console.log('Received Evolution webhook:', JSON.stringify(payload, null, 2))

    // Only process message events
    if (payload.event !== 'messages.upsert') {
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

    // Don't process messages sent by us
    if (isFromMe) {
      return new Response(
        JSON.stringify({ message: 'Message from us, ignored' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Find the instance
    const { data: instance, error: instanceError } = await supabaseClient
      .from('instances')
      .select('*')
      .eq('instance_name', payload.instance)
      .single()

    if (instanceError || !instance) {
      console.error('Instance not found:', payload.instance)
      return new Response(
        JSON.stringify({ error: 'Instance not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Check if conversation already exists
    let { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('client_phone', fromPhone)
      .eq('instance_id', instance.id)
      .single()

    // Create conversation if it doesn't exist
    if (conversationError || !conversation) {
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
        console.error('Error creating conversation:', createError)
        throw createError
      }

      conversation = newConversation
    } else {
      // Update existing conversation
      await supabaseClient
        .from('conversations')
        .update({
          client_name: senderName,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversation.id)
    }

    // Insert the message
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
      console.error('Error inserting message:', messageError)
      throw messageError
    }

    console.log('Successfully processed webhook message')

    return new Response(
      JSON.stringify({ message: 'Webhook processed successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
