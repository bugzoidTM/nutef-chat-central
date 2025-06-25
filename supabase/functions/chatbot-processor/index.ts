
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatbotRequest {
  conversationId: string;
  userInput: string;
  sectorId: string;
  clientPhone: string;
}

interface ChatbotResponse {
  knowledge_id: string;
  answer: string;
  intent: string;
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { conversationId, userInput, sectorId, clientPhone }: ChatbotRequest = await req.json()

    console.log('🤖 Processing chatbot request:', { conversationId, userInput, sectorId })

    // Check if chatbot is active for this sector
    const { data: isActive, error: activeError } = await supabaseClient.rpc(
      'is_chatbot_active',
      { p_sector_id: sectorId }
    )

    if (activeError) {
      console.error('Error checking chatbot status:', activeError)
      throw activeError
    }

    if (!isActive) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Chatbot is not active for this sector',
          shouldEscalate: true,
          escalationReason: 'Chatbot fora do horário de funcionamento'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Check for escalation keywords
    const { data: configData } = await supabaseClient
      .from('chatbot_configs')
      .select('auto_escalation_keywords, max_interaction_attempts')
      .eq('sector_id', sectorId)
      .single()

    const escalationKeywords = configData?.auto_escalation_keywords || []
    const lowerInput = userInput.toLowerCase()
    
    const hasEscalationKeyword = escalationKeywords.some((keyword: string) => 
      lowerInput.includes(keyword.toLowerCase())
    )

    if (hasEscalationKeyword) {
      // Record escalation and update context
      await supabaseClient.from('conversation_context').upsert({
        conversation_id: conversationId,
        escalation_reason: 'Cliente solicitou atendimento humano',
        bot_interaction_summary: `Cliente mencionou: "${userInput}"`
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          shouldEscalate: true,
          escalationReason: 'Cliente solicitou atendimento humano',
          response: 'Entendi que você gostaria de falar com um atendente humano. Vou transferir você agora!'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Find chatbot response
    const { data: responseData, error: responseError } = await supabaseClient.rpc(
      'find_chatbot_response',
      { 
        p_user_input: userInput,
        p_sector_id: sectorId 
      }
    )

    if (responseError) {
      console.error('Error finding chatbot response:', responseError)
      throw responseError
    }

    const chatbotResponse: ChatbotResponse | null = responseData?.[0] || null

    if (!chatbotResponse) {
      // No suitable response found, escalate
      await supabaseClient.from('conversation_context').upsert({
        conversation_id: conversationId,
        escalation_reason: 'Nenhuma resposta adequada encontrada na base de conhecimento',
        bot_interaction_summary: `Cliente perguntou: "${userInput}" - Sem resposta na base`
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          shouldEscalate: true,
          escalationReason: 'Pergunta fora da base de conhecimento',
          response: 'Desculpe, não consegui entender sua pergunta. Vou conectar você com um de nossos atendentes.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Record the interaction
    await supabaseClient.from('chatbot_interactions').insert({
      conversation_id: conversationId,
      intent_detected: chatbotResponse.intent,
      confidence_score: chatbotResponse.confidence,
      knowledge_used_id: chatbotResponse.knowledge_id,
      user_input: userInput,
      bot_response: chatbotResponse.answer,
      escalated_to_human: false
    })

    // Update conversation context
    await supabaseClient.from('conversation_context').upsert({
      conversation_id: conversationId,
      bot_interaction_summary: `Bot respondeu sobre: ${chatbotResponse.intent || 'pergunta geral'}`,
      collected_data: {
        lastIntent: chatbotResponse.intent,
        lastConfidence: chatbotResponse.confidence,
        interactionCount: 1 // This should be incremented properly
      }
    })

    // Send the bot response as a message
    await supabaseClient.from('messages').insert({
      conversation_id: conversationId,
      from_phone: 'CHATBOT',
      to_phone: clientPhone,
      content: chatbotResponse.answer,
      message_type: 'text',
      direction: 'outgoing',
      sender_name: 'Assistente Virtual',
      sender_sector: 'Chatbot'
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: chatbotResponse.answer,
        intent: chatbotResponse.intent,
        confidence: chatbotResponse.confidence,
        shouldEscalate: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in chatbot processor:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        shouldEscalate: true,
        escalationReason: 'Erro interno do sistema'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
