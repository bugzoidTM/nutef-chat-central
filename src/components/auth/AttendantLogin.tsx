
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, User, Lock, AlertCircle } from 'lucide-react';

const AttendantLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else {
          setError(loginError.message);
        }
        return;
      }

      if (data.user) {
        // Check if user is an attendant
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_active, name')
          .eq('user_id', data.user.id)
          .single();

        if (profileError || !profile) {
          setError('Usuário não encontrado no sistema');
          await supabase.auth.signOut();
          return;
        }

        if (profile.role !== 'attendant') {
          setError('Acesso restrito a atendentes. Use o login de administrador.');
          await supabase.auth.signOut();
          return;
        }

        if (!profile.is_active) {
          setError('Sua conta está inativa. Contate o administrador.');
          await supabase.auth.signOut();
          return;
        }

        toast.success(`Bem-vindo, ${profile.name}!`);
        // Redirect will be handled by the auth context
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Acesso Atendente</CardTitle>
          <CardDescription>
            Faça login para acessar o sistema de atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Primeira vez no sistema?</p>
            <p>Sua senha temporária é: <strong>temp123456</strong></p>
            <p className="text-xs mt-1">Altere-a após o primeiro acesso</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendantLogin;
