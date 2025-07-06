
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, ArrowLeft } from 'lucide-react';

const InitialSetup = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();

  console.log('InitialSetup - Rendered for user:', user?.id, 'profile:', profile);

  const handleBack = async () => {
    await signOut();
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    console.log('InitialSetup - Completing setup for user:', user.id);

    setLoading(true);

    try {
      // Buscar o setor "Suporte" para atribuir como padrão
      const { data: supportSector, error: sectorError } = await supabase
        .from('sectors')
        .select('id')
        .eq('name', 'Suporte')
        .eq('is_active', true)
        .single();

      if (sectorError) {
        console.error('InitialSetup - Error finding support sector:', sectorError);
      }

      const profileData = {
        setup_completed: true,
        sector: 'support' as const, // Setor enum padrão
        sector_id: supportSector?.id || null, // ID do setor dinâmico
      };

      // Primeiro, verificar se o perfil já existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('InitialSetup - Error checking existing profile:', checkError);
        throw checkError;
      }

      if (existingProfile) {
        // Se o perfil existe, apenas atualizar
        console.log('InitialSetup - Updating existing profile with support sector');
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('InitialSetup - Update error:', updateError);
          throw updateError;
        }
      } else {
        // Se não existe perfil, criar um novo
        console.log('InitialSetup - Creating new profile with support sector');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            role: 'admin',
            phone: '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            ...profileData,
          });

        if (insertError) {
          console.error('InitialSetup - Insert error:', insertError);
          // Se for erro de duplicata, ignorar e tentar atualizar
          if (insertError.code === '23505') {
            console.log('InitialSetup - Profile already exists, trying to update instead');
            const { error: updateError } = await supabase
              .from('profiles')
              .update(profileData)
              .eq('user_id', user.id);

            if (updateError) {
              console.error('InitialSetup - Update after duplicate error:', updateError);
              throw updateError;
            }
          } else {
            throw insertError;
          }
        }
      }

      console.log('InitialSetup - Profile operation completed successfully with support sector');

      toast({
        title: "Configuração inicial concluída",
        description: "Você foi atribuído ao setor de Suporte. Agora vamos configurar sua instância WhatsApp.",
      });

      // Forçar recarregamento da página para atualizar o estado
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('InitialSetup - Error:', error);
      toast({
        title: "Erro na configuração",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Smartphone className="h-16 w-16 text-green-600" />
            <div className="w-10" />
          </div>
          <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>
            Complete a configuração para usar o WhatsApp (será atribuído ao setor Suporte)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Configurando...' : 'Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InitialSetup;
