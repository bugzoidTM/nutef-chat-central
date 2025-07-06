
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Shield, User, AlertCircle, ArrowLeft } from 'lucide-react';

const AuthPage = () => {
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('admin');

  // Redirect if already authenticated
  useEffect(() => {
    if (profile) {
      window.location.href = '/';
    }
  }, [profile]);

  const handleAdminLogin = async (e: React.FormEvent) => {
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
        // Check if user is an admin
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

        if (profile.role !== 'admin') {
          setError('Acesso restrito a administradores.');
          await supabase.auth.signOut();
          return;
        }

        toast.success(`Bem-vindo, ${profile.name}!`);
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendantLogin = async (e: React.FormEvent) => {
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
          setError('Acesso restrito a atendentes. Use o login de administrador se necessário.');
          await supabase.auth.signOut();
          return;
        }

        if (!profile.is_active) {
          setError('Sua conta está inativa. Contate o administrador.');
          await supabase.auth.signOut();
          return;
        }

        toast.success(`Bem-vindo, ${profile.name}!`);
        window.location.href = '/';
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
          <CardTitle className="text-2xl">Sistema de Atendimento</CardTitle>
          <CardDescription>
            Escolha o tipo de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Administrador
              </TabsTrigger>
              <TabsTrigger value="attendant" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Atendente
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin" className="space-y-4 mt-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold">Acesso Administrativo</h3>
                <p className="text-sm text-gray-500">Gerencie o sistema e atendentes</p>
              </div>
              
              <form onSubmit={handleAdminLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@empresa.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Senha</Label>
                  <Input
                    id="admin-password"
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
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar como Admin'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="attendant" className="space-y-4 mt-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold">Acesso Atendente</h3>
                <p className="text-sm text-gray-500">Atenda conversas e clientes</p>
              </div>
              
              <form onSubmit={handleAttendantLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="attendant-email">Email</Label>
                  <Input
                    id="attendant-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="atendente@empresa.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="attendant-password">Senha</Label>
                  <Input
                    id="attendant-password"
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
                    'Entrar como Atendente'
                  )}
                </Button>
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  <p>Primeira vez no sistema?</p>
                  <p>Sua senha temporária é: <strong>temp123456</strong></p>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
