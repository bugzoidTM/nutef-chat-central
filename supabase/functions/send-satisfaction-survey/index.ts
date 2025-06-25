
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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { conversationId } = await req.json()

    if (!conversationId) {
      throw new Error('ID da conversa é obrigatório')
    }

    console.log('Processando envio de pesquisa de satisfação para conversa:', conversationId)

    // Buscar informações da conversa
    const { data: conversation, error: conversationError } = await supabaseClient
      .from('conversations')
      .select(`
        id,
        client_name,
        client_phone,
        assigned_to,
        sector_id,
        status,
        instances:instance_id (
          instance_name,
          phone
        ),
        sectors:sector_id (
          name
        )
      `)
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation) {
      console.error('Erro ao buscar conversa:', conversationError)
      throw new Error('Conversa não encontrada')
    }

    console.log('Conversa encontrada:', conversation)

    // Verificar se já existe uma pesquisa para esta conversa
    const { data: existingSurvey } = await supabaseClient
      .from('satisfaction_survey_requests')
      .select('id, status')
      .eq('conversation_id', conversationId)
      .single()

    if (existingSurvey) {
      console.log('Pesquisa já existe para esta conversa:', existingSurvey)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Pesquisa já foi enviada para esta conversa' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Criar registro de solicitação de pesquisa
    const { data: surveyRequest, error: surveyRequestError } = await supabaseClient
      .from('satisfaction_survey_requests')
      .insert({
        conversation_id: conversationId
      })
      .select('token')
      .single()

    if (surveyRequestError || !surveyRequest) {
      console.error('Erro ao criar solicitação de pesquisa:', surveyRequestError)
      throw new Error('Erro ao criar solicitação de pesquisa')
    }

    console.log('Solicitação de pesquisa criada:', surveyRequest)

    // URL para a pesquisa de satisfação
    const surveyUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/v1', '')}/satisfaction-survey?token=${surveyRequest.token}`

    // Mensagem da pesquisa de satisfação
    const clientName = conversation.client_name || 'Cliente'
    const sectorName = conversation.sectors?.name || 'nosso atendimento'
    
    const surveyMessage = `Olá ${clientName}! 👋

Esperamos que tenha ficado satisfeit@ com o atendimento do setor de ${sectorName}.

Sua opinião é muito importante para nós! 

Por favor, avalie nosso atendimento clicando no link abaixo:
${surveyUrl}

⭐ A avaliação leva apenas 30 segundos
🔒 Sua resposta é totalmente confidencial
💙 Obrigado por nos ajudar a melhorar!

_Esta pesquisa expira em 7 dias._`

    // Enviar mensagem via Evolution API
    try {
      const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
      const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
      
      if (!evolutionApiUrl || !evolutionApiKey) {
        console.log('Evolution API não configurada, simulando envio...')
        // Em ambiente de desenvolvimento, apenas simular o envio
        console.log('Mensagem que seria enviada:', surveyMessage)
      } else {
        const response = await fetch(`${evolutionApiUrl}/message/sendText/${conversation.instances.instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            number: conversation.client_phone,
            text: surveyMessage,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Erro na Evolution API:', errorText)
          throw new Error(`Erro ao enviar mensagem: ${response.status}`)
        }

        console.log('Mensagem enviada com sucesso via Evolution API')
      }
    } catch (evolutionError) {
      console.error('Erro ao enviar via Evolution API:', evolutionError)
      // Não falhar se houver erro no envio, apenas registrar
      console.log('Continuando sem enviar a mensagem...')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Pesquisa de satisfação enviada com sucesso',
        surveyUrl 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro ao processar pesquisa de satisfação:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
