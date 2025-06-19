import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, User, ArrowLeft } from 'lucide-react';

const InitialSetup = () => {
  const [name, setName] = useState('');
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

    console.log('InitialSetup - Starting setup with data:', { name });

    setLoading(true);

    try {
      let profileData = {
        name,
        setup_completed: true,
      };

      // Se não existe perfil, criar um novo
      if (!profile) {
        console.log('InitialSetup - Creating new profile');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email, // Usar o email do usuário já cadastrado
            role: 'admin',
            phone: '', // Será preenchido na próxima tela
            ...profileData,
          });

        if (insertError) {
          console.error('InitialSetup - Insert error:', insertError);
          throw insertError;
        }
      } else {
        // Se existe perfil, atualizar
        console.log('InitialSetup - Updating existing profile');
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('InitialSetup - Update error:', updateError);
          throw updateError;
        }
      }

      console.log('InitialSetup - Profile operation completed successfully');

      toast({
        title: "Configuração inicial concluída",
        description: "Agora vamos configurar sua instância WhatsApp.",
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
            <div className="w-10" /> {/* Espaçador para centralizar o ícone */}
          </div>
          <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>
            Complete seus dados para configurar o WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <Label htmlFor="name" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Nome completo</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
            
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
