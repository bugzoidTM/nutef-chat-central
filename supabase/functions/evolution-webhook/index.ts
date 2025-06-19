
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EvolutionWebhookPayload {
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageType: string;
    messageTimestamp: number;
  };
  destination: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
  event: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    const payload: EvolutionWebhookPayload = await req.json()
    
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2))

    // Validate webhook payload
    if (!payload.instance || !payload.data || !payload.data.key) {
      console.error('Invalid webhook payload structure')
      return new Response('Invalid payload', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Skip outgoing messages (fromMe: true)
    if (payload.data.key.fromMe) {
      console.log('Skipping outgoing message')
      return new Response('OK - Outgoing message skipped', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Extract message content
    let messageContent = ''
    if (payload.data.message.conversation) {
      messageContent = payload.data.message.conversation
    } else if (payload.data.message.extendedTextMessage?.text) {
      messageContent = payload.data.message.extendedTextMessage.text
    } else {
      console.log('Unsupported message type:', payload.data.messageType)
      return new Response('OK - Unsupported message type', { 
        status: 200, 
        headers: corsHeaders 
      })
    }

    // Extract phone number (remove @s.whatsapp.net)
    const clientPhone = payload.data.key.remoteJid.replace('@s.whatsapp.net', '')
    const clientName = payload.data.pushName || null
    const instanceName = payload.instance

    console.log('Processing message:', {
      clientPhone,
      clientName,
      messageContent,
      instanceName
    })

    // Get instance information
    const { data: instance, error: instanceError } = await supabaseClient
      .from('instances')
      .select('id, phone')
      .eq('instance_name', instanceName)
      .single()

    if (instanceError || !instance) {
      console.error('Instance not found:', instanceError)
      return new Response('Instance not found', { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    // Find or create conversation
    let { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('client_phone', clientPhone)
      .eq('instance_id', instance.id)
      .single()

    if (conversationError && conversationError.code !== 'PGRST116') {
      console.error('Error finding conversation:', conversationError)
      return new Response('Database error', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Create new conversation if it doesn't exist
    if (!conversation) {
      console.log('Creating new conversation for:', clientPhone)
      
      const { data: newConversation, error: createError } = await supabaseClient
        .from('conversations')
        .insert({
          client_phone: clientPhone,
          client_name: clientName,
          instance_id: instance.id,
          sector: 'support', // Default sector, can be updated by admin
          status: 'new',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating conversation:', createError)
        return new Response('Error creating conversation', { 
          status: 500, 
          headers: corsHeaders 
        })
      }

      conversation = newConversation
    } else {
      // Update existing conversation
      const { error: updateError } = await supabaseClient
        .from('conversations')
        .update({
          client_name: clientName || conversation.client_name,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversation.id)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
      }
    }

    // Insert message
    const { data: message, error: messageError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        from_phone: clientPhone,
        to_phone: instance.phone,
        content: messageContent,
        direction: 'incoming',
        message_type: 'text',
        timestamp: new Date(payload.data.messageTimestamp * 1000).toISOString()
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return new Response('Error creating message', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    console.log('Message processed successfully:', message.id)

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: message.id,
      conversationId: conversation.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})
