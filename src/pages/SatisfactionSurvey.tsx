
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const SatisfactionSurvey: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [surveyData, setSurveyData] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token de pesquisa inválido');
      setLoading(false);
      return;
    }

    loadSurveyData();
  }, [token]);

  const loadSurveyData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados da pesquisa
      const { data: surveyRequest, error: surveyError } = await supabase
        .from('satisfaction_survey_requests')
        .select(`
          id,
          conversation_id,
          status,
          expires_at,
          conversations:conversation_id (
            id,
            client_name,
            client_phone,
            assigned_to,
            sector_id,
            sectors:sector_id (
              name,
              color
            ),
            profiles:assigned_to (
              name
            )
          )
        `)
        .eq('token', token)
        .eq('status', 'sent')
        .single();

      if (surveyError || !surveyRequest) {
        throw new Error('Pesquisa não encontrada ou já foi respondida');
      }

      // Verificar se não expirou
      if (new Date(surveyRequest.expires_at) < new Date()) {
        throw new Error('Esta pesquisa de satisfação expirou');
      }

      // Verificar se já foi respondida
      const { data: existingSurvey } = await supabase
        .from('satisfaction_surveys')
        .select('id')
        .eq('conversation_id', surveyRequest.conversation_id)
        .single();

      if (existingSurvey) {
        throw new Error('Esta pesquisa já foi respondida');
      }

      setSurveyData(surveyRequest);
    } catch (err: any) {
      console.error('Erro ao carregar pesquisa:', err);
      setError(err.message || 'Erro ao carregar pesquisa');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }

    try {
      setSubmitting(true);

      // Inserir avaliação
      const { error: insertError } = await supabase
        .from('satisfaction_surveys')
        .insert({
          conversation_id: surveyData.conversation_id,
          client_phone: surveyData.conversations.client_phone,
          rating,
          comment: comment.trim() || null,
          attendant_id: surveyData.conversations.assigned_to,
          sector_id: surveyData.conversations.sector_id,
        });

      if (insertError) {
        throw insertError;
      }

      // Atualizar status da solicitação
      const { error: updateError } = await supabase
        .from('satisfaction_survey_requests')
        .update({ status: 'completed' })
        .eq('id', surveyData.id);

      if (updateError) {
        console.error('Erro ao atualizar status:', updateError);
      }

      setSubmitted(true);
      toast.success('Avaliação enviada com sucesso!');
      
    } catch (err: any) {
      console.error('Erro ao enviar avaliação:', err);
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    const labels = {
      1: 'Muito Insatisfeito',
      2: 'Insatisfeito',
      3: 'Neutro',
      4: 'Satisfeito',
      5: 'Muito Satisfeito'
    };
    return labels[rating as keyof typeof labels] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando pesquisa...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Pesquisa Indisponível
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => navigate('/')}>
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Obrigado pela sua avaliação!
              </h2>
              <p className="text-gray-600 mb-4">
                Sua opinião é muito importante para nós e nos ajuda a melhorar nossos serviços.
              </p>
              <p className="text-sm text-gray-500">
                Você pode fechar esta página.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Pesquisa de Satisfação
          </CardTitle>
          <CardDescription>
            Como foi sua experiência com nosso atendimento?
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Informações do atendimento */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">
                {surveyData?.conversations?.client_name || 'Não identificado'}
              </span>
            </div>
            {surveyData?.conversations?.profiles && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Atendente:</span>
                <span className="font-medium">
                  {surveyData.conversations.profiles.name}
                </span>
              </div>
            )}
            {surveyData?.conversations?.sectors && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Setor:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: surveyData.conversations.sectors.color }}
                  />
                  <span className="font-medium">
                    {surveyData.conversations.sectors.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Avaliação por estrelas */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Como você avalia nosso atendimento? *
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600">
                {getRatingLabel(rating)}
              </p>
            )}
          </div>

          {/* Comentário opcional */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Comentário (opcional)
            </label>
            <Textarea
              placeholder="Conte-nos mais sobre sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Botão de envio */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Sua avaliação é confidencial e nos ajuda a melhorar nossos serviços.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SatisfactionSurvey;
